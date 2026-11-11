"""Título e prévia do link compartilhado (/p/<endereço> e /o/<código>).

O site é uma SPA e os robôs do WhatsApp, LinkedIn e afins não rodam JavaScript: sem isto, todo
link mostrava só "MeuSite — portfólios…". A API devolve o index.html com o título e as metas
Open Graph de quem é o portfólio. Não conta visita nem abertura; portfólio com senha, vitrine
desativada ou vencida ficam com a página padrão (não revelam o nome).
"""

import html
import json
import re
import time
from pathlib import Path

from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy import text

from app.db import engine
from app.public_paths import valid_public_slug

SHARE_PATH = re.compile(r"^(p|o)/([A-Za-z0-9_-]{1,80})/?$")
DESCRIPTION_MAX = 200


def https_image(url):
    """Só imagem pública por https (capa do YouTube, foto hospedada); nunca data: nem grad:."""
    if isinstance(url, str) and url.startswith("https://") and len(url) <= 2000:
        return url
    return ""


def cut(value, limit):
    value = " ".join(value.split())
    if len(value) <= limit:
        return value
    return value[:limit].rsplit(" ", 1)[0].rstrip(" ,.;:") + "…"


def portfolio_meta(portfolio):
    profile = portfolio.get("profile") or {}
    name = str(profile.get("name") or "").strip()
    if not name:
        return None
    headline = str(profile.get("headline") or "").strip()
    bio = str(profile.get("bio") or "")
    title = f"{name} · {headline}" if headline else name
    image = https_image(profile.get("photo")) or next(
        (
            https_image(w.get("cover"))
            for w in portfolio.get("works") or []
            if https_image(w.get("cover"))
        ),
        "",
    )
    return {
        "name": name,
        "title": f"{title} | MeuSite",
        "description": cut(bio, DESCRIPTION_MAX)
        or cut(headline, DESCRIPTION_MAX)
        or f"Portfólio de {name} no MeuSite.",
        "image": image,
    }


def share_meta(path):
    match = SHARE_PATH.match(path)
    if match:
        kind, key = match.groups()
    elif valid_public_slug(path):
        kind, key = "p", path
    else:
        return None
    with engine.connect() as conn:
        if kind == "p":
            row = (
                conn.execute(
                    text("""SELECT published, visit_password FROM sites
                    WHERE slug = :key AND published IS NOT NULL"""),
                    {"key": key},
                )
                .mappings()
                .first()
            )
            if not row or row["visit_password"]:
                return None
            return portfolio_meta(json.loads(row["published"]))
        row = (
            conn.execute(
                text("""SELECT title, snapshot FROM opportunities
                WHERE slug = :key AND revoked = 0 AND expires_at > :now"""),
                {"key": key, "now": int(time.time())},
            )
            .mappings()
            .first()
        )
    if not row:
        return None
    meta = portfolio_meta(json.loads(row["snapshot"]))
    if meta:
        meta["title"] = f"Seleção para {row['title']} · {meta['name']} | MeuSite"
    return meta


def inject(page, meta):
    if not meta:
        return page

    def attr(value):
        return html.escape(value, quote=True)

    tags = [
        f'<meta name="description" content="{attr(meta["description"])}" />',
        '<meta property="og:type" content="website" />',
        '<meta property="og:site_name" content="MeuSite" />',
        f'<meta property="og:title" content="{attr(meta["title"])}" />',
        f'<meta property="og:description" content="{attr(meta["description"])}" />',
    ]
    card = "summary"
    if meta["image"]:
        tags.append(f'<meta property="og:image" content="{attr(meta["image"])}" />')
        card = "summary_large_image"
    tags.append(f'<meta name="twitter:card" content="{card}" />')
    page = re.sub(
        r"<title>.*?</title>",
        lambda _m: f"<title>{html.escape(meta['title'], quote=False)}</title>",
        page,
        count=1,
        flags=re.S,
    )
    page = re.sub(
        r'<meta\s+(?:name|property)=["\'](?:description|og:[^"\']+|twitter:[^"\']+)["\'][^>]*>\s*',
        "",
        page,
        flags=re.I,
    )
    return page.replace("</head>", "\n    ".join(tags) + "\n  </head>", 1)


def spa_page(index: Path, path: str):
    """Resposta da SPA: com título e prévia nas rotas compartilháveis, o index.html nas demais."""
    meta = share_meta(path)
    if not meta:
        return FileResponse(index)
    page = inject(index.read_text(encoding="utf-8"), meta)
    return HTMLResponse(page, headers={"Cache-Control": "no-cache"})
