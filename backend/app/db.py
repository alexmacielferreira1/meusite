import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import create_engine

SSL_MODES = {"true": "require", "1": "require", "false": "disable", "0": "disable"}


def normalize_url(url):
    """Ajusta URLs de painéis (``postgres://``, ``?ssl=true``) para o driver psycopg."""
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            url = "postgresql+psycopg://" + url.removeprefix(prefix)
            break
    parts = urlsplit(url)
    if parts.scheme.startswith("postgresql") and parts.query:
        query = []
        for key, value in parse_qsl(parts.query, keep_blank_values=True):
            if key == "ssl":
                # O psycopg não conhece "ssl" (formato do Node); o equivalente é "sslmode".
                key, value = "sslmode", SSL_MODES.get(value.lower(), "require")
            query.append((key, value))
        url = urlunsplit(parts._replace(query=urlencode(query)))
    return url


def database_url():
    """URL do PostgreSQL vinda de ``DATABASE_URL``; o MeuSite não roda em outro banco."""
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL não definida: o MeuSite usa PostgreSQL (veja env.example)."
        )
    url = normalize_url(url)
    if not url.startswith("postgresql+psycopg://"):
        raise RuntimeError("DATABASE_URL precisa apontar para PostgreSQL (postgresql://...).")
    return url


engine = create_engine(database_url(), pool_pre_ping=True)
