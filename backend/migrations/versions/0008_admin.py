import sqlalchemy as sa
from alembic import op

revision = "foliocom_0008"
down_revision = "foliocom_0007"
branch_labels = None
depends_on = None


def upgrade():
    # Administração do sistema dentro do app (decisão do Alex, 06/11/2026). Contas antigas ficam sem data de cadastro.
    # add_column direto (sem batch): no SQLite o batch recria a tabela e perderia o UNIQUE do e-mail.
    for column in (
        sa.Column("created_at", sa.BigInteger(), nullable=True),
        sa.Column("last_seen_at", sa.BigInteger(), nullable=True),
        sa.Column("disabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("tester", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("plan", sa.String(20), nullable=False, server_default="gratuito"),
        sa.Column("plan_until", sa.BigInteger(), nullable=True),
        sa.Column("admin_note", sa.Text(), nullable=True),
    ):
        op.add_column("accounts", column)
    # Administradores adicionados pela tela. Os de ADMIN_EMAILS valem sempre e não ficam aqui.
    op.create_table(
        "admins",
        sa.Column("email", sa.String(254), primary_key=True),
        sa.Column("added_by", sa.String(254), nullable=False),
        sa.Column("added_at", sa.BigInteger(), nullable=False),
    )
    # Pagamentos registrados à mão (ainda não há meio de pagamento integrado).
    op.create_table(
        "payments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("account_id", sa.String(36), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("method", sa.String(20), nullable=False),
        sa.Column("paid_at", sa.BigInteger(), nullable=False),
        sa.Column("note", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_by", sa.String(254), nullable=False),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
    )
    op.create_index("payments_paid", "payments", ["paid_at"])
    # Erros do servidor e do navegador, agrupados pela mesma assinatura.
    op.create_table(
        "error_log",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("fingerprint", sa.String(64), nullable=False, unique=True),
        sa.Column("source", sa.String(10), nullable=False),
        sa.Column("path", sa.String(300), nullable=False, server_default=""),
        sa.Column("message", sa.String(500), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("account_id", sa.String(36), nullable=True),
        sa.Column("hits", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("first_at", sa.BigInteger(), nullable=False),
        sa.Column("last_at", sa.BigInteger(), nullable=False),
        sa.Column("resolved", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("error_log_last", "error_log", ["last_at"])


def downgrade():
    op.drop_table("error_log")
    op.drop_table("payments")
    op.drop_table("admins")
    for column in (
        "admin_note",
        "plan_until",
        "plan",
        "tester",
        "disabled",
        "last_seen_at",
        "created_at",
    ):
        op.drop_column("accounts", column)
