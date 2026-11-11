"""Kit _kit_web 0.2.0: tabela do bloqueio de login por conta + IP (LGPD art. 46).

Copie para ``alembic/versions/`` do app, troque ``revision`` pelo próximo número do app e
``down_revision`` pela cabeça atual (``alembic heads``). Só PostgreSQL.

Revision ID: foliocom_0009
Revises: foliocom_0008
"""

import sqlalchemy as sa
from alembic import op

revision = "foliocom_0009"
down_revision = "foliocom_0008"
branch_labels = None
depends_on = None

TABELA = "kit_login_falhas"


def upgrade() -> None:
    op.create_table(
        TABELA,
        sa.Column("conta", sa.String(64), primary_key=True),
        sa.Column("ip", sa.String(45), primary_key=True),
        sa.Column("tentativas", sa.Integer, nullable=False),
        sa.Column("janela_inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bloqueado_ate", sa.DateTime(timezone=True)),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(f"ix_{TABELA}_atualizado_em", TABELA, ["atualizado_em"])


def downgrade() -> None:
    op.drop_index(f"ix_{TABELA}_atualizado_em", table_name=TABELA)
    op.drop_table(TABELA)
