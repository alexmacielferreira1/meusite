import time
from uuid import uuid4

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import engine
from app.main import app
from app.modules.auth import COOKIE
from app.security.jwt_tokens import ALGORITHM, AUDIENCE, ISSUER, SECRET, create_token, token_subject


def test_token_claims_and_validation():
    token = create_token("account-test", 600)
    claims = jwt.decode(token, SECRET, algorithms=[ALGORITHM], audience=AUDIENCE, issuer=ISSUER)
    assert claims["sub"] == "account-test"
    assert claims["exp"] - claims["iat"] == 600
    assert len(claims["jti"]) >= 16
    assert token_subject(token) == "account-test"
    assert token_subject("opaque-session-token") is None
    assert token_subject(token + "tamper") is None


def test_expiry_issuer_audience_and_algorithm():
    now = int(time.time())
    claims = {
        "sub": "test",
        "jti": "j" * 32,
        "iat": now - 200,
        "nbf": now - 200,
        "exp": now + 600,
        "iss": ISSUER,
        "aud": AUDIENCE,
    }
    for patch in [
        {"exp": now - 100},
        {"iss": "other-product"},
        {"aud": "other-client"},
        {"nbf": now + 500},
        {"jti": ""},
    ]:
        bad = jwt.encode({**claims, **patch}, SECRET, algorithm=ALGORITHM)
        assert token_subject(bad) is None
    unsigned = jwt.encode(claims, "", algorithm="none")
    assert token_subject(unsigned) is None
    assert (
        token_subject(
            jwt.encode(claims, "another-secret-with-at-least-32-characters", algorithm=ALGORITHM)
        )
        is None
    )


def test_jwt_cookie_is_httponly_and_logout_revokes_replay():
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM rate_limits"))
        conn.execute(text("DELETE FROM kit_login_falhas"))
    c = TestClient(
        app, base_url="http://localhost:8000", headers={"Origin": "http://localhost:8000"}
    )
    response = c.post(
        "/api/v1/auth/register",
        json={
            "name": "JWT Test",
            "email": uuid4().hex + "@example.test",
            "password": "Password-test-12345",
        },
    )
    assert response.status_code == 201, response.text
    token = c.cookies.get(COOKIE)
    assert token and token.count(".") == 2
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "SameSite=lax" in response.headers["set-cookie"]
    assert token_subject(token) == response.json()["id"]
    assert c.get("/api/v1/auth/session").status_code == 200
    assert c.post("/api/v1/auth/logout").status_code == 200
    replay = TestClient(app, base_url="http://localhost:8000")
    replay.cookies.set(COOKIE, token)
    assert replay.get("/api/v1/auth/session").status_code == 401


def test_signed_token_without_persisted_session_is_denied():
    c = TestClient(app, base_url="http://localhost:8000")
    c.cookies.set(COOKIE, create_token(str(uuid4()), 600))
    assert c.get("/api/v1/auth/session").status_code == 401
