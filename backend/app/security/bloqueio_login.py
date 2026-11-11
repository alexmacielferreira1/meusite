"""Bloqueio de login por conta + IP, atômico no PostgreSQL. Kit ``_kit_web`` 0.2.0.

Não edite este arquivo no app: a mudança volta para o kit, e o app recebe a versão nova.

Base legal: LGPD art. 46 (segurança) e art. 6º X (responsabilização: o controle tem que funcionar
sob carga). Junta o melhor das branches ``fix/p0-seguranca`` de 08/11/2026: o par conta + IP do
RS Seguro e do MeuRH, o ``INSERT ... ON CONFLICT`` da ClínicaFit e a resposta única do RS Seguro.

Regras:

1. **Terceiro não trava a conta.** A contagem é por par (conta, IP): quem erra a senha de um IP
   bloqueia só aquele par; o titular entra de outro lugar. O teto por conta (todos os IPs) é
   opcional e, quando ligado, só recusa enquanto a janela dura, sem bloqueio longo.
2. **Atômico.** A tentativa é reservada *antes* de conferir a senha, numa instrução só
   (``INSERT ... ON CONFLICT DO UPDATE ... RETURNING``), numa transação própria e curta. Com
   ``max_tentativas=5``, nem 50 pedidos simultâneos conferem mais de 5 senhas por par e janela.
3. **Não revela se o e-mail existe.** A chave é o e-mail normalizado (não o id), então e-mail sem
   conta conta e bloqueia igual. ``conferir_login`` roda um hash falso quando não há conta ou o par
   está bloqueado, e o app responde sempre ``MENSAGEM_LOGIN`` (mesmo status, mesmo texto).
4. **Minimização.** O e-mail não é gravado: vai um HMAC-SHA256 com o segredo do app (LGPD art. 6º
   III e art. 13 §4º, pseudonimização). O IP é dado pessoal: ``expurgar`` apaga o que passou da
   janela e do bloqueio (LGPD art. 15 e 16: término do tratamento quando a finalidade acaba).

Só PostgreSQL. Tabela criada pela migração ``alembic_login_falhas.py`` (copiada para
``alembic/versions`` do app).
"""

from __future__ import annotations

import hashlib
import hmac
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    MetaData,
    String,
    Table,
    case,
    delete,
    func,
    literal,
    select,
)
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.engine import Engine

VERSAO_KIT = "0.2.0"
NOME_TABELA = "kit_login_falhas"

# Mesmo texto para e-mail sem conta, senha errada, conta inativa e par bloqueado.
MENSAGEM_LOGIN = (
    "E-mail ou senha incorretos. Depois de várias tentativas erradas, aguarde alguns minutos."
)
# Recuperar senha: a resposta é a mesma com ou sem conta.
MENSAGEM_RECUPERACAO = "Se houver conta com este e-mail, enviaremos as instruções em instantes."
# Cadastro com e-mail já usado: recusa genérica (rode o hash antes, para levar o mesmo tempo).
MENSAGEM_CADASTRO = (
    "Não foi possível criar a conta com estes dados. Confira o e-mail ou tente entrar."
)

metadata = MetaData()
TABELA = Table(
    NOME_TABELA,
    metadata,
    Column("conta", String(64), primary_key=True),  # HMAC-SHA256 do e-mail normalizado
    Column("ip", String(45), primary_key=True),
    Column("tentativas", Integer, nullable=False),
    Column("janela_inicio", DateTime(timezone=True), nullable=False),
    Column("bloqueado_ate", DateTime(timezone=True)),
    Column("atualizado_em", DateTime(timezone=True), nullable=False, index=True),
)


@dataclass(frozen=True)
class RegraBloqueio:
    """``max_tentativas`` conferências de senha por par na ``janela``; depois, ``bloqueio``."""

    max_tentativas: int = 5
    janela: timedelta = timedelta(minutes=15)
    bloqueio: timedelta = timedelta(minutes=15)
    teto_conta: int | None = None  # tentativas da conta somando todos os IPs (opcional)

    def __post_init__(self):
        if self.max_tentativas < 1 or self.janela <= timedelta(0) or self.bloqueio <= timedelta(0):
            raise ValueError("regra de bloqueio inválida")
        if self.teto_conta is not None and self.teto_conta < self.max_tentativas:
            raise ValueError("teto_conta precisa ser >= max_tentativas")


def _agora(agora: datetime | None) -> datetime:
    agora = agora or datetime.now(UTC)
    if agora.tzinfo is None:
        raise ValueError("use data com fuso (UTC)")
    return agora


class BloqueioLogin:
    """Contagem de tentativas de login por (conta, IP), com transação própria em ``engine``."""

    def __init__(self, engine: Engine, segredo: str | bytes, regra: RegraBloqueio | None = None):
        if engine.dialect.name != "postgresql":
            raise ValueError("o bloqueio de login do kit é só para PostgreSQL")
        segredo = segredo.encode() if isinstance(segredo, str) else segredo
        if len(segredo) < 16:
            raise ValueError("segredo curto demais para o HMAC (mínimo 16 bytes)")
        self.engine = engine
        self._segredo = segredo
        self.regra = regra or RegraBloqueio()

    def chave_conta(self, email: str) -> str:
        normalizado = email.strip().lower().encode()
        return hmac.new(self._segredo, normalizado, hashlib.sha256).hexdigest()

    def reservar(self, email: str, ip: str, agora: datetime | None = None) -> bool:
        """Conta a tentativa antes da senha. ``False``: não confira a senha (par/conta no teto)."""
        agora = _agora(agora)
        regra = self.regra
        t = TABELA.c
        conta = self.chave_conta(email)
        ativo = t.bloqueado_ate > agora
        recomeca = (t.bloqueado_ate.is_not(None)) | (t.janela_inicio <= agora - regra.janela)
        comando = (
            insert(TABELA)
            .values(
                conta=conta,
                ip=ip,
                tentativas=1,
                janela_inicio=agora,
                bloqueado_ate=None,
                atualizado_em=agora,
            )
            .on_conflict_do_update(
                index_elements=[t.conta, t.ip],
                set_={
                    "tentativas": case(
                        (ativo, t.tentativas), (recomeca, 1), else_=t.tentativas + 1
                    ),
                    "janela_inicio": case(
                        (ativo, t.janela_inicio), (recomeca, agora), else_=t.janela_inicio
                    ),
                    "bloqueado_ate": case(
                        (ativo, t.bloqueado_ate),
                        (recomeca, literal(None, DateTime(timezone=True))),
                        (t.tentativas + 1 > regra.max_tentativas, agora + regra.bloqueio),
                        else_=literal(None, DateTime(timezone=True)),
                    ),
                    "atualizado_em": agora,
                },
            )
            .returning(t.bloqueado_ate)
        )
        with self.engine.begin() as conn:
            if conn.execute(comando).scalar_one() is not None:
                return False
            if regra.teto_conta is None:
                return True
            soma = conn.execute(
                select(func.coalesce(func.sum(t.tentativas), 0)).where(
                    t.conta == conta, t.janela_inicio > agora - regra.janela
                )
            ).scalar_one()
            return soma <= regra.teto_conta

    def sucesso(self, email: str, ip: str) -> None:
        """Login certo: zera o par."""
        t = TABELA.c
        with self.engine.begin() as conn:
            conn.execute(delete(TABELA).where(t.conta == self.chave_conta(email), t.ip == ip))

    def liberar_conta(self, email: str) -> None:
        """Senha trocada ou redefinida pelo link: a conta volta a entrar de qualquer IP."""
        with self.engine.begin() as conn:
            conn.execute(delete(TABELA).where(TABELA.c.conta == self.chave_conta(email)))

    def expurgar(self, agora: datetime | None = None) -> int:
        """Apaga o que passou da janela e não tem bloqueio vigente. Devolve quantas linhas."""
        agora = _agora(agora)
        t = TABELA.c
        limite = agora - max(self.regra.janela, self.regra.bloqueio)
        with self.engine.begin() as conn:
            resultado = conn.execute(
                delete(TABELA).where(
                    t.atualizado_em < limite,
                    (t.bloqueado_ate.is_(None)) | (t.bloqueado_ate <= agora),
                )
            )
            return resultado.rowcount

    def conferir_login(
        self,
        email: str,
        ip: str,
        senha: str,
        buscar_hash: Callable[[str], str | None],
        verificar: Callable[[str, str], bool],
        hash_falso: str,
        agora: datetime | None = None,
    ) -> bool:
        """Fluxo completo de login sem revelar nada. ``True`` só com senha certa de conta ativa.

        - ``buscar_hash(email)``: o hash da conta ativa, ou ``None`` (sem conta ou inativa).
        - ``verificar(senha, hash)``: a função do app (Argon2/scrypt).
        - ``hash_falso``: um hash válido do mesmo algoritmo, para gastar o mesmo tempo.

        Quando devolver ``False``, o app responde 401 com ``MENSAGEM_LOGIN``, sempre.
        """
        if not self.reservar(email, ip, agora):
            verificar(senha, hash_falso)
            return False
        guardado = buscar_hash(email)
        if guardado is None:
            verificar(senha, hash_falso)
            return False
        if not verificar(senha, guardado):
            return False
        self.sucesso(email, ip)
        return True
