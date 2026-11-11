from alembic import op

revision = "meusite_0011"
down_revision = "foliocom_0010"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE TABLE product_identity(id INTEGER PRIMARY KEY, name VARCHAR(40) NOT NULL)")
    op.execute("INSERT INTO product_identity(id,name) VALUES(1, 'meusite')")
    op.execute("""CREATE TABLE business_requests (
        id VARCHAR(32) PRIMARY KEY,
        account_id VARCHAR(36) NOT NULL REFERENCES accounts(id),
        kind VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL,
        created_at BIGINT NOT NULL, total_cents BIGINT NOT NULL,
        payload TEXT NOT NULL, client_token VARCHAR(80) NOT NULL,
        payload_hash CHAR(64) NOT NULL,
        UNIQUE(account_id,client_token)
    )""")
    op.execute("CREATE INDEX business_requests_owner ON business_requests(account_id,created_at)")


def downgrade():
    op.execute("DROP TABLE business_requests")
    op.execute("DROP TABLE product_identity")
