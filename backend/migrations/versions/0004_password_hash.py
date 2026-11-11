import sqlalchemy as sa
from alembic import op

revision = "foliocom_0004"
down_revision = "foliocom_0003"
branch_labels = None
depends_on = None


def upgrade():
    # SQLite does not enforce VARCHAR length.
    if op.get_context().dialect.name == "postgresql":
        op.alter_column("accounts", "password_hash", type_=sa.Text())


def downgrade():
    if op.get_context().dialect.name == "postgresql":
        op.execute("""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM accounts WHERE length(password_hash) > 150) THEN
                    RAISE EXCEPTION 'Cannot narrow password_hash without losing credentials';
                END IF;
            END;
            $$
        """)
        op.alter_column("accounts", "password_hash", type_=sa.String(150))
