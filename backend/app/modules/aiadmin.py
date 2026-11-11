"""Administração da IA: provedores cadastrados e os recursos do site que cada um atende.

- Administradores: e-mails em ADMIN_EMAILS (fixos) e os adicionados na aba Administradores.
- A chave da API é cifrada com Fernet usando AI_KEYS_SECRET (só no .env). Ela nunca volta para o navegador:
  a tela mostra só os 4 últimos caracteres.
- Cada recurso usa o primeiro provedor ativo que o atende; sem nenhum, vale ANTHROPIC_API_KEY/ANTHROPIC_MODEL do .env.
"""

import base64
import hashlib
import json
import os
import time
from typing import Literal
from uuid import UUID, uuid4

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.db import engine

from .auth import is_admin_email, rate_limit, user_from_session

router = APIRouter(prefix="/admin/ai")

FEATURES = {
    "textos": "Bio, descrições de trabalhos e tags",
    "curriculo": "Ler currículo e PDF do LinkedIn",
    "vaga_imagem": "Ler vaga por print ou foto (o modelo precisa aceitar imagens)",
    "candidatura": "Adaptar currículo, carta e apresentação para vagas",
}
Feature = Literal["textos", "curriculo", "vaga_imagem", "candidatura"]
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"


def is_admin(user):
    return is_admin_email(user.get("email"))


def admin_user(request: Request):
    user = user_from_session(request)
    if not is_admin(user):
        raise HTTPException(403, "Área restrita à administração.")
    return user


def cipher():
    secret = os.getenv("AI_KEYS_SECRET", "")
    if len(secret) < 16:
        return None
    return Fernet(base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest()))


def require_cipher():
    box = cipher()
    if not box:
        raise HTTPException(
            503,
            "Defina AI_KEYS_SECRET (16 caracteres ou mais) no .env do servidor para guardar chaves.",
        )
    return box


class ProviderIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    provider: Literal["anthropic"] = "anthropic"
    model: str = Field(min_length=1, max_length=120, pattern=r"^[\w.:\-/]+$")
    api_key: str = Field(default="", max_length=400)
    features: list[Feature] = Field(default_factory=list, max_length=len(FEATURES))
    enabled: bool = True


def public(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "provider": row["provider"],
        "model": row["model"],
        "key_hint": row["key_hint"],
        "features": json.loads(row["features"]),
        "enabled": bool(row["enabled"]),
        "updated_at": row["updated_at"],
    }


def load(conn, provider_id):
    row = (
        conn.execute(text("SELECT * FROM ai_providers WHERE id = :id"), {"id": str(provider_id)})
        .mappings()
        .first()
    )
    if not row:
        raise HTTPException(404, "Provedor não encontrado.")
    return row


@router.get("")
def list_providers(user=Depends(admin_user)):
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT * FROM ai_providers ORDER BY name")).mappings().all()
    return {
        "features": FEATURES,
        "secret_ready": cipher() is not None,
        "providers": [public(row) for row in rows],
    }


@router.post("", status_code=201)
def create_provider(body: ProviderIn, user=Depends(admin_user)):
    key = body.api_key.strip()
    if not key:
        raise HTTPException(422, "Informe a chave da API.")
    data = {
        "id": str(uuid4()),
        "name": body.name.strip(),
        "provider": body.provider,
        "model": body.model,
        "api_key": require_cipher().encrypt(key.encode()).decode(),
        "key_hint": key[-4:],
        "features": json.dumps(sorted(set(body.features))),
        "enabled": body.enabled,
        "updated_at": int(time.time()),
    }
    with engine.begin() as conn:
        conn.execute(
            text("""INSERT INTO ai_providers (id, name, provider, model, api_key, key_hint, features, enabled, updated_at)
            VALUES (:id, :name, :provider, :model, :api_key, :key_hint, :features, :enabled, :updated_at)"""),
            data,
        )
        return public(load(conn, data["id"]))


@router.put("/{provider_id}")
def update_provider(provider_id: UUID, body: ProviderIn, user=Depends(admin_user)):
    key = body.api_key.strip()
    with engine.begin() as conn:
        row = load(conn, provider_id)
        data = {
            "id": row["id"],
            "name": body.name.strip(),
            "provider": body.provider,
            "model": body.model,
            "features": json.dumps(sorted(set(body.features))),
            "enabled": body.enabled,
            "updated_at": int(time.time()),
            # Chave em branco mantém a atual.
            "api_key": require_cipher().encrypt(key.encode()).decode() if key else row["api_key"],
            "key_hint": key[-4:] if key else row["key_hint"],
        }
        conn.execute(
            text("""UPDATE ai_providers SET name = :name, provider = :provider, model = :model, api_key = :api_key,
            key_hint = :key_hint, features = :features, enabled = :enabled, updated_at = :updated_at WHERE id = :id"""),
            data,
        )
        return public(load(conn, row["id"]))


@router.delete("/{provider_id}")
def delete_provider(provider_id: UUID, user=Depends(admin_user)):
    with engine.begin() as conn:
        load(conn, provider_id)
        conn.execute(text("DELETE FROM ai_providers WHERE id = :id"), {"id": str(provider_id)})
    return {"ok": True}


def decrypt(row):
    box = require_cipher()
    try:
        return box.decrypt(row["api_key"].encode()).decode()
    except InvalidToken:
        raise HTTPException(
            409, "A chave salva não abre com o AI_KEYS_SECRET atual. Cadastre a chave de novo."
        ) from None


@router.post("/{provider_id}/test")
def test_provider(provider_id: UUID, request: Request, user=Depends(admin_user)):
    """Chamada mínima ao provedor para conferir chave e modelo. Não usa créditos de usuários."""
    rate_limit(request, "ai-admin-test", 20)
    with engine.connect() as conn:
        row = load(conn, provider_id)
    try:
        response = httpx.post(
            ANTHROPIC_URL,
            headers={"x-api-key": decrypt(row), "anthropic-version": "2023-06-01"},
            json={
                "model": row["model"],
                "max_tokens": 5,
                "messages": [{"role": "user", "content": "Responda só: ok"}],
            },
            timeout=20,
        )
    except httpx.HTTPError:
        raise HTTPException(502, "Não foi possível falar com o provedor. Tente de novo.") from None
    if response.status_code in (401, 403):
        raise HTTPException(502, "O provedor recusou a chave.")
    if response.status_code == 404:
        raise HTTPException(502, "O provedor não encontrou esse modelo. Confira o nome do modelo.")
    if response.status_code >= 400:
        raise HTTPException(502, f"O provedor respondeu com erro {response.status_code}.")
    return {"ok": True, "model": row["model"]}


def credentials(feature, env_key, env_model):
    """(chave, modelo) para um recurso: primeiro provedor ativo que o atende; sem nenhum, o .env."""
    box = cipher()
    if box:
        with engine.connect() as conn:
            rows = (
                conn.execute(
                    text("SELECT * FROM ai_providers WHERE enabled = :on ORDER BY name"),
                    {"on": True},
                )
                .mappings()
                .all()
            )
        for row in rows:
            if feature in json.loads(row["features"]):
                try:
                    return box.decrypt(row["api_key"].encode()).decode(), row["model"]
                except InvalidToken:
                    continue
    if env_key and env_model:
        return env_key, env_model
    return None
