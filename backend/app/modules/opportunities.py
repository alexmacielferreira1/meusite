import json
import os
import secrets
import time
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.db import engine

from .auth import rate_limit, user_from_session
from .sites import get_draft, public_snapshot

router = APIRouter()
# Hotsite "sem prazo": data distante em vez de nulo, para manter a coluna e as consultas simples.
NO_EXPIRY = 4102444800  # 01/01/2100


def hotsite_limit():
    """Hotsites ativos por conta. 0 = sem limite (piloto). Ajuste por HOTSITE_LIMIT."""
    try:
        return max(0, int(os.getenv("HOTSITE_LIMIT", "0")))
    except ValueError:
        return 0


class Opportunity(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    pitch: str = Field(max_length=1500)
    evidenceIds: list[str] = Field(max_length=3)
    days: Literal[0, 7, 30, 60]
    source: Literal["livre", "vaga", "curriculo"] = "livre"
    brief: str = Field(default="", max_length=5000)
    resumeName: str = Field(default="", max_length=120)


def expiry(days):
    return NO_EXPIRY if days == 0 else int(time.time()) + days * 86400


def build_snapshot(conn, user, body):
    row = get_draft(conn, user["id"])
    if not row or not body.title.strip():
        raise HTTPException(422, "Salve seu portfólio e informe um título.")
    if not body.evidenceIds and not body.pitch.strip():
        raise HTTPException(422, "Informe uma apresentação ou selecione um trabalho.")
    portfolio = public_snapshot(json.loads(row["draft"]), list(dict.fromkeys(body.evidenceIds)))
    if len(portfolio["works"]) != len(body.evidenceIds):
        raise HTTPException(422, "Escolha trabalhos diferentes e com compartilhamento permitido.")
    portfolio["site"]["sections"] = [
        {"id": name, "type": name, "enabled": True}
        for name in ("hero", "about", "works", "clipping", "audio", "contact")
    ]
    if body.pitch.strip():
        portfolio["profile"]["bio"] = body.pitch.strip()
    portfolio["profile"].update(stats=[], pillars=[])
    portfolio.update(
        clients=[], experience=[], education=[], services=[], testimonials=[], team=[], faq=[]
    )
    return json.dumps(portfolio, ensure_ascii=False)


def check_limit(conn, user, exclude=""):
    limit = hotsite_limit()
    if not limit:
        return
    # Serializa por conta para que dois pedidos simultâneos não passem do limite.
    conn.execute(text("UPDATE accounts SET id = id WHERE id = :id"), user)
    active = conn.execute(
        text("""SELECT COUNT(*) FROM opportunities WHERE account_id = :id
        AND revoked = 0 AND expires_at > :now AND slug != :exclude"""),
        {"id": user["id"], "now": int(time.time()), "exclude": exclude},
    ).scalar_one()
    if active >= limit:
        raise HTTPException(
            409, f"Você já tem {limit} hotsite(s) ativo(s). Desative um para publicar outro."
        )


def stored(body):
    return json.dumps(body.model_dump(), ensure_ascii=False)


def legacy_request(row):
    """Recupera dados editáveis de vitrines anteriores ao armazenamento de request."""
    try:
        portfolio = json.loads(row["snapshot"])
        profile = portfolio.get("profile", {})
        works = portfolio.get("works", [])
    except (ValueError, TypeError, AttributeError):
        profile, works = {}, []
    return {
        "title": row["title"],
        "pitch": str(profile.get("bio", ""))[:1500],
        "evidenceIds": [
            w["id"] for w in works if isinstance(w, dict) and isinstance(w.get("id"), str)
        ][:3],
        "days": 0 if row["expires_at"] >= NO_EXPIRY else 30,
        "source": "livre",
        "brief": "",
        "resumeName": "",
    }


@router.get("/opportunities")
def list_opportunities(user=Depends(user_from_session)):
    with engine.connect() as conn:
        rows = conn.execute(
            text("""SELECT slug, title, expires_at, revoked, visits, request, snapshot
            FROM opportunities WHERE account_id = :id ORDER BY expires_at DESC, slug LIMIT 100"""),
            user,
        ).mappings()
        return [
            {
                **{k: v for k, v in row.items() if k != "request"},
                "noExpiry": row["expires_at"] >= NO_EXPIRY,
                "request": json.loads(row["request"]) if row["request"] else legacy_request(row),
            }
            for row in rows
        ]


@router.post("/opportunities", status_code=201)
def create_opportunity(body: Opportunity, request: Request, user=Depends(user_from_session)):
    rate_limit(request, "opportunity", 30, 3600)
    with engine.begin() as conn:
        snapshot = build_snapshot(conn, user, body)
        check_limit(conn, user)
        entry = {
            "slug": secrets.token_urlsafe(24),
            "title": body.title.strip(),
            "expires_at": expiry(body.days),
            "revoked": 0,
            "visits": 0,
        }
        conn.execute(
            text("""INSERT INTO opportunities (slug, account_id, title, expires_at, snapshot, request)
            VALUES (:slug, :id, :title, :expires_at, :snapshot, :request)"""),
            {**entry, "id": user["id"], "snapshot": snapshot, "request": stored(body)},
        )
    return {**entry, "noExpiry": body.days == 0, "request": body.model_dump()}


@router.put("/opportunities/{slug}")
def update_opportunity(
    slug: str, body: Opportunity, request: Request, user=Depends(user_from_session)
):
    """Atualiza conteúdo e prazo mantendo o mesmo link. Também reativa um hotsite desativado ou vencido."""
    rate_limit(request, "opportunity", 30, 3600)
    with engine.begin() as conn:
        current = (
            conn.execute(
                text("SELECT visits FROM opportunities WHERE slug = :slug AND account_id = :id"),
                {"slug": slug, "id": user["id"]},
            )
            .mappings()
            .first()
        )
        if not current:
            raise HTTPException(404, "Link não encontrado.")
        snapshot = build_snapshot(conn, user, body)
        check_limit(conn, user, exclude=slug)
        entry = {
            "slug": slug,
            "title": body.title.strip(),
            "expires_at": expiry(body.days),
            "revoked": 0,
            "visits": current["visits"],
        }
        conn.execute(
            text("""UPDATE opportunities SET title = :title, expires_at = :expires_at, revoked = 0,
            snapshot = :snapshot, request = :request WHERE slug = :slug AND account_id = :id"""),
            {**entry, "id": user["id"], "snapshot": snapshot, "request": stored(body)},
        )
    return {**entry, "noExpiry": body.days == 0, "request": body.model_dump()}


@router.delete("/opportunities/{slug}")
def revoke(slug: str, user=Depends(user_from_session)):
    with engine.begin() as conn:
        result = conn.execute(
            text("UPDATE opportunities SET revoked = 1 WHERE slug = :slug AND account_id = :id"),
            {"slug": slug, "id": user["id"]},
        )
        if not result.rowcount:
            raise HTTPException(404, "Link não encontrado.")
    return {"ok": True}


@router.post("/opportunities/{slug}/permanent/delete")
@router.delete("/opportunities/{slug}/permanent")
def delete_permanently(slug: str, user=Depends(user_from_session)):
    """Exclusão solicitada na interface; remove só a vitrine da própria conta."""
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM opportunities WHERE slug = :slug AND account_id = :id"),
            {"slug": slug, "id": user["id"]},
        )
        if not result.rowcount:
            raise HTTPException(404, "Link não encontrado.")
    return {"ok": True}


@router.get("/public/opportunities/{slug}")
def public_opportunity(slug: str):
    with engine.begin() as conn:
        row = (
            conn.execute(
                text("""UPDATE opportunities SET visits = visits + 1 WHERE slug = :slug
            AND revoked = 0 AND expires_at > :now RETURNING title, snapshot"""),
                {"slug": slug, "now": int(time.time())},
            )
            .mappings()
            .first()
        )
    if not row:
        raise HTTPException(404, "Este link expirou, foi desativado ou não existe.")
    return {"title": row["title"], "portfolio": json.loads(row["snapshot"])}
