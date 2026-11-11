"""Cabeçalhos de segurança, CSP, origem (CSRF) e limite de corpo. Kit ``_kit_web`` 0.2.0.

Não edite este arquivo no app: a mudança volta para o kit, e o app recebe a versão nova.

Base legal: LGPD art. 46 (medidas de segurança técnicas para proteger dados pessoais de acessos não
autorizados) e art. 6º VII e VIII (segurança e prevenção); Decreto 8.771/2016 art. 13 (padrões de
segurança na guarda de dados).

Peças, todas ASGI puro (valem também para resposta em fluxo e não leem o corpo à toa):

- ``CabecalhosMiddleware``: ``nosniff``, ``frame-ancestors``/``X-Frame-Options``,
  ``Referrer-Policy``, ``Permissions-Policy``, ``Cross-Origin-Opener-Policy``, ``no-store``, CSP
  e, em produção, HSTS.
  A rota que já pôs um cabeçalho (ex.: ``Cache-Control`` de arquivo público) mantém o dela.
- ``OrigemMiddleware``: mutação (POST/PUT/PATCH/DELETE) que traz o cookie de sessão precisa de
  ``Origin`` (ou ``Referer``) confiável. Quem manda ``Authorization: Bearer`` não usa cookie e
  passa.
- ``LimiteCorpoMiddleware``: conta os bytes que chegam, com ou sem ``Content-Length`` (envio
  chunked). O teto maior só vale quando o app confirma que o token é válido; ter o cabeçalho
  ``Authorization`` ou o cookie não basta.

Ordem no ``main.py`` (``add_middleware`` empilha por fora): limite de corpo, depois origem, depois
cabeçalhos e, por último, o ``ProxyConfiavelMiddleware`` (``proxy.py``), que fica por fora de todos.
"""

from __future__ import annotations

import json
from collections.abc import Callable, Iterable, Mapping
from urllib.parse import urlsplit

from starlette.datastructures import Headers, MutableHeaders
from starlette.requests import Request

VERSAO_KIT = "0.2.0"
METODOS_SEGUROS = frozenset({"GET", "HEAD", "OPTIONS", "TRACE"})
MAX_CORPO = 1_000_000
MAX_CORPO_COM_TOKEN = 64 * 1024 * 1024

# CSP padrão do HUB: front React/Vite servido pela própria API, fontes do Google.
CSP_PADRAO: dict[str, tuple[str, ...]] = {
    "default-src": ("'self'",),
    "script-src": ("'self'",),
    "style-src": ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com"),
    "font-src": ("'self'", "data:", "https://fonts.gstatic.com"),
    "img-src": ("'self'", "data:", "blob:", "https:"),
    "connect-src": ("'self'",),
    "object-src": ("'none'",),
    "base-uri": ("'self'",),
    "form-action": ("'self'",),
    "frame-ancestors": ("'none'",),
}
MODOS_CSP = frozenset({"relatorio", "bloquear", "desligado"})


def montar_csp(extra: Mapping[str, Iterable[str]] | None = None) -> str:
    """CSP padrão, com fontes extras por diretiva (ex.: ``{"connect-src": ["https://api.x"]}``)."""
    diretivas = {nome: list(fontes) for nome, fontes in CSP_PADRAO.items()}
    for nome, fontes in (extra or {}).items():
        atuais = diretivas.setdefault(nome, [])
        atuais.extend(fonte for fonte in fontes if fonte not in atuais)
    return "; ".join(f"{nome} {' '.join(fontes)}" for nome, fontes in diretivas.items())


def cabecalhos_seguranca(
    producao: bool,
    csp: str | None = None,
    modo_csp: str = "relatorio",
    permissoes: str = "camera=(), microphone=(), geolocation=()",
) -> list[tuple[str, str]]:
    """A lista de cabeçalhos que o middleware põe em toda resposta.

    ``modo_csp``: ``relatorio`` (só avisa no console; para começar sem quebrar tela), ``bloquear``
    (vale de verdade) ou ``desligado``. HSTS só em produção: em ``localhost`` ele travaria o http.
    """
    if modo_csp not in MODOS_CSP:
        raise ValueError(f"modo_csp deve ser um de {sorted(MODOS_CSP)}")
    lista = [
        ("x-content-type-options", "nosniff"),
        ("x-frame-options", "DENY"),
        ("referrer-policy", "strict-origin-when-cross-origin"),
        ("permissions-policy", permissoes),
        ("cross-origin-opener-policy", "same-origin"),
        ("cache-control", "no-store"),
    ]
    if modo_csp != "desligado":
        nome = "content-security-policy"
        if modo_csp == "relatorio":
            nome += "-report-only"
        lista.append((nome, csp or montar_csp()))
    if producao:
        lista.append(("strict-transport-security", "max-age=31536000; includeSubDomains"))
    return lista


class CabecalhosMiddleware:
    """Põe os cabeçalhos de ``cabecalhos_seguranca`` em toda resposta HTTP, sem sobrescrever."""

    def __init__(self, app, producao: bool, csp: str | None = None, modo_csp: str = "relatorio"):
        self.app = app
        self.cabecalhos = cabecalhos_seguranca(producao, csp, modo_csp)

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def enviar(mensagem):
            if mensagem["type"] == "http.response.start":
                headers = MutableHeaders(scope=mensagem)
                for nome, valor in self.cabecalhos:
                    if nome not in headers:
                        headers.append(nome, valor)
            await send(mensagem)

        await self.app(scope, receive, enviar)


async def _responder_json(send, status: int, corpo: dict) -> None:
    dados = json.dumps(corpo, ensure_ascii=False).encode("utf-8")
    await send(
        {
            "type": "http.response.start",
            "status": status,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(dados)).encode()),
            ],
        }
    )
    await send({"type": "http.response.body", "body": dados})


def normalizar_origem(valor: str | None) -> str | None:
    """``esquema://host[:porta]`` em minúsculas, sem a porta padrão; ``None`` se não for http(s)."""
    if not valor:
        return None
    partes = urlsplit(valor.strip())
    if partes.scheme not in {"http", "https"} or not partes.hostname:
        return None
    try:
        porta = partes.port
    except ValueError:
        return None
    padrao = 443 if partes.scheme == "https" else 80
    sufixo = f":{porta}" if porta and porta != padrao else ""
    return f"{partes.scheme}://{partes.hostname.lower()}{sufixo}"


def origem_permitida(request: Request, cookie: str, permitidas: frozenset[str]) -> bool:
    """Mutação com cookie de sessão só de origem confiável (a própria API ou ``permitidas``)."""
    if request.method in METODOS_SEGUROS or cookie not in request.cookies:
        return True
    if request.headers.get("authorization", "").lower().startswith("bearer "):
        return True
    origem = normalizar_origem(request.headers.get("origin")) or normalizar_origem(
        request.headers.get("referer")
    )
    if origem is None:
        return False
    return origem == normalizar_origem(str(request.base_url)) or origem in permitidas


class OrigemMiddleware:
    """Recusa com 403 (``code: origem``) a mutação com cookie vinda de outro site (CSRF)."""

    def __init__(self, app, cookie: str, permitidas: Iterable[str] = ()):
        self.app = app
        self.cookie = cookie
        self.permitidas = frozenset(o for o in map(normalizar_origem, permitidas) if o)

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] == "http" and not origem_permitida(
            Request(scope), self.cookie, self.permitidas
        ):
            await _responder_json(send, 403, {"detail": "Origem não permitida", "code": "origem"})
            return
        await self.app(scope, receive, send)


class LimiteCorpoMiddleware:
    """Recusa com 413 (``code: corpo_grande``) corpo acima do teto, com ou sem tamanho declarado.

    - ``maximo``: teto de todo pedido.
    - ``maximo_com_token`` só vale quando ``token_valido(request)`` devolve ``True`` (o app confere
      assinatura e validade do token; cabeçalho presente não basta) e o caminho começa com um de
      ``caminhos_com_token`` (``None`` = qualquer rota).
    - O ``Content-Length`` acima do teto é recusado antes de a rota começar. Sem ele (chunked), os
      bytes são contados na leitura: passou do teto, a rota recebe ``http.disconnect`` e a
      resposta vira 413 (se a rota ainda não começou a responder).
    """

    def __init__(
        self,
        app,
        maximo: int = MAX_CORPO,
        maximo_com_token: int = MAX_CORPO_COM_TOKEN,
        token_valido: Callable[[Request], bool] | None = None,
        caminhos_com_token: Iterable[str] | None = None,
    ):
        if maximo < 1 or maximo_com_token < maximo:
            raise ValueError("limites de corpo inválidos: 1 <= maximo <= maximo_com_token")
        self.app = app
        self.maximo = maximo
        self.maximo_com_token = maximo_com_token
        self.token_valido = token_valido
        self.caminhos = None if caminhos_com_token is None else tuple(caminhos_com_token)

    def limite(self, scope) -> int:
        if self.token_valido is None:
            return self.maximo
        if self.caminhos is not None and not scope["path"].startswith(self.caminhos):
            return self.maximo
        return self.maximo_com_token if self.token_valido(Request(scope)) else self.maximo

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        limite = self.limite(scope)
        declarado = Headers(scope=scope).get("content-length", "")
        if declarado.isdigit() and int(declarado) > limite:
            await _responder_json(send, 413, CORPO_GRANDE)
            return
        estado = {"lido": 0, "cortou": False, "respondeu": False}

        async def receber():
            if estado["cortou"]:
                return {"type": "http.disconnect"}
            mensagem = await receive()
            if mensagem["type"] == "http.request":
                estado["lido"] += len(mensagem.get("body", b""))
                if estado["lido"] > limite:
                    estado["cortou"] = True
                    return {"type": "http.disconnect"}
            return mensagem

        async def enviar(mensagem):
            if estado["cortou"] and not estado["respondeu"]:
                return  # o que a rota responder ao corte dá lugar ao 413
            estado["respondeu"] = True
            await send(mensagem)

        try:
            await self.app(scope, receber, enviar)
        except Exception:
            if not estado["cortou"]:
                raise
        if estado["cortou"] and not estado["respondeu"]:
            await _responder_json(send, 413, CORPO_GRANDE)


CORPO_GRANDE = {"detail": "Envio grande demais", "code": "corpo_grande"}
