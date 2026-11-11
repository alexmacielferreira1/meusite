import json
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import text

from app.db import engine
from app.main import app
from app.modules.business import Business, Submission, quote_order


@pytest.fixture(autouse=True)
def reset_test_limits():
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM rate_limits"))
        conn.execute(text("DELETE FROM kit_login_falhas"))


def business(**patch):
    return Business.model_validate(
        {
            "segment": "pizzaria",
            "name": "Pizza Teste",
            "orderMode": "order",
            "halfPizza": True,
            "deliveryFeeCents": 500,
            "deliveryPostalPrefixes": "240,242",
            "minimumOrderCents": 2000,
            "items": [
                {
                    "id": "m",
                    "name": "Margherita",
                    "kind": "product",
                    "category": "Pizza",
                    "priceCents": 4000,
                    "allowHalf": True,
                    "options": [{"id": "b", "name": "Borda", "priceCents": 800}],
                },
                {
                    "id": "q",
                    "name": "Queijos",
                    "kind": "product",
                    "category": "Pizza",
                    "priceCents": 5000,
                    "allowHalf": True,
                },
            ],
            **patch,
        }
    )


def submission(**patch):
    return Submission.model_validate(
        {
            "clientToken": str(uuid4()),
            "kind": "order",
            "name": "Cliente Teste",
            "phone": "21999999999",
            "items": [{"itemId": "m", "quantity": 2, "options": ["b"], "halfItemId": "q"}],
            "consent": True,
            **patch,
        }
    )


def test_server_calculates_half_options_and_delivery():
    payload, total = quote_order(
        business(),
        submission(fulfillment="delivery", address="Rua de Teste, 100", postalCode="24000-000"),
    )
    assert total == 12100
    assert payload["items"][0]["unitCents"] == 5800
    assert payload["deliveryFeeCents"] == 500
    _, average = quote_order(business(halfRule="average"), submission())
    assert average == 10600


@pytest.mark.parametrize(
    "patch",
    [
        {"items": []},
        {"items": [{"itemId": "x", "quantity": 1}]},
        {"items": [{"itemId": "m", "quantity": 1, "options": ["b", "b"]}]},
        {"fulfillment": "delivery", "address": "Rua qualquer, 100", "postalCode": "99999-000"},
    ],
)
def test_invalid_cart_rejected(patch):
    from fastapi import HTTPException

    with pytest.raises(HTTPException):
        quote_order(business(), submission(**patch))


def test_private_fields_and_wrong_urls_rejected():
    with pytest.raises(ValidationError):
        business(items=[{"id": "x", "name": "Bad", "image": "javascript:alert(1)"}])
    with pytest.raises(ValidationError):
        business(items=[{"id": "x", "name": "Bad", "tourUrl": "javascript:alert(1)"}])
    with pytest.raises(ValidationError):
        submission(consent=False)
    with pytest.raises(ValidationError):
        submission(totalCents=1)


def account():
    c = TestClient(
        app, base_url="http://localhost:8000", headers={"Origin": "http://localhost:8000"}
    )
    r = c.post(
        "/api/v1/auth/register",
        json={
            "name": "Teste MeuSite",
            "email": uuid4().hex + "@example.test",
            "password": "A-senha-de-teste-123",
        },
    )
    assert r.status_code == 201, r.text
    return c


def publish(c, b):
    me = c.get("/api/v1/auth/me").json()
    slug = "loja-" + uuid4().hex[:10]
    draft = {
        "business": b.model_dump(),
        "profile": {
            "name": b.name,
            "email": "",
            "headline": "Negócio teste",
            "roleId": "editor",
            "city": "",
            "state": "",
            "bio": "",
            "whatsapp": "",
            "instagram": "",
            "linkedin": "",
            "website": "",
            "available": False,
            "stats": [],
            "pillars": [],
        },
        "works": [],
        "clients": [],
        "services": [],
        "experience": [],
        "education": [],
        "testimonials": [],
        "site": {
            "slug": slug,
            "templateId": "biz-pizzaria",
            "theme": {"accent": "#176d58", "mode": "light", "font": "sans", "radius": "lg"},
            "sections": [],
        },
    }
    r = c.put("/api/v1/sites/me", json={"revision": 0, "portfolio": draft})
    assert r.status_code == 200, r.text
    r = c.post("/api/v1/sites/me/publish", json={"revision": r.json()["revision"]})
    assert r.status_code == 200, r.text
    return slug, me


def test_order_end_to_end_owned_inbox_idempotency_and_snapshot():
    c = account()
    slug, _ = publish(c, business())
    public = TestClient(
        app, base_url="http://localhost:8000", headers={"Origin": "http://localhost:8000"}
    )
    data = submission().model_dump()
    r = public.post(f"/api/v1/business/{slug}/requests", json=data)
    assert r.status_code == 201, r.text
    assert r.json()["totalCents"] == 11600
    duplicate = public.post(f"/api/v1/business/{slug}/requests", json=data)
    assert duplicate.status_code == 201 and duplicate.json()["id"] == r.json()["id"]
    assert public.get("/api/v1/business/me/requests").status_code == 401
    other = account()
    assert other.get("/api/v1/business/me/requests").json() == []
    assert (
        other.patch(
            "/api/v1/business/me/requests/" + r.json()["id"], json={"status": "confirmed"}
        ).status_code
        == 404
    )
    inbox = c.get("/api/v1/business/me/requests").json()
    assert len(inbox) == 1 and inbox[0]["payload"]["name"] == "Cliente Teste"
    assert (
        c.patch(
            "/api/v1/business/me/requests/" + r.json()["id"], json={"status": "confirmed"}
        ).status_code
        == 200
    )
    snapshot = public.get("/api/v1/public/sites/" + slug).json()
    assert snapshot["business"]["name"] == "Pizza Teste"
    assert "requests" not in json.dumps(snapshot)
    assert c.post("/api/v1/sites/me/unpublish").status_code == 200
    assert (
        public.post(f"/api/v1/business/{slug}/requests", json=submission().model_dump()).status_code
        == 404
    )


def test_booking_requires_future_date_and_remains_request():
    from fastapi import HTTPException

    with pytest.raises(HTTPException):
        quote_order(
            business(orderMode="booking"),
            submission(kind="booking", date="2000-01-01T10:00", items=[]),
        )
    payload, total = quote_order(
        business(orderMode="booking"), submission(kind="booking", date="2099-01-01T10:00", items=[])
    )
    assert total == 0 and payload["date"] == "2099-01-01T10:00"


def test_business_closed_and_duplicate_ids_are_rejected():
    from fastapi import HTTPException

    with pytest.raises(HTTPException):
        quote_order(business(openForOrders=False), submission())
    with pytest.raises(ValidationError):
        business(items=[{"id": "a", "name": "A"}, {"id": "a", "name": "B"}])


def test_only_safe_local_demo_images_allowed():
    assert business(heroImage="/demos/photo-123-example.jpg").heroImage.startswith("/demos/")
    with pytest.raises(ValidationError):
        business(heroImage="//evil.example/test.jpg")
    with pytest.raises(ValidationError):
        business(heroImage="/demos/../../secret.jpg")


def test_database_identity_guard(monkeypatch):
    import importlib.util
    from pathlib import Path

    spec = importlib.util.spec_from_file_location(
        "meusite_run", Path(__file__).parents[2] / "run.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.validate_product_database()
    import sqlalchemy

    class WrongDatabase:
        def has_table(self, name):
            return name == "accounts"

    monkeypatch.setattr(sqlalchemy, "inspect", lambda engine: WrongDatabase())
    with pytest.raises(RuntimeError, match="Folios"):
        module.validate_product_database()
