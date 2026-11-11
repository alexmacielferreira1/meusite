"""IP real e https atrás do proxy da hospedagem. Kit ``_kit_web`` 0.2.0 (sem mudança desde a 0.1.0).

Não edite este arquivo no app: a mudança volta para o kit, e o app recebe a versão nova.

Por que existe: o ``--proxy-headers`` do Uvicorn com ``--forwarded-allow-ips=*`` usa o primeiro
valor do ``X-Forwarded-For``, que é escrito por quem chama. Com isso qualquer um trocava o próprio
IP a cada pedido, burlava o limite de tentativas e gravava um IP falso na auditoria.

Como funciona: cada proxy confiável acrescenta, à direita, o endereço de quem o procurou. Com
``saltos = N``, o IP certo é o N-ésimo a partir da direita. O que está à esquerda dele foi escrito
pelo visitante e é ignorado. Se o proxy sobrescreve o cabeçalho em vez de acrescentar, a conta dá
no mesmo com um salto. Valor ausente, curto ou inválido: fica o IP da conexão.

No app: ``run.py`` sobe o Uvicorn com ``--no-proxy-headers`` e ``main.py`` põe este middleware por
fora de todos (o último ``add_middleware``), com ``saltos=settings.trusted_proxy_hops``.
"""

import ipaddress

from starlette.datastructures import Headers

VERSAO_KIT = "0.2.0"
MAX_SALTOS = 10


def ip_valido(valor: str) -> str | None:
    """O IP normalizado, ou ``None``. Recusa o escopo de IPv6 (``%eth0``), que não tem tamanho."""
    valor = valor.strip()
    if not valor or "%" in valor:
        return None
    try:
        return str(ipaddress.ip_address(valor))
    except ValueError:
        return None


def ip_encaminhado(valores: list[str], saltos: int) -> str | None:
    """O IP que o último proxy confiável informou, contado pela direita; ``None`` se não houver.

    ``valores`` são todas as linhas ``X-Forwarded-For`` do pedido, na ordem em que chegaram.
    """
    if saltos <= 0:
        return None
    partes = [item for valor in valores for item in valor.split(",")]
    if len(partes) < saltos:
        return None
    return ip_valido(partes[-saltos])


def esquema_encaminhado(valor: str) -> str | None:
    """``http`` ou ``https`` do ``X-Forwarded-Proto``.

    O proxy que acrescenta deixa o valor dele por último.
    """
    esquema = valor.rsplit(",", 1)[-1].strip().lower()
    return esquema if esquema in {"http", "https"} else None


def _saltos_validos(saltos: int) -> int:
    if isinstance(saltos, bool) or not isinstance(saltos, int) or not 0 <= saltos <= MAX_SALTOS:
        raise ValueError(f"saltos de proxy deve ser um inteiro de 0 a {MAX_SALTOS}")
    return saltos


class ProxyConfiavelMiddleware:
    """Troca, no pedido, o endereço do proxy pelo IP real e o esquema pelo que o proxy informou.

    Com ``saltos=0`` (API exposta direto, sem proxy), não lê cabeçalho nenhum.
    """

    def __init__(self, app, saltos: int):
        self.app = app
        self.saltos = _saltos_validos(saltos)

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] in {"http", "websocket"} and self.saltos > 0:
            headers = Headers(scope=scope)
            ip = ip_encaminhado(headers.getlist("x-forwarded-for"), self.saltos)
            if ip:
                scope["client"] = (ip, 0)
            esquema = esquema_encaminhado(headers.get("x-forwarded-proto", ""))
            if esquema:
                if scope["type"] == "websocket":
                    esquema = "wss" if esquema == "https" else "ws"
                scope["scheme"] = esquema
        await self.app(scope, receive, send)
