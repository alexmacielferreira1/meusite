import mimetypes
import os
import traceback
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.db import engine
from app.modules import (
    admin,
    ai,
    aiadmin,
    auth,
    business,
    links,
    privacidade,
    share,
    sites,
)
from app.public_paths import valid_public_slug
from app.security.proxy import ProxyConfiavelMiddleware
from app.security.seguranca_http import CabecalhosMiddleware, LimiteCorpoMiddleware, montar_csp

# Keep WebP delivery consistent on Windows and Linux.
mimetypes.add_type("image/webp", ".webp")

app = FastAPI(title="MeuSite API", version="0.2.0")
for module in (auth, sites, business, ai, links, aiadmin, admin, privacidade):
    app.include_router(module.router, prefix="/api/v1")
app.include_router(admin.public_router, prefix="/api/v1")

origins = set(
    os.getenv(
        "APP_ORIGINS",
        "http://localhost:5173,http://localhost:8000,http://127.0.0.1:5173,http://127.0.0.1:8000",
    ).split(",")
)
MAX_BODY = 8 * 1024 * 1024  # imagens dos trabalhos vão em data URL no JSON do rascunho
# CSP do kit _kit_web + o que o Folios usa: vídeo do YouTube (sem cookie) e do Vimeo em iframe,
# áudio/vídeo de links https e a prévia do editor, que abre o próprio site num iframe.
CSP = montar_csp(
    {
        "frame-src": ["'self'", "https://www.youtube-nocookie.com", "https://player.vimeo.com"],
        "media-src": ["'self'", "https:", "data:", "blob:"],
    }
).replace("frame-ancestors 'none'", "frame-ancestors 'self'")


def csp_mode():
    """``relatorio`` (padrão: só avisa no console), ``bloquear`` ou ``desligado`` (CSP_MODE)."""
    mode = os.getenv("CSP_MODE", "relatorio").strip().lower()
    return mode if mode in {"relatorio", "bloquear", "desligado"} else "relatorio"


def proxy_hops():
    """Proxies confiáveis à frente da API (TRUSTED_PROXY_HOPS; na ShardCloud, 2)."""
    return int(os.getenv("TRUSTED_PROXY_HOPS", "0").strip() or "0")


@app.middleware("http")
async def request_policy(request: Request, call_next):
    path = request.url.path
    api = path.startswith("/api/")
    # CSRF: toda escrita na API exige Origin da lista, com ou sem cookie (mais estrito que o kit).
    if api and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        if request.headers.get("origin") not in origins:
            return JSONResponse({"detail": "Origem da requisição inválida."}, status_code=403)
    response = await call_next(request)
    # Os demais cabeçalhos vêm do kit (CabecalhosMiddleware), que não sobrescreve estes.
    response.headers["X-Frame-Options"] = "SAMEORIGIN"  # prévia do editor em iframe
    if path.startswith("/assets/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    elif path.startswith("/referencias-modelos/"):
        response.headers["Cache-Control"] = "public, max-age=86400"
    elif not api and "cache-control" not in response.headers:
        response.headers["Cache-Control"] = "no-cache"
    if path.startswith(("/o/", "/api/v1/public/opportunities/")):
        response.headers["X-Robots-Tag"] = "noindex, nofollow"
    return response


# Kit _kit_web 0.2.0 (cada add_middleware fica por fora do anterior). Limite de corpo conta os
# bytes mesmo sem Content-Length (chunked); cabeçalhos com CSP e, em produção, HSTS; por fora de
# todos, o IP real atrás do proxy (o run.py sobe o Uvicorn com --no-proxy-headers).
app.add_middleware(LimiteCorpoMiddleware, maximo=MAX_BODY, maximo_com_token=MAX_BODY)
app.add_middleware(CabecalhosMiddleware, producao=auth.SECURE, csp=CSP, modo_csp=csp_mode())
app.add_middleware(ProxyConfiavelMiddleware, saltos=proxy_hops())


@app.exception_handler(RequestValidationError)
async def validation_error(_request, _exc):
    return JSONResponse({"detail": "Confira os dados enviados e tente novamente."}, status_code=422)


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    # Falha não tratada: vai para a aba Erros da Administração, sem expor detalhes a quem chamou.
    admin.record_error(
        "api",
        request.url.path,
        f"{type(exc).__name__}: {exc}",
        "".join(traceback.format_exception(exc)),
    )
    return JSONResponse(
        {"detail": "Erro inesperado no servidor. A equipe já foi avisada."}, status_code=500
    )


@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1 FROM accounts LIMIT 1"))
    return {"status": "ok"}


dist = Path(os.getenv("FRONTEND_DIST", "../frontend/dist"))
ROOT_FILES = {"favicon.svg", "favicon.ico", "build.txt"}
if (dist / "index.html").is_file():
    for folder in ("demos", "fonts", "modelos", "pranchas"):
        if (dist / folder).is_dir():
            app.mount("/" + folder, StaticFiles(directory=dist / folder), name="meusite-" + folder)
    if (dist / "referencias-modelos").is_dir():
        app.mount(
            "/referencias-modelos",
            StaticFiles(directory=dist / "referencias-modelos"),
            name="referencias-modelos",
        )
    if (dist / "brand").is_dir():
        app.mount("/brand", StaticFiles(directory=dist / "brand"), name="brand")
    app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str, request: Request):
        if path.startswith("api/"):
            return JSONResponse({"detail": "Rota não encontrada."}, status_code=404)
        # build.txt é a marca da publicação: o scripts/publicar.ps1 confere por ele a versão no ar.
        if path in ROOT_FILES and (dist / path).is_file():
            return FileResponse(dist / path, headers={"Cache-Control": "no-cache"})
        if path.startswith("p/") and valid_public_slug(path[2:]):
            target = "/" + path[2:]
            if request.url.query:
                target += "?" + request.url.query
            return RedirectResponse(target, status_code=308)
        # /<endereço>, /p/<endereço> legado e /o/<código> saem com o título e a prévia de quem é o portfólio.
        return share.spa_page(dist / "index.html", path)
