from alembic import op

revision = "foliocom_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""CREATE TABLE accounts (
        id VARCHAR(36) PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(254) UNIQUE NOT NULL,
        password_hash VARCHAR(150) NOT NULL, ai_credits INTEGER NOT NULL DEFAULT 10
    )""")
    op.execute("""CREATE TABLE sessions (
        token_hash CHAR(64) PRIMARY KEY, account_id VARCHAR(36) NOT NULL REFERENCES accounts(id),
        expires_at BIGINT NOT NULL
    )""")
    op.execute("CREATE INDEX sessions_expiration ON sessions(expires_at)")
    op.execute("""CREATE TABLE sites (
        account_id VARCHAR(36) PRIMARY KEY REFERENCES accounts(id), draft TEXT NOT NULL,
        revision INTEGER NOT NULL DEFAULT 1, slug VARCHAR(64) UNIQUE, published TEXT
    )""")
    op.execute("""CREATE TABLE opportunities (
        slug VARCHAR(48) PRIMARY KEY, account_id VARCHAR(36) NOT NULL REFERENCES accounts(id),
        title VARCHAR(120) NOT NULL, expires_at BIGINT NOT NULL, revoked INTEGER NOT NULL DEFAULT 0,
        visits INTEGER NOT NULL DEFAULT 0, snapshot TEXT NOT NULL
    )""")
    op.execute("CREATE INDEX opportunities_owner ON opportunities(account_id)")
    op.execute("""CREATE TABLE rate_limits (
        bucket VARCHAR(100) PRIMARY KEY, hits INTEGER NOT NULL, expires_at BIGINT NOT NULL
    )""")


def downgrade():
    for table in ("rate_limits", "opportunities", "sites", "sessions", "accounts"):
        op.drop_table(table)
