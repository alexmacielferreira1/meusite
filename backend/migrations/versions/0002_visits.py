from alembic import op

revision = "foliocom_0002"
down_revision = "foliocom_0001"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""CREATE TABLE site_events (
        account_id VARCHAR(36) NOT NULL REFERENCES accounts(id), day CHAR(10) NOT NULL,
        kind VARCHAR(10) NOT NULL, item VARCHAR(120) NOT NULL DEFAULT '', hits INTEGER NOT NULL,
        PRIMARY KEY (account_id, day, kind, item)
    )""")


def downgrade():
    op.drop_table("site_events")
