"""Origem do cadastro (etiquetas UTM do anúncio, grupo ou parceiro que trouxe a conta).

Só as quatro etiquetas do link (sem IP, navegador ou cookie de terceiros), para medir a
divulgação. Colunas opcionais: contas antigas e cadastros diretos ficam vazias.

Revision ID: foliocom_0010
Revises: foliocom_0009
"""

import sqlalchemy as sa
from alembic import op

revision = "foliocom_0010"
down_revision = "foliocom_0009"
branch_labels = None
depends_on = None

COLUMNS = ("origin_source", "origin_medium", "origin_campaign", "origin_content")


def upgrade() -> None:
    for name in COLUMNS:
        op.add_column("accounts", sa.Column(name, sa.String(60), nullable=True))


def downgrade() -> None:
    for name in reversed(COLUMNS):
        op.drop_column("accounts", name)
