from alembic import op

revision = "meusite_0012"
down_revision = "meusite_0011"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE sessions ADD COLUMN csrf_hash CHAR(64)")


def downgrade():
    op.execute("ALTER TABLE sessions DROP COLUMN csrf_hash")
