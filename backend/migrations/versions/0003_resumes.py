from alembic import op

revision = "foliocom_0003"
down_revision = "foliocom_0002"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""CREATE TABLE resumes (
        id VARCHAR(36) PRIMARY KEY, account_id VARCHAR(36) NOT NULL REFERENCES accounts(id),
        updated_at BIGINT NOT NULL, document TEXT NOT NULL
    )""")
    op.create_index("resumes_owner_updated", "resumes", ["account_id", "updated_at"])


def downgrade():
    op.drop_table("resumes")
