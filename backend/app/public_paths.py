"""Reserved product paths. Keep in sync with frontend publicPaths.ts (tested)."""

import re

RESERVED_SLUGS = frozenset(
    [
        "api",
        "app",
        "assets",
        "brand",
        "build",
        "cadastro",
        "checkout",
        "configuracoes",
        "contato",
        "diretorio",
        "docs",
        "entrar",
        "exemplo",
        "favicon",
        "health",
        "login",
        "logout",
        "media",
        "modelos",
        "pranchas",
        "o",
        "p",
        "planos",
        "preview",
        "privacidade",
        "redoc",
        "robots",
        "sitemap",
        "static",
        "suporte",
        "termos",
        "uploads",
    ]
)
SHORT_SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def valid_public_slug(slug):
    return bool(len(slug) <= 64 and SHORT_SLUG.fullmatch(slug) and slug not in RESERVED_SLUGS)
