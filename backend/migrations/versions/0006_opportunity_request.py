import sqlalchemy as sa
from alembic import op

revision = "foliocom_0006"
down_revision = "foliocom_0005"
branch_labels = None
depends_on = None


def upgrade():
    # Dados privados usados para editar e duplicar o hotsite (título, briefing, origem, trabalhos, prazo).
    op.add_column("opportunities", sa.Column("request", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("opportunities", "request")
