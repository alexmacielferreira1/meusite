"""Limite de pedidos por chave (IP, conta) em janela deslizante. Kit ``_kit_web`` 0.2.0.

Não edite este arquivo no app: a mudança volta para o kit, e o app recebe a versão nova.

Base legal: LGPD art. 46 (segurança contra acesso não autorizado). Segura tentativa em massa de
login, cadastro e formulário público vinda do mesmo endereço. Vale por processo (memória): para o
bloqueio de login que precisa valer entre processos e reinícios, use ``bloqueio_login.py``.

A quantidade de chaves tem teto, para a memória não crescer sem limite. A chave (IP) fica só na
memória e some quando sai da janela: nada é gravado (LGPD art. 6º III, necessidade).
"""

from __future__ import annotations

import time
from collections import deque
from threading import Lock

VERSAO_KIT = "0.2.0"


class RateLimiter:
    """``hit(chave)`` devolve ``False`` quando a chave passou de ``limit`` pedidos na janela."""

    def __init__(self, limit: int, window_seconds: float, max_keys: int = 10_000):
        if limit < 1 or window_seconds <= 0 or max_keys < 1:
            raise ValueError("limite, janela e teto de chaves precisam ser positivos")
        self.limit = limit
        self.window = window_seconds
        self.max_keys = max_keys
        self._hits: dict[str, deque[float]] = {}
        self._lock = Lock()

    def hit(self, key: str, now: float | None = None) -> bool:
        now = time.monotonic() if now is None else now
        with self._lock:
            if key not in self._hits and len(self._hits) >= self.max_keys:
                self._make_room(now)
            bucket = self._hits.setdefault(key, deque())
            while bucket and now - bucket[0] > self.window:
                bucket.popleft()
            if len(bucket) >= self.limit:
                return False
            bucket.append(now)
            return True

    def forget(self, key: str) -> None:
        """Esquece a chave (ex.: login certo, troca de senha)."""
        with self._lock:
            self._hits.pop(key, None)

    def _make_room(self, now: float) -> None:
        """Tira quem já saiu da janela; se todos estão ativos, os 10% mais antigos."""
        expired = [k for k, b in self._hits.items() if not b or now - b[-1] > self.window]
        for key in expired:
            del self._hits[key]
        if len(self._hits) >= self.max_keys:
            for key in list(self._hits)[: max(1, self.max_keys // 10)]:
                del self._hits[key]

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


def ip_do_pedido(request) -> str:
    """IP do pedido (já trocado pelo real pelo ``proxy.py``), ou ``desconhecido``."""
    return request.client.host if request.client else "desconhecido"
