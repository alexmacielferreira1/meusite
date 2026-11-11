"""Administração do sistema dentro do app (decisão do Alex, 06/11/2026; pode migrar para a Central depois).

Abas: visão geral, usuários, planos e pagamentos, erros e administradores (a IA fica em aiadmin.py).
- Acesso: e-mails de ADMIN_EMAILS (fixos, não saem pela tela) e os adicionados na aba Administradores.
- Pagamentos são registrados à mão: ainda não há meio de pagamento integrado.
- Erros do servidor (exceções não tratadas) e do navegador ficam agrupados pela mesma assinatura.
"""

import hashlib
import re
import secrets
import time
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.db import engine

from .aiadmin import admin_user
from .auth import admin_emails, make_password, rate_limit, release_login, user_from_session

router = APIRouter(prefix="/admin")
public_router = APIRouter()

PLANS = {"gratuito": "Gratuito", "teste": "Teste", "pro": "Pro"}
METHODS = {
    "pix": "Pix",
    "cartao": "Cartão",
    "boleto": "Boleto",
    "transferencia": "Transferência",
    "dinheiro": "Dinheiro",
    "outro": "Outro",
}
Plan = Literal["gratuito", "teste", "pro"]
Method = Literal["pix", "cartao", "boleto", "transferencia", "dinheiro", "outro"]
EMAIL = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+")
DAY = 86400


def clean_email(value):
    email = value.strip().lower()
    if not EMAIL.fullmatch(email):
        raise HTTPException(422, "Informe um e-mail válido.")
    return email


def all_admins(conn):
    return admin_emails() | {row[0] for row in conn.execute(text("SELECT email FROM admins"))}


def temporary_password():
    """Senha provisória mostrada uma vez para a administração repassar à pessoa."""
    return secrets.token_urlsafe(9)


# ---------- Visão geral ----------


@router.get("/overview")
def overview(user=Depends(admin_user)):
    now = int(time.time())
    month = datetime.fromtimestamp(now, UTC).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    since = datetime.fromtimestamp(now - 30 * DAY, UTC).strftime("%Y-%m-%d")
    with engine.connect() as conn:
        one = lambda sql, **params: conn.execute(text(sql), params).scalar() or 0  # noqa: E731
        accounts = {
            "total": one("SELECT COUNT(*) FROM accounts"),
            "testers": one("SELECT COUNT(*) FROM accounts WHERE tester = :on", on=True),
            "suspended": one("SELECT COUNT(*) FROM accounts WHERE disabled = :on", on=True),
            "new_7d": one("SELECT COUNT(*) FROM accounts WHERE created_at >= :t", t=now - 7 * DAY),
            "new_30d": one(
                "SELECT COUNT(*) FROM accounts WHERE created_at >= :t", t=now - 30 * DAY
            ),
            "active_7d": one(
                "SELECT COUNT(*) FROM accounts WHERE last_seen_at >= :t", t=now - 7 * DAY
            ),
        }
        plans = {key: 0 for key in PLANS}
        for plan, count in conn.execute(text("SELECT plan, COUNT(*) FROM accounts GROUP BY plan")):
            plans[plan] = count
        created = [
            row[0]
            for row in conn.execute(
                text("SELECT created_at FROM accounts WHERE created_at >= :t"),
                {"t": now - 30 * DAY},
            )
        ]
        result = {
            "accounts": accounts,
            "plans": plans,
            "sites": {
                "published": one("SELECT COUNT(*) FROM sites WHERE published IS NOT NULL"),
                "hotsites": one(
                    "SELECT COUNT(*) FROM opportunities WHERE revoked = 0 AND expires_at > :now",
                    now=now,
                ),
                "visits_30d": one(
                    "SELECT SUM(hits) FROM site_events WHERE kind = 'visit' AND day >= :d", d=since
                ),
            },
            "ai_credits": one("SELECT SUM(ai_credits) FROM accounts"),
            "payments": {
                "month_cents": one(
                    "SELECT SUM(amount_cents) FROM payments WHERE paid_at >= :t",
                    t=int(month.timestamp()),
                ),
                "total_cents": one("SELECT SUM(amount_cents) FROM payments"),
                "count": one("SELECT COUNT(*) FROM payments"),
            },
            "errors_open": one("SELECT COUNT(*) FROM error_log WHERE resolved = :off", off=False),
        }
    # Cadastros por dia nos últimos 30 dias (mais antigo primeiro).
    days = [
        datetime.fromtimestamp(now - (29 - i) * DAY, UTC).strftime("%Y-%m-%d") for i in range(30)
    ]
    counts = dict.fromkeys(days, 0)
    for stamp in created:
        key = datetime.fromtimestamp(stamp, UTC).strftime("%Y-%m-%d")
        if key in counts:
            counts[key] += 1
    result["signups"] = [{"day": day, "count": counts[day]} for day in days]
    with engine.connect() as conn:
        result["origins"] = origin_summary(conn)
    return result


ORIGIN_LIMIT = 50


def origin_summary(conn, limit=ORIGIN_LIMIT):
    """Cadastros e portfólios publicados por origem (etiquetas UTM); sem etiqueta = direto."""
    sql = """SELECT a.origin_source AS source, a.origin_medium AS medium,
        a.origin_campaign AS campaign, a.origin_content AS content,
        COUNT(*) AS signups, COUNT(s.published) AS published
        FROM accounts a LEFT JOIN sites s ON s.account_id = a.id
        GROUP BY a.origin_source, a.origin_medium, a.origin_campaign, a.origin_content
        ORDER BY signups DESC, published DESC, source, medium, campaign, content"""
    if limit is not None:
        sql += f" LIMIT {int(limit)}"
    return [dict(row) for row in conn.execute(text(sql)).mappings()]


# ---------- Usuários ----------

USER_COLUMNS = """a.id, a.name, a.email, a.created_at, a.last_seen_at, a.disabled, a.tester, a.plan, a.plan_until,
    a.ai_credits, a.admin_note, s.slug, s.published IS NOT NULL AS published,
    (SELECT COUNT(*) FROM opportunities o WHERE o.account_id = a.id) AS hotsites,
    (SELECT COALESCE(SUM(e.hits), 0) FROM site_events e WHERE e.account_id = a.id AND e.kind = 'visit') AS visits"""


def user_row(row, admins):
    item = dict(row)
    item["disabled"], item["tester"], item["published"] = (
        bool(item["disabled"]),
        bool(item["tester"]),
        bool(item["published"]),
    )
    item["admin"] = item["email"] in admins
    item["fixed_admin"] = item["email"] in admin_emails()
    return item


def load_user(conn, account_id):
    row = (
        conn.execute(
            text(
                f"SELECT {USER_COLUMNS} FROM accounts a LEFT JOIN sites s ON s.account_id = a.id WHERE a.id = :id"
            ),
            {"id": str(account_id)},
        )
        .mappings()
        .first()
    )
    if not row:
        raise HTTPException(404, "Usuário não encontrado.")
    return user_row(row, all_admins(conn))


@router.get("/users")
def list_users(
    q: str = "",
    show: Literal["todos", "testes", "suspensos", "admins"] = "todos",
    user=Depends(admin_user),
):
    term = f"%{q.strip().lower()[:100]}%"
    with engine.connect() as conn:
        rows = (
            conn.execute(
                text(f"""SELECT {USER_COLUMNS} FROM accounts a LEFT JOIN sites s ON s.account_id = a.id
            WHERE lower(a.name) LIKE :term OR a.email LIKE :term
            ORDER BY COALESCE(a.created_at, 0) DESC, a.email LIMIT 500"""),
                {"term": term},
            )
            .mappings()
            .all()
        )
        admins = all_admins(conn)
    users = [user_row(row, admins) for row in rows]
    keep = {
        "testes": lambda u: u["tester"],
        "suspensos": lambda u: u["disabled"],
        "admins": lambda u: u["admin"],
    }.get(show)
    return {"plans": PLANS, "users": [u for u in users if not keep or keep(u)]}


class NewUser(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(max_length=254)
    tester: bool = True
    plan: Plan = "teste"
    ai_credits: int = Field(default=10, ge=0, le=100_000)


@router.post("/users", status_code=201)
def create_user(body: NewUser, request: Request, user=Depends(admin_user)):
    """Cria a conta de uma pessoa (ex.: teste) com senha provisória, que aparece só nesta resposta."""
    rate_limit(request, "admin-create-user", 60, 3600)
    name, email = body.name.strip(), clean_email(body.email)
    if not name:
        raise HTTPException(422, "Informe o nome.")
    password, account_id = temporary_password(), str(uuid4())
    try:
        with engine.begin() as conn:
            conn.execute(
                text("""INSERT INTO accounts (id, name, email, password_hash, ai_credits, created_at, tester, plan)
                VALUES (:id, :name, :email, :password, :credits, :now, :tester, :plan)"""),
                {
                    "id": account_id,
                    "name": name,
                    "email": email,
                    "password": make_password(password),
                    "credits": body.ai_credits,
                    "now": int(time.time()),
                    "tester": body.tester,
                    "plan": body.plan,
                },
            )
            return {"user": load_user(conn, account_id), "password": password}
    except IntegrityError:
        raise HTTPException(409, "Este e-mail já está cadastrado.") from None


class UserPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    disabled: bool | None = None
    tester: bool | None = None
    plan: Plan | None = None
    plan_until: int | None = Field(default=None, ge=0, le=4_102_444_800)
    ai_credits: int | None = Field(default=None, ge=0, le=100_000)
    admin_note: str | None = Field(default=None, max_length=1000)


@router.patch("/users/{account_id}")
def update_user(account_id: UUID, body: UserPatch, user=Depends(admin_user)):
    changes = {key: getattr(body, key) for key in body.model_fields_set}
    if "name" in changes:
        changes["name"] = (changes["name"] or "").strip()
        if not changes["name"]:
            raise HTTPException(422, "Informe o nome.")
    # Prazo do plano pode ser apagado (None); os demais campos não.
    changes = {
        key: value for key, value in changes.items() if value is not None or key == "plan_until"
    }
    with engine.begin() as conn:
        current = load_user(conn, account_id)
        if changes.get("disabled"):
            if current["id"] == user["id"]:
                raise HTTPException(409, "Você não pode suspender a própria conta.")
            if current["fixed_admin"]:
                raise HTTPException(
                    409, "Administradores fixos (ADMIN_EMAILS) não podem ser suspensos pela tela."
                )
            conn.execute(text("DELETE FROM sessions WHERE account_id = :id"), {"id": current["id"]})
        if changes:
            assignments = ", ".join(f"{key} = :{key}" for key in changes)
            conn.execute(
                text(f"UPDATE accounts SET {assignments} WHERE id = :id"),
                {**changes, "id": current["id"]},
            )
        return load_user(conn, current["id"])


@router.post("/users/{account_id}/password")
def reset_password(account_id: UUID, request: Request, user=Depends(admin_user)):
    """Gera uma senha provisória nova e encerra as sessões abertas da pessoa."""
    rate_limit(request, "admin-reset-password", 60, 3600)
    password = temporary_password()
    with engine.begin() as conn:
        current = load_user(conn, account_id)
        if current["fixed_admin"]:
            # Senão um admin adicionado tomaria a conta de um fixo (S-04 da auditoria de 08/11).
            raise HTTPException(
                409,
                "A senha de administradores fixos (ADMIN_EMAILS) só muda pelo servidor (scripts/criar_admin.ps1).",
            )
        reset_account(conn, current["id"], password)
    return {"password": password}


def reset_account(conn, account_id, password):
    """Senha provisória nova, fim das sessões abertas e fim do bloqueio de login da conta."""
    email = conn.execute(
        text("UPDATE accounts SET password_hash = :password WHERE id = :id RETURNING email"),
        {"password": make_password(password), "id": str(account_id)},
    ).scalar_one()
    conn.execute(text("DELETE FROM sessions WHERE account_id = :id"), {"id": str(account_id)})
    release_login(email)


# ---------- Planos e pagamentos ----------


class PaymentIn(BaseModel):
    account_id: UUID
    amount_cents: int = Field(gt=0, le=100_000_000)
    method: Method = "pix"
    paid_at: int = Field(ge=0, le=4_102_444_800)
    note: str = Field(default="", max_length=500)
    plan: Plan | None = None
    plan_until: int | None = Field(default=None, ge=0, le=4_102_444_800)


def payment_rows(conn, where="", params=None):
    return [
        dict(row)
        for row in conn.execute(
            text(f"""SELECT p.id, p.account_id, a.name, a.email, p.amount_cents, p.method,
        p.paid_at, p.note, p.created_by, p.created_at FROM payments p JOIN accounts a ON a.id = p.account_id {where}
        ORDER BY p.paid_at DESC, p.created_at DESC LIMIT 300"""),
            params or {},
        ).mappings()
    ]


@router.get("/payments")
def list_payments(user=Depends(admin_user)):
    with engine.connect() as conn:
        return {"plans": PLANS, "methods": METHODS, "payments": payment_rows(conn)}


@router.post("/payments", status_code=201)
def create_payment(body: PaymentIn, user=Depends(admin_user)):
    """Registra um pagamento recebido. Se vier plano, já atualiza o plano e o prazo da conta."""
    payment_id = str(uuid4())
    with engine.begin() as conn:
        account = load_user(conn, body.account_id)
        conn.execute(
            text("""INSERT INTO payments (id, account_id, amount_cents, method, paid_at, note, created_by, created_at)
            VALUES (:id, :account, :amount, :method, :paid_at, :note, :by, :now)"""),
            {
                "id": payment_id,
                "account": account["id"],
                "amount": body.amount_cents,
                "method": body.method,
                "paid_at": body.paid_at,
                "note": body.note.strip(),
                "by": user["email"],
                "now": int(time.time()),
            },
        )
        if body.plan:
            conn.execute(
                text("UPDATE accounts SET plan = :plan, plan_until = :until WHERE id = :id"),
                {"plan": body.plan, "until": body.plan_until, "id": account["id"]},
            )
        return payment_rows(conn, "WHERE p.id = :id", {"id": payment_id})[0]


@router.delete("/payments/{payment_id}")
def delete_payment(payment_id: UUID, user=Depends(admin_user)):
    with engine.begin() as conn:
        removed = conn.execute(
            text("DELETE FROM payments WHERE id = :id"), {"id": str(payment_id)}
        ).rowcount
    if not removed:
        raise HTTPException(404, "Pagamento não encontrado.")
    return {"ok": True}


# ---------- Erros ----------


def normalize_path(path):
    """Agrupa /p/ana e /p/bia como o mesmo erro: ids, números e o segmento final de rotas públicas viram ':id'."""
    path = re.sub(
        r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        ":id",
        path.split("?")[0],
        flags=re.I,
    )
    path = re.sub(r"/\d+(?=/|$)", "/:id", path)
    return re.sub(r"^/(p|o)/[^/]+", r"/\1/:id", path)[:300]


def record_error(source, path, message, detail="", account_id=None):
    """Guarda o erro sem nunca derrubar a requisição que o gerou."""
    try:
        now, path, message = (
            int(time.time()),
            normalize_path(path or ""),
            (message or "Erro sem mensagem").strip()[:500],
        )
        fingerprint = hashlib.sha256(f"{source}|{path}|{message}".encode()).hexdigest()
        with engine.begin() as conn:
            conn.execute(
                text("""INSERT INTO error_log (id, fingerprint, source, path, message, detail, account_id, hits, first_at, last_at, resolved)
                VALUES (:id, :fp, :source, :path, :message, :detail, :account, 1, :now, :now, :off)
                ON CONFLICT(fingerprint) DO UPDATE SET hits = error_log.hits + 1, last_at = :now, detail = :detail,
                account_id = COALESCE(:account, error_log.account_id), resolved = :off"""),
                {
                    "id": str(uuid4()),
                    "fp": fingerprint,
                    "source": source,
                    "path": path,
                    "message": message,
                    "detail": (detail or "")[-4000:],
                    "account": account_id,
                    "now": now,
                    "off": False,
                },
            )
    except Exception:  # noqa: BLE001 - o registro de erro é o último recurso
        pass


class ClientError(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    path: str = Field(default="", max_length=300)
    detail: str = Field(default="", max_length=4000)


@public_router.post("/errors")
def report_error(body: ClientError, request: Request):
    """Erros do navegador (tela quebrada, falha de script). Aceita sem login, com limite por endereço."""
    rate_limit(request, "client-error", 30)
    try:
        account = user_from_session(request)["id"]
    except HTTPException:
        account = None
    record_error("web", body.path, body.message, body.detail, account)
    return {"ok": True}


@router.get("/errors")
def list_errors(
    status: Literal["abertos", "resolvidos", "todos"] = "abertos", user=Depends(admin_user)
):
    where = {
        "abertos": "WHERE e.resolved = :off",
        "resolvidos": "WHERE e.resolved = :on",
        "todos": "",
    }[status]
    with engine.connect() as conn:
        rows = (
            conn.execute(
                text(f"""SELECT e.*, a.email FROM error_log e LEFT JOIN accounts a ON a.id = e.account_id
            {where} ORDER BY e.last_at DESC LIMIT 200"""),
                {"off": False, "on": True},
            )
            .mappings()
            .all()
        )
    return {"errors": [{**dict(row), "resolved": bool(row["resolved"])} for row in rows]}


class ErrorPatch(BaseModel):
    resolved: bool


@router.patch("/errors/{error_id}")
def update_error(error_id: UUID, body: ErrorPatch, user=Depends(admin_user)):
    with engine.begin() as conn:
        changed = conn.execute(
            text("UPDATE error_log SET resolved = :resolved WHERE id = :id"),
            {"resolved": body.resolved, "id": str(error_id)},
        ).rowcount
    if not changed:
        raise HTTPException(404, "Erro não encontrado.")
    return {"ok": True, "resolved": body.resolved}


# ---------- Administradores ----------


class AdminIn(BaseModel):
    email: str = Field(max_length=254)


def admin_list(conn):
    rows = (
        conn.execute(
            text("""SELECT d.email, d.added_by, d.added_at, a.name FROM admins d
        LEFT JOIN accounts a ON a.email = d.email ORDER BY d.added_at, d.email""")
        )
        .mappings()
        .all()
    )
    return {"fixed": sorted(admin_emails()), "added": [dict(row) for row in rows]}


@router.get("/admins")
def list_admins(user=Depends(admin_user)):
    with engine.connect() as conn:
        return admin_list(conn)


@router.post("/admins", status_code=201)
def add_admin(body: AdminIn, user=Depends(admin_user)):
    """Dá acesso à Administração a uma conta que já existe (e-mail de admin não se cadastra pela tela).

    O cadastro não confirma e-mail: quem criou a conta pode não ser o dono do endereço. Por isso a
    conta recebe uma senha provisória (só nesta resposta) e as sessões abertas caem; a administração
    entrega a senha direto à pessoa certa.
    """
    email = clean_email(body.email)
    password = temporary_password()
    with engine.begin() as conn:
        if email in all_admins(conn):
            raise HTTPException(409, "Este e-mail já é administrador.")
        found = conn.execute(
            text("SELECT id FROM accounts WHERE email = :email"), {"email": email}
        ).scalar()
        if not found:
            raise HTTPException(
                404,
                "Não há conta com este e-mail. A pessoa crie a conta primeiro; depois dê o acesso.",
            )
        reset_account(conn, found, password)
        conn.execute(
            text("INSERT INTO admins (email, added_by, added_at) VALUES (:email, :by, :now)"),
            {"email": email, "by": user["email"], "now": int(time.time())},
        )
        return {**admin_list(conn), "password": password}


@router.delete("/admins/{email}")
def remove_admin(email: str, user=Depends(admin_user)):
    email = email.strip().lower()
    if email == user["email"].lower():
        raise HTTPException(409, "Você não pode remover o próprio acesso.")
    with engine.begin() as conn:
        removed = conn.execute(
            text("DELETE FROM admins WHERE email = :email"), {"email": email}
        ).rowcount
        if not removed:
            raise HTTPException(
                404,
                "Administradores fixos (ADMIN_EMAILS) só saem pelo servidor."
                if email in admin_emails()
                else "Administrador não encontrado.",
            )
        return admin_list(conn)
