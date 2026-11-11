import hmac
import json
import re
import secrets
from datetime import UTC, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.db import engine
from app.public_paths import valid_public_slug

from .auth import check_limit, rate_limit, scrypt_hex, user_from_session
from .business import Business

router = APIRouter()
SLUG = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
WEB_LINK = re.compile(r"https?://[^\s]+", re.IGNORECASE)
VISIT_CAP = 20  # senhas de visita erradas por IP a cada 10 min


class Work(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str = Field(min_length=1, max_length=120)
    title: str
    kind: Literal["video", "image", "audio", "article", "script"]
    client: str
    year: str
    role: str
    category: str
    software: list[str]
    tags: list[str]
    description: str
    cover: str
    challenge: str | None = Field(default=None, max_length=3000)
    solution: str | None = Field(default=None, max_length=3000)
    results: str | None = Field(default=None, max_length=3000)
    credits: str | None = Field(default=None, max_length=2000)
    gallery: list[str] | None = Field(default=None, max_length=12)
    repositoryUrl: str | None = Field(default=None, max_length=2000)
    aspect: Literal["16:9", "9:16"] | None = None
    mediaUrl: str | None = Field(default=None, max_length=2000)
    contribution: str | None = Field(default=None, max_length=8000)
    deliverables: list[str] | None = Field(default=None, max_length=100)
    markers: list[dict[str, str]] | None = Field(default=None, max_length=12)
    visibility: Literal["public", "link", "private"] = "public"

    @field_validator("mediaUrl", "repositoryUrl")
    @classmethod
    def web_link(cls, value):
        # Vão para href no site público: só http/https (bloqueia javascript:, data: etc.).
        if value and not WEB_LINK.fullmatch(value):
            raise ValueError("Use um link que comece com http:// ou https://.")
        return value


class Section(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    type: Literal[
        "hero",
        "about",
        "reel",
        "works",
        "clients",
        "experience",
        "education",
        "clipping",
        "services",
        "testimonials",
        "audio",
        "contact",
    ]
    enabled: bool


class Profile(BaseModel):
    model_config = ConfigDict(extra="allow")
    professions: list[str] = Field(default_factory=list, max_length=40)
    heroTitle: str = Field(default="", max_length=180)
    heroKicker: str = Field(default="", max_length=100)
    heroImage: str = Field(default="", max_length=2000)
    ctaLabel: str = Field(default="", max_length=60)
    manifesto: str = Field(default="", max_length=3000)
    name: str
    headline: str
    roleId: Literal[
        "editor",
        "produtor",
        "designer",
        "motion",
        "fotografo",
        "jornalista",
        "social",
        "assessor",
        "locutor",
    ]
    roles: list[
        Literal[
            "editor",
            "produtor",
            "designer",
            "motion",
            "fotografo",
            "jornalista",
            "social",
            "assessor",
            "locutor",
        ]
    ] = Field(default_factory=list, max_length=9)
    city: str
    state: str
    bio: str
    email: str
    whatsapp: str
    instagram: str
    linkedin: str
    website: str
    available: bool
    inDirectory: bool = False
    stats: list[dict[str, str]]
    pillars: list[dict[str, str]]


class Theme(BaseModel):
    background: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    ink: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    accent: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    mode: Literal["dark", "light"]
    font: Literal["sans", "display", "serif"]
    radius: Literal["none", "md", "lg"]


class PhotoLook(BaseModel):
    """Acabamento opcional das fotos no estilo do modelo (a foto guardada não muda)."""

    model_config = ConfigDict(extra="forbid")
    enabled: bool
    intensity: Literal["suave", "media", "forte"] = "media"
    autoFix: bool = True


class Presentation(BaseModel):
    contentWidth: Literal["960", "1200", "1440"] = "1200"
    model_config = ConfigDict(extra="forbid")
    motion: Literal["off", "soft", "expressive"] = "soft"
    pointer: bool = True
    ambient: bool = True
    scene3d: bool = True
    density: Literal["compact", "comfortable", "airy"] = "comfortable"
    frame: Literal["thin", "glass", "shadow"] = "shadow"
    imageFit: Literal["cover", "contain"] = "cover"
    gallery: Literal["model", "grid", "list", "rail"] = "model"


class Site(BaseModel):
    model_config = ConfigDict(extra="allow")
    slug: str = Field(pattern=SLUG, max_length=64)
    templateId: str
    theme: Theme
    sections: list[Section] = Field(max_length=60)
    photoLook: PhotoLook | None = None
    presentation: Presentation | None = None


class Area(BaseModel):
    """Área do portfólio (aba da galeria e trilha da formação)."""

    id: str = Field(min_length=1, max_length=40)
    label: str = Field(min_length=1, max_length=40)


class Portfolio(BaseModel):
    model_config = ConfigDict(extra="allow")
    business: Business | None = None
    profile: Profile
    works: list[Work] = Field(max_length=250)
    site: Site
    clients: list[str]
    services: list[dict[str, str]]
    experience: list[dict[str, str]]
    education: list[dict[str, str]]
    testimonials: list[dict[str, str]]
    team: list[dict[str, str]] = Field(default_factory=list, max_length=40)
    faq: list[dict[str, str]] = Field(default_factory=list, max_length=40)
    areas: list[Area] = Field(default_factory=list, max_length=8)


class Draft(BaseModel):
    revision: int = Field(ge=0)
    portfolio: Portfolio


def public_snapshot(draft, evidence_ids=None):
    works = {
        work["id"]: work
        for work in draft["works"]
        if work.get("visibility", "public") == "public"
        or (evidence_ids is not None and work.get("visibility") == "link")
    }
    keys = (
        "id",
        "title",
        "kind",
        "client",
        "year",
        "role",
        "category",
        "software",
        "tags",
        "description",
        "cover",
        "gallery",
        "repositoryUrl",
        "aspect",
        "mediaUrl",
        "outlet",
        "featured",
        "challenge",
        "solution",
        "results",
        "credits",
        "contribution",
        "deliverables",
        "markers",
        "area",
    )
    chosen = list(works) if evidence_ids is None else evidence_ids
    public = {
        key: draft[key]
        for key in ("clients", "services", "experience", "education", "testimonials")
    }
    public.update({key: draft.get(key, []) for key in ("team", "faq", "areas")})
    if draft.get("business"):
        public["business"] = Business.model_validate(draft["business"]).model_dump()
    public["profile"] = {
        key: draft["profile"][key] for key in Profile.model_fields if key in draft["profile"]
    }
    if isinstance(draft["profile"].get("photo"), str):
        public["profile"]["photo"] = draft["profile"]["photo"]
    focus = draft["profile"].get("photoFocus")
    if isinstance(focus, dict) and all(
        isinstance(focus.get(k), (int, float)) and 0 <= focus[k] <= 100 for k in ("x", "y")
    ):
        public["profile"]["photoFocus"] = {"x": focus["x"], "y": focus["y"]}
    if isinstance(draft["profile"].get("resumeUrl"), str):
        public["profile"]["resumeUrl"] = draft["profile"]["resumeUrl"]
    public["site"] = {
        key: draft["site"][key] for key in ("slug", "templateId", "theme", "sections")
    }
    public["site"].update(published=True, bilingual=False, passwordProtected=False)
    if isinstance(draft["site"].get("presentation"), dict):
        public["site"]["presentation"] = Presentation.model_validate(
            draft["site"]["presentation"]
        ).model_dump()
    if isinstance(draft["site"].get("photoLook"), dict):
        public["site"]["photoLook"] = PhotoLook.model_validate(
            draft["site"]["photoLook"]
        ).model_dump()
    public["works"] = [
        {key: works[wid][key] for key in keys if key in works[wid]}
        for wid in chosen
        if wid in works
    ]
    public.update(
        plan="gratis", aiCredits=0, analytics={"visits": [], "contactClicks": 0, "topWork": ""}
    )
    if evidence_ids is None:
        hide_blocks(public, draft["site"].get("hidden"))
        order = draft["site"].get("blockOrder")
        if isinstance(order, list):
            # Ordem dos blocos escolhida pela pessoa (só nomes de blocos conhecidos, sem repetir).
            public["site"]["blockOrder"] = [
                item
                for i, item in enumerate(order)
                if isinstance(item, str) and item in BLOCK_NAMES and item not in order[:i]
            ]
    return public


BLOCK_LISTS = ("clients", "services", "experience", "education", "testimonials", "team", "faq")


def summary(text, limit):
    """Frases inteiras até `limit` caracteres (mesma regra do frontend em site/models/summary.ts)."""
    clean = " ".join(str(text).split())
    if len(clean) <= limit:
        return clean
    out = ""
    for sentence in re.findall(r"[^.!?]+[.!?]+[\"”)]?\s*", clean):
        if len((out + sentence).strip()) > limit:
            break
        out += sentence
    if out.strip():
        return out.strip()
    cut = clean[:limit]
    return re.sub(r"[,;:–—-]+$", "", cut[: cut.rfind(" ")]) + "…"


BLOCK_KINDS = {"works": {"video", "image", "script"}, "clipping": {"article"}, "audio": {"audio"}}
BLOCK_NAMES = set(BLOCK_LISTS) | set(BLOCK_KINDS) | {"stats", "pillars", "about", "gallery"}


def hide_blocks(public, hidden):
    """Blocos desligados pela pessoa não saem no site publicado (vale para qualquer modelo)."""
    hidden = (
        {item for item in hidden if isinstance(item, str)} if isinstance(hidden, list) else set()
    )
    for key in BLOCK_LISTS:
        if key in hidden:
            public[key] = []
    for key in ("stats", "pillars"):
        if key in hidden:
            public["profile"][key] = []
    if "about" in hidden:
        public["profile"]["bio"] = summary(public["profile"].get("bio", ""), 200)
    kinds = set().union(*(BLOCK_KINDS[key] for key in hidden if key in BLOCK_KINDS))
    public["works"] = [work for work in public["works"] if work.get("kind") not in kinds]
    public["site"]["hidden"] = sorted(hidden & BLOCK_NAMES)


def get_draft(conn, account_id):
    return (
        conn.execute(text("SELECT * FROM sites WHERE account_id = :id"), {"id": account_id})
        .mappings()
        .first()
    )


def draft_response(row, credits):
    if not row:
        return {"portfolio": None, "revision": 0, "publishedSlug": None, "credits": credits}
    draft = json.loads(row["draft"])
    draft.update(
        plan="gratis",
        aiCredits=credits,
        mediaExtraGb=0,
        analytics={"visits": [0] * 14, "contactClicks": 0, "topWork": ""},
    )
    draft["site"]["published"] = bool(row["slug"])
    return {
        "portfolio": draft,
        "revision": row["revision"],
        "publishedSlug": row["slug"],
        "credits": credits,
    }


@router.get("/sites/me")
def load(user=Depends(user_from_session)):
    with engine.connect() as conn:
        credits = conn.execute(
            text("SELECT ai_credits FROM accounts WHERE id = :id"), user
        ).scalar_one()
        return draft_response(get_draft(conn, user["id"]), credits)


@router.put("/sites/me")
def save(body: Draft, user=Depends(user_from_session)):
    draft = body.portfolio.model_dump(exclude_none=True)
    with engine.begin() as conn:
        if not valid_public_slug(draft["site"]["slug"]):
            previous = get_draft(conn, user["id"])
            old_slug = json.loads(previous["draft"])["site"]["slug"] if previous else None
            if old_slug != draft["site"]["slug"]:
                raise HTTPException(
                    422, "Este endereço é reservado pelo MeuSite. Escolha outro nome."
                )
        params = {
            "id": user["id"],
            "draft": json.dumps(draft, ensure_ascii=False),
            "revision": body.revision,
        }
        if body.revision == 0:
            result = conn.execute(
                text("""INSERT INTO sites (account_id, draft) VALUES (:id, :draft)
                ON CONFLICT(account_id) DO NOTHING"""),
                params,
            )
        else:
            result = conn.execute(
                text("""UPDATE sites SET draft = :draft, revision = revision + 1
                WHERE account_id = :id AND revision = :revision"""),
                params,
            )
        if not result.rowcount:
            raise HTTPException(
                409, "O rascunho mudou em outra aba. Recarregue antes de continuar."
            )
    return {"revision": body.revision + 1}


class PublishRequest(BaseModel):
    revision: int = Field(ge=1)


@router.post("/sites/me/publish")
def publish(body: PublishRequest, user=Depends(user_from_session)):
    try:
        with engine.begin() as conn:
            row = get_draft(conn, user["id"])
            if not row or row["revision"] != body.revision:
                raise HTTPException(409, "O rascunho mudou. Recarregue e publique novamente.")
            draft = json.loads(row["draft"])
            if not draft["profile"]["name"].strip():
                raise HTTPException(422, "Preencha o nome no perfil.")
            slug = draft["site"]["slug"]
            if not valid_public_slug(slug):
                raise HTTPException(
                    422, "Este endereço é reservado pelo MeuSite. Escolha outro nome."
                )
            result = conn.execute(
                text("""UPDATE sites SET slug = :slug, published = :snapshot,
                revision = revision + 1 WHERE account_id = :id AND revision = :revision"""),
                {
                    "id": user["id"],
                    "slug": slug,
                    "snapshot": json.dumps(public_snapshot(draft), ensure_ascii=False),
                    "revision": row["revision"],
                },
            )
            if not result.rowcount:
                raise HTTPException(409, "O rascunho mudou. Recarregue e publique novamente.")
            return {"publishedSlug": slug, "revision": row["revision"] + 1}
    except IntegrityError:
        raise HTTPException(409, "Este endereço já está em uso.") from None


@router.post("/sites/me/unpublish")
def unpublish(user=Depends(user_from_session)):
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE sites SET slug = NULL, published = NULL WHERE account_id = :id"), user
        )
    return {"publishedSlug": None}


def visit_hash(password, salt):
    # Custo menor que o da conta (16 MiB): a senha de visita é checada a cada abertura e clique no
    # site. Divide as vagas de hash com o login (auth.HASH_SLOTS).
    return scrypt_hex(password, salt, 14)


class VisitPassword(BaseModel):
    password: str | None = Field(default=None, min_length=4, max_length=128)


@router.get("/sites/me/visit-password")
def visit_password_state(user=Depends(user_from_session)):
    with engine.connect() as conn:
        row = get_draft(conn, user["id"])
    return {"protected": bool(row and row["visit_password"])}


@router.put("/sites/me/visit-password")
def set_visit_password(body: VisitPassword, user=Depends(user_from_session)):
    value = None
    if body.password:
        salt = secrets.token_bytes(16)
        value = f"{salt.hex()}:{visit_hash(body.password, salt)}"
    with engine.begin() as conn:
        result = conn.execute(
            text("UPDATE sites SET visit_password = :value WHERE account_id = :id"),
            {"value": value, "id": user["id"]},
        )
        if not result.rowcount:
            raise HTTPException(409, "Salve o portfólio antes de definir a senha.")
    return {"protected": bool(value)}


@router.get("/public/sites/{slug}")
def public_site(slug: str, request: Request):
    with engine.begin() as conn:
        row = published_row(conn, slug, request)
        count_event(conn, row["account_id"], "visit")
    return json.loads(row["published"])


def published_row(conn, slug, request):
    row = (
        conn.execute(
            text("SELECT account_id, published, visit_password FROM sites WHERE slug = :slug"),
            {"slug": slug},
        )
        .mappings()
        .first()
    )
    if not row:
        raise HTTPException(404, "Portfólio não publicado ou endereço inválido.")
    if row["visit_password"]:
        given = request.headers.get("X-Site-Password", "")
        if not given:
            raise HTTPException(401, "Este portfólio é protegido por senha.")
        # Passado o limite de erros, recusa antes de calcular o hash (S-01 da auditoria de 08/11).
        check_limit(request, "visit-password", VISIT_CAP)
        salt, expected = row["visit_password"].split(":")
        if not hmac.compare_digest(visit_hash(given[:128], bytes.fromhex(salt)), expected):
            rate_limit(request, "visit-password", VISIT_CAP)
            raise HTTPException(401, "Senha incorreta.")
    return row


def count_event(conn, account_id, kind, item=""):
    day = datetime.now(UTC).date().isoformat()
    conn.execute(
        text("""INSERT INTO site_events (account_id, day, kind, item, hits)
        VALUES (:id, :day, :kind, :item, 1) ON CONFLICT(account_id, day, kind, item)
        DO UPDATE SET hits = site_events.hits + 1"""),
        {"id": account_id, "day": day, "kind": kind, "item": item},
    )


class SiteEvent(BaseModel):
    kind: Literal["contact", "work"]
    item: str = Field(default="", max_length=120)


@router.post("/public/sites/{slug}/events")
def site_event(slug: str, body: SiteEvent, request: Request):
    rate_limit(request, "event", 200)
    with engine.begin() as conn:
        row = published_row(conn, slug, request)
        if body.kind == "work" and not any(
            w["id"] == body.item for w in json.loads(row["published"])["works"]
        ):
            raise HTTPException(404, "Trabalho não publicado.")
        count_event(conn, row["account_id"], body.kind, body.item if body.kind == "work" else "")
    return {"ok": True}


@router.get("/sites/me/analytics")
def analytics(user=Depends(user_from_session)):
    today = datetime.now(UTC).date()
    days = {(today - timedelta(days=i)).isoformat(): 0 for i in range(13, -1, -1)}
    contact = 0
    works = {}
    with engine.connect() as conn:
        rows = conn.execute(
            text("""SELECT day, kind, item, hits FROM site_events
            WHERE account_id = :id AND day >= :start"""),
            {"id": user["id"], "start": next(iter(days))},
        )
        for day, kind, item, hits in rows:
            if kind == "visit" and day in days:
                days[day] += hits
            elif kind == "contact":
                contact += hits
            elif kind == "work":
                works[item] = works.get(item, 0) + hits
        draft = get_draft(conn, user["id"])
    current_works = json.loads(draft["draft"])["works"] if draft else []
    top = max(
        (w for w in current_works if works.get(w["id"])), key=lambda w: works[w["id"]], default=None
    )
    return {
        "visits": list(days.values()),
        "contactClicks": contact,
        "topWork": top["title"] if top else "",
    }


@router.get("/public/directory")
def directory():
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT slug, published FROM sites WHERE slug IS NOT NULL AND visit_password IS NULL"
            )
        )
        entries = []
        for slug, snapshot in rows:
            p = json.loads(snapshot)
            pr = p["profile"]
            if not pr["inDirectory"]:
                continue
            entries.append(
                {
                    "slug": slug,
                    **{
                        k: pr[k]
                        for k in ("name", "headline", "city", "state", "roleId", "available")
                    },
                    "software": list(dict.fromkeys(s for w in p["works"] for s in w["software"]))[
                        :10
                    ],
                    "complete": bool(p["works"] and pr["bio"]),
                    "cover": "grad:265",
                }
            )
        return entries
