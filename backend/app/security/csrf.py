"""Token CSRF separado e vinculado à sessão, além da validação de Origin."""

import hashlib
import hmac
import re
import time

from sqlalchemy import text

from app.core.database import engine

TOKEN = re.compile(r"^[A-Za-z0-9_-]{32,100}$")


def valid_csrf(request, session_cookie, csrf_cookie):
    cookie = request.cookies.get(csrf_cookie, "")
    header = request.headers.get("X-CSRF-Token", "")
    if (
        not TOKEN.fullmatch(cookie)
        or not TOKEN.fullmatch(header)
        or not hmac.compare_digest(cookie, header)
    ):
        return False
    token = request.cookies.get(session_cookie, "")
    if not token or len(token) > 4096:
        return False
    with engine.connect() as conn:
        hashed = conn.execute(
            text("SELECT csrf_hash FROM sessions WHERE token_hash=:token AND expires_at>:now"),
            {"token": hashlib.sha256(token.encode()).hexdigest(), "now": int(time.time())},
        ).scalar()
    return bool(hashed and hmac.compare_digest(hashed, hashlib.sha256(cookie.encode()).hexdigest()))
