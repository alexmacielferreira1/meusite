"""Aviso público de privacidade (LGPD art. 9º) a partir de ``app/privacidade/privacidade.toml``.

Usa só a configuração do ``_kit_privacidade`` 0.1.1: sem as tabelas de consentimento, pedidos do
titular e registro de acesso (o Folios ainda não envia e-mail; pedidos vão por e-mail ao
encarregado, ``pedidos_online = false``).
"""

from functools import cache
from pathlib import Path

from fastapi import APIRouter

from app.privacidade.config_privacidade import aviso_publico, carregar_config

router = APIRouter(prefix="/privacidade")
CONFIG = Path(__file__).resolve().parents[1] / "privacidade" / "privacidade.toml"


@cache
def aviso():
    # Lida uma vez por processo: arquivo com erro derruba a subida, não a página.
    return aviso_publico(carregar_config(CONFIG))


@router.get("/aviso")
def aviso_route():
    return aviso()
