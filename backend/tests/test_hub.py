from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import engine
from app.main import app
from app.modules import hub
from app.modules.auth import (
    COOKIE,
    CSRF_COOKIE,
    SCRYPT_LOG,
    check_password,
    make_password,
    scrypt_hex,
)

TOKEN = "hub-local-test-token-with-more-than-32-characters"


def browser():
    return TestClient(
        app, base_url="http://localhost:8000", headers={"Origin": "http://localhost:8000"}
    )


def test_manifest_and_observation_contract(monkeypatch):
    monkeypatch.setenv("HUB_SERVICE_TOKEN", TOKEN)
    c = browser()
    manifest = c.get("/.well-known/hub/manifest").json()
    assert manifest["product_id"] == "meusite" and manifest["integration_level"] == 1
    assert "commands" not in manifest["endpoints"]
    assert c.get(manifest["endpoints"]["health"]).status_code == 401
    headers = {
        "Authorization": "Bearer " + TOKEN,
        "X-Hub-Audience": "central",
        "X-Hub-Service": "central",
        "X-Hub-Scopes": "hub:observe",
        "X-Correlation-ID": "local-probe-123",
    }
    for path in manifest["endpoints"].values():
        r = c.get(path, headers=headers)
        assert r.status_code == 200, r.text
        assert r.headers["x-correlation-id"] == "local-probe-123"
    assert (
        c.get(
            manifest["endpoints"]["health"], headers={**headers, "X-Hub-Scopes": "hub:admin.write"}
        ).status_code
        == 403
    )
    assert (
        c.get(
            manifest["endpoints"]["health"], headers={**headers, "X-Hub-Audience": "other"}
        ).status_code
        == 403
    )
    assert c.get("/ready").json()["status"] == "ready"
    assert c.get("/version").json()["product_id"] == "meusite"


def test_unconfigured_hub_and_readiness_do_not_expose_secrets(monkeypatch):
    monkeypatch.delenv("HUB_SERVICE_TOKEN", raising=False)
    c = browser()
    assert c.get("/api/hub/v1/health").status_code == 503

    class BrokenEngine:
        def connect(self):
            raise RuntimeError("password=do-not-expose")

    monkeypatch.setattr(hub, "engine", BrokenEngine())
    r = c.get("/ready")
    assert r.status_code == 503
    assert "do-not-expose" not in r.text
    assert r.json()["error"]["retryable"]
    assert r.json()["error"]["correlation_id"] == r.headers["x-correlation-id"]


def test_csrf_is_bound_to_session_and_origin():
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM rate_limits"))
        conn.execute(text("DELETE FROM kit_login_falhas"))
    c = browser()
    r = c.post(
        "/api/v1/auth/register",
        json={
            "name": "CSRF Test",
            "email": uuid4().hex + "@example.test",
            "password": "Password-test-12345",
        },
    )
    assert r.status_code == 201, r.text
    assert c.cookies.get(COOKIE) and c.cookies.get(CSRF_COOKIE)
    assert c.post("/api/v1/auth/logout").status_code == 403
    assert c.post("/api/v1/auth/logout", headers={"X-CSRF-Token": "x" * 43}).status_code == 403
    token = c.cookies.get(CSRF_COOKIE)
    assert (
        c.post(
            "/api/v1/auth/logout",
            headers={"X-CSRF-Token": token, "Origin": "https://other.example"},
        ).status_code
        == 403
    )
    assert c.get("/api/v1/auth/session").status_code == 200
    assert c.post("/api/v1/auth/logout", headers={"X-CSRF-Token": token}).status_code == 200


def test_argon2_and_legacy_password_upgrade():
    encoded = make_password("correct-pass")
    assert encoded.startswith("$argon2id$")
    assert check_password("correct-pass", encoded) == (True, False)
    assert check_password("wrong-pass", encoded) == (False, False)
    salt = b"0123456789012345"
    old = f"s{SCRYPT_LOG}:{salt.hex()}:{scrypt_hex('correct-pass', salt, SCRYPT_LOG)}"
    assert check_password("correct-pass", old) == (True, True)
    assert check_password("x", "unrecognized") == (False, False)
