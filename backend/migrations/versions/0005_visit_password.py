import sqlalchemy as sa
from alembic import op

revision = "foliocom_0005"
down_revision = "foliocom_0004"
branch_labels = None
depends_on = None


def upgrade():
    # Senha opcional de visita do site publicado (sal:hash scrypt). Fica fora do snapshot público.
    op.add_column("sites", sa.Column("visit_password", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("sites", "visit_password")
