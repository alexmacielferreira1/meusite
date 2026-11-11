import hashlib
import hmac
import os
import re
import secrets
import threading
import time
import unicodedata
from datetime import timedelta
from functools import cache
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.db import engine
from app.security.bloqueio_login import (
    MENSAGEM_CADASTRO,
    MENSAGEM_LOGIN,
    BloqueioLogin,
    RegraBloqueio,
)
from app.security.limite import ip_do_pedido

router = APIRouter(prefix="/auth")
SECURE = os.getenv("COOKIE_SECURE", "true").lower() == "true"
COOKIE = "__Host-meusite" if SECURE else "meusite-dev"
SESSION_TTL = 7 * 86400


class Credentials(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)


class Origin(BaseModel):
    """Etiquetas UTM do link que trouxe a pessoa (anúncio, grupo, parceiro)."""

    source: str | None = Field(default=None, max_length=200)
    medium: str | None = Field(default=None, max_length=200)
    campaign: str | None = Field(default=None, max_length=200)
    content: str | None = Field(default=None, max_length=200)


class Registration(Credentials):
    name: str = Field(min_length=1, max_length=120)
    origin: Origin | None = None


def clean_tag(value):
    """Etiqueta em minúsculas, sem acento e só com letras, números, ponto, _ e -; vazia = None."""
    if not value:
        return None
    plain = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    tag = re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9._-]", "-", plain)).strip("-._")
    return tag[:60] or None


def origin_columns(origin):
    fields = origin.model_dump() if origin else {}
    return {f"origin_{key}": clean_tag(fields.get(key)) for key in ORIGIN_KEYS}


ORIGIN_KEYS = ("source", "medium", "campaign", "content")


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


# Custo do scrypt (r=8): memória = 128 * 8 * n. A instância tem 512 MB, então cada hash novo usa
# 2**15 = 32 MiB e no máximo HASH_SLOTS rodam juntos. Hashes antigos ("sal:hash", 2**17 = 128 MiB)
# continuam valendo, um por vez (LEGACY_SLOT), e são refeitos no próximo login certo.
SCRYPT_LOG = 15
LEGACY_LOG = 17
HASH_SLOTS = threading.BoundedSemaphore(2)
LEGACY_SLOT = threading.BoundedSemaphore(1)
HASH_WAIT = 15  # segundos esperando vaga antes de responder 503
DUMMY_HASH = f"s{SCRYPT_LOG}:{'00' * 16}:{'00' * 64}"  # e-mail inexistente custa o mesmo tempo


def busy():
    return HTTPException(503, "Servidor ocupado. Tente de novo em instantes.")


def scrypt_hex(password, salt, log):
    """scrypt com limite de execuções simultâneas (o cálculo libera o GIL e usa muita memória)."""
    if not HASH_SLOTS.acquire(timeout=HASH_WAIT):
        raise busy()
    try:
        n = 2**log
        return hashlib.scrypt(
            password.encode(), salt=salt, n=n, r=8, p=1, maxmem=2 * 128 * 8 * n
        ).hex()
    finally:
        HASH_SLOTS.release()


def make_password(password):
    """Valor guardado em accounts.password_hash: "s<log>:<sal>:<hash>"."""
    salt = secrets.token_bytes(16)
    return f"s{SCRYPT_LOG}:{salt.hex()}:{scrypt_hex(password, salt, SCRYPT_LOG)}"


def check_password(password, stored):
    """Devolve (confere, precisa_refazer). Formato desconhecido nunca confere."""
    parts = str(stored or "").split(":")
    legacy = len(parts) == 2
    if not legacy and (len(parts) != 3 or parts[0] != f"s{SCRYPT_LOG}"):
        return False, False
    try:
        salt = bytes.fromhex(parts[-2])
    except ValueError:
        return False, False
    if not legacy:
        return hmac.compare_digest(scrypt_hex(password, salt, SCRYPT_LOG), parts[-1]), False
    if not LEGACY_SLOT.acquire(timeout=HASH_WAIT):
        raise busy()
    try:
        ok = hmac.compare_digest(scrypt_hex(password, salt, LEGACY_LOG), parts[-1])
    finally:
        LEGACY_SLOT.release()
    return ok, ok


def bucket_of(request, action, period, key):
    address = request.client.host if request.client else "unknown"
    return f"{action}:{digest(key or address)}:{int(time.time()) // period}"


def check_limit(request, action, cap, period=600, key=None):
    """Recusa (429) se o balde já chegou ao limite, sem contar mais uma tentativa."""
    with engine.connect() as conn:
        hits = conn.execute(
            text("SELECT hits FROM rate_limits WHERE bucket = :bucket"),
            {"bucket": bucket_of(request, action, period, key)},
        ).scalar()
    if (hits or 0) >= cap:
        raise HTTPException(429, "Muitas tentativas. Tente mais tarde.")


def rate_limit(request, action, cap, period=600, key=None):
    """Conta uma tentativa por IP (ou pela chave dada, ex.: e-mail) e recusa acima do limite."""
    now = int(time.time())
    bucket = bucket_of(request, action, period, key)
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM rate_limits WHERE expires_at <= :now"), {"now": now})
        hits = conn.execute(
            text("""INSERT INTO rate_limits (bucket, hits, expires_at)
            VALUES (:bucket, 1, :expires) ON CONFLICT(bucket)
            DO UPDATE SET hits = rate_limits.hits + 1 RETURNING hits"""),
            {"bucket": bucket, "expires": (now // period + 1) * period},
        ).scalar_one()
    if hits > cap:
        raise HTTPException(429, "Muitas tentativas. Tente mais tarde.")


def admin_emails():
    """Administradores fixos (ADMIN_EMAILS, separados por vírgula). Não podem ser removidos pela tela."""
    return {
        item.strip().lower() for item in os.getenv("ADMIN_EMAILS", "").split(",") if item.strip()
    }


def is_admin_email(email):
    """Administrador fixo (ADMIN_EMAILS) ou adicionado na aba Administradores."""
    email = str(email or "").strip().lower()
    if email in admin_emails():
        return True
    with engine.connect() as conn:
        return (
            conn.execute(
                text("SELECT 1 FROM admins WHERE email = :email"), {"email": email}
            ).first()
            is not None
        )


def user_from_session(request: Request):
    token = request.cookies.get(COOKIE, "")
    if token and len(token) <= 100:
        with engine.connect() as conn:
            row = (
                conn.execute(
                    text("""SELECT a.id, a.name, a.email FROM accounts a
                JOIN sessions s ON s.account_id = a.id
                WHERE s.token_hash = :token AND s.expires_at > :now AND a.disabled = :off"""),
                    {"token": digest(token), "now": int(time.time()), "off": False},
                )
                .mappings()
                .first()
            )
        if row:
            return dict(row)
    raise HTTPException(401, "Entre para continuar.")


def open_session(conn, request, response, account):
    now = int(time.time())
    token = secrets.token_urlsafe(32)
    previous = request.cookies.get(COOKIE)
    conn.execute(
        text("DELETE FROM sessions WHERE expires_at <= :now OR token_hash = :old"),
        {"now": now, "old": digest(previous) if previous else ""},
    )
    conn.execute(
        text("INSERT INTO sessions VALUES (:token, :id, :expires)"),
        {"token": digest(token), "id": account["id"], "expires": now + SESSION_TTL},
    )
    conn.execute(
        text("UPDATE accounts SET last_seen_at = :now WHERE id = :id"),
        {"now": now, "id": account["id"]},
    )
    response.set_cookie(
        COOKIE, token, max_age=SESSION_TTL, secure=SECURE, httponly=True, samesite="lax", path="/"
    )
    # Já devolve se a conta é administradora: o menu aparece logo após entrar, sem recarregar.
    return {**account, "admin": is_admin_email(account["email"])}


REGISTER_REFUSED = MENSAGEM_CADASTRO  # kit _kit_web: mesma recusa para admin e e-mail já usado
# Kit _kit_web 0.2.0: 5 senhas por par (conta, IP) em 15 min, depois 15 min de bloqueio do par;
# a conta toda (somando IPs) aceita até 20 na janela. Terceiro não trava o titular em outro IP.
LOGIN_RULE = RegraBloqueio(
    max_tentativas=5, janela=timedelta(minutes=15), bloqueio=timedelta(minutes=15), teto_conta=20
)
DEV_LOGIN_SECRET = "meusite-dev-login-hmac-nao-usar-em-producao"


@cache
def get_bloqueio():
    """Bloqueio de login do kit. Em produção (COOKIE_SECURE) exige LOGIN_HMAC_SECRET (16+)."""
    secret = os.getenv("LOGIN_HMAC_SECRET", "").strip()
    if not secret:
        if SECURE:
            raise RuntimeError("Defina LOGIN_HMAC_SECRET (16+ caracteres) no painel.")
        secret = DEV_LOGIN_SECRET
    return BloqueioLogin(engine, secret, LOGIN_RULE)


def release_login(email):
    """Senha nova (administração ou servidor): a conta volta a entrar de qualquer IP."""
    get_bloqueio().liberar_conta(email)


@router.post("/register", status_code=201)
def register(body: Registration, request: Request, response: Response):
    rate_limit(request, "register", 10, 3600)
    email = body.email.strip().lower()
    name = body.name.strip()
    if not name or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(422, "Informe um nome e e-mail válidos.")
    rate_limit(request, "register-email", 5, 3600, key=email)
    # O hash vem antes das recusas: e-mail de administrador e e-mail já usado levam o mesmo tempo
    # e recebem a mesma resposta (não revela quem é admin nem quem tem conta).
    password = make_password(body.password)
    if is_admin_email(email):
        # Sem confirmação de e-mail, quem cadastrasse primeiro um e-mail de administrador viraria
        # admin. A conta do administrador é criada pelo servidor (scripts/criar_admin.ps1).
        raise HTTPException(409, REGISTER_REFUSED)
    account = {"id": str(uuid4()), "name": name, "email": email}
    try:
        with engine.begin() as conn:
            conn.execute(
                text("""INSERT INTO accounts (id, name, email, password_hash, created_at,
                origin_source, origin_medium, origin_campaign, origin_content)
                VALUES (:id, :name, :email, :password, :now,
                :origin_source, :origin_medium, :origin_campaign, :origin_content)"""),
                {
                    **account,
                    **origin_columns(body.origin),
                    "password": password,
                    "now": int(time.time()),
                },
            )
            return open_session(conn, request, response, account)
    except IntegrityError:
        raise HTTPException(409, REGISTER_REFUSED) from None


@router.post("/login")
def login(body: Credentials, request: Request, response: Response):
    rate_limit(request, "login", 15)
    email = body.email.strip().lower()
    address = ip_do_pedido(request)
    bloqueio = get_bloqueio()
    # Kit _kit_web: a tentativa é reservada antes do hash, atômica no PostgreSQL. Par (conta, IP)
    # bloqueado ou conta no teto: recusa sem calcular scrypt (P0 S-01). O kit gastaria um hash
    # falso aqui para igualar o tempo, mas o bloqueio vale igual para e-mail com ou sem conta, então
    # recusar rápido não revela se a conta existe.
    if not bloqueio.reservar(email, address):
        raise HTTPException(401, MENSAGEM_LOGIN)
    with engine.connect() as conn:
        row = (
            conn.execute(
                text(
                    "SELECT id, name, email, password_hash, disabled FROM accounts WHERE email = :email"
                ),
                {"email": email},
            )
            .mappings()
            .first()
        )
    ok, stale = check_password(body.password, row["password_hash"] if row else DUMMY_HASH)
    if not ok or not row:
        raise HTTPException(401, MENSAGEM_LOGIN)
    bloqueio.sucesso(email, address)
    bloqueio.expurgar()  # o IP das tentativas sai quando a janela acaba (LGPD art. 15 e 16)
    # Só quem acertou a senha sabe que a conta está suspensa.
    if row["disabled"]:
        raise HTTPException(403, "Esta conta está suspensa. Fale com a administração do MeuSite.")
    with engine.begin() as conn:
        if stale:
            conn.execute(
                text("UPDATE accounts SET password_hash = :p WHERE id = :id"),
                {"p": make_password(body.password), "id": row["id"]},
            )
        return open_session(
            conn, request, response, {key: row[key] for key in ("id", "name", "email")}
        )


@router.get("/session")
def session(request: Request):
    user = user_from_session(request)
    # Último acesso (no máximo uma escrita por hora) e acesso à Administração.
    now = int(time.time())
    with engine.begin() as conn:
        conn.execute(
            text("""UPDATE accounts SET last_seen_at = :now
            WHERE id = :id AND (last_seen_at IS NULL OR last_seen_at < :hour)"""),
            {"now": now, "id": user["id"], "hour": now - 3600},
        )
    return {**user, "admin": is_admin_email(user["email"])}


@router.post("/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE)
    if token:
        with engine.begin() as conn:
            conn.execute(
                text("DELETE FROM sessions WHERE token_hash = :token"), {"token": digest(token)}
            )
    response.delete_cookie(COOKIE, path="/", secure=SECURE, httponly=True, samesite="lax")
    return {"ok": True}
