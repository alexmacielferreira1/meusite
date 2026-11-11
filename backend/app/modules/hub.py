"""Contrato de observação nível 1 compatível com o HubConnector da Central."""

import hmac
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import engine

router = APIRouter()


def require_observer(request: Request):
    expected = os.getenv("HUB_SERVICE_TOKEN", "")
    if len(expected) < 32:
        raise HTTPException(503, "A conexão com a Central ainda não foi configurada.")
    authorization = request.headers.get("Authorization", "")
    token = authorization[7:] if authorization.startswith("Bearer ") else ""
    if not token or not hmac.compare_digest(token, expected):
        raise HTTPException(401, "Credencial de serviço inválida.")
    if (
        request.headers.get("X-Hub-Audience") != "central"
        or request.headers.get("X-Hub-Service") != "central"
    ):
        raise HTTPException(403, "Identidade do serviço inválida.")
    if request.headers.get("X-Hub-Scopes") != "hub:observe":
        raise HTTPException(403, "Escopo de observação obrigatório.")


def ready_payload():
    try:
        with engine.connect() as conn:
            identity = conn.execute(text("SELECT name FROM product_identity WHERE id=1")).scalar()
            if identity != "meusite":
                raise RuntimeError("wrong product")
            conn.execute(text("SELECT 1 FROM accounts LIMIT 1"))
        return {"status": "ready", "product_id": "meusite", "services": {"database": "ok"}}
    except Exception:
        raise HTTPException(503, "Serviço temporariamente indisponível.") from None


@router.get("/.well-known/hub/manifest")
def manifest():
    s = get_settings()
    return {
        "schema_version": "1.0",
        "product_id": s.product_id,
        "name": s.app_name,
        "version": s.version,
        "admin_api_version": "v1",
        "integration_level": 1,
        "capabilities": ["hub:observe"],
        "endpoints": {
            "health": "/api/hub/v1/health",
            "readiness": "/api/hub/v1/readiness",
            "version": "/api/hub/v1/version",
        },
        "limits": {"one_site_per_account": True},
    }


@router.get("/api/hub/v1/health", dependencies=[Depends(require_observer)])
def service_health():
    return {"status": "healthy", "product_id": "meusite"}


@router.get("/api/hub/v1/readiness", dependencies=[Depends(require_observer)])
def service_readiness():
    return ready_payload()


@router.get("/api/hub/v1/version", dependencies=[Depends(require_observer)])
def service_version():
    return version()


@router.get("/version")
def version():
    s = get_settings()
    return {
        "product_id": s.product_id,
        "version": s.version,
        "build": s.build,
        "environment": s.app_env,
    }


@router.get("/ready")
def ready():
    return ready_payload()
