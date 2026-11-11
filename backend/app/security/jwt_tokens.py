"""JWT assinado do MeuSite. Sessões persistidas mantêm logout/revogação imediatos."""

import os
import secrets
import time

import jwt

ISSUER = "meusite"
AUDIENCE = "meusite-web"
ALGORITHM = "HS256"
SECRET = os.getenv("JWT_SECRET", "")
if not SECRET and os.getenv("COOKIE_SECURE", "true").lower() == "false":
    # Development only: ephemeral key; production always requires its own secret.
    SECRET = secrets.token_urlsafe(48)
if len(SECRET) < 32:
    raise RuntimeError("Configure JWT_SECRET próprio do MeuSite com pelo menos 32 caracteres.")


def create_token(account_id: str, ttl: int) -> str:
    now = int(time.time())
    return jwt.encode(
        {
            "sub": account_id,
            "jti": secrets.token_urlsafe(32),
            "iat": now,
            "nbf": now,
            "exp": now + ttl,
            "iss": ISSUER,
            "aud": AUDIENCE,
        },
        SECRET,
        algorithm=ALGORITHM,
    )


def token_subject(token: str) -> str | None:
    if not token or len(token) > 4096:
        return None
    try:
        claims = jwt.decode(
            token,
            SECRET,
            algorithms=[ALGORITHM],
            issuer=ISSUER,
            audience=AUDIENCE,
            leeway=5,
            options={
                "require": ["sub", "jti", "iat", "nbf", "exp", "iss", "aud"],
                "strict_aud": True,
            },
        )
        if not isinstance(claims["sub"], str) or not claims["sub"]:
            return None
        if not isinstance(claims["jti"], str) or not 16 <= len(claims["jti"]) <= 80:
            return None
        return claims["sub"]
    except jwt.InvalidTokenError:
        return None
