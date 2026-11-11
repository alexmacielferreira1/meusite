import sqlalchemy as sa
from alembic import op

revision = "foliocom_0007"
down_revision = "foliocom_0006"
branch_labels = None
depends_on = None


def upgrade():
    # Provedores de IA cadastrados pela administração. A chave da API fica cifrada (Fernet, AI_KEYS_SECRET).
    op.create_table(
        "ai_providers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("provider", sa.String(20), nullable=False, server_default="anthropic"),
        sa.Column("model", sa.String(120), nullable=False),
        sa.Column("api_key", sa.Text(), nullable=False),
        sa.Column("key_hint", sa.String(8), nullable=False),
        sa.Column("features", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("updated_at", sa.Integer(), nullable=False),
    )


def downgrade():
    op.drop_table("ai_providers")
