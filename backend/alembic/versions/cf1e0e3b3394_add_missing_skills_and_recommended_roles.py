"""add missing skills and recommended roles

Revision ID: cf1e0e3b3394
Revises: 595fa27828ea
Create Date: 2026-07-30 13:09:26.746267

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "cf1e0e3b3394"
down_revision: Union[str, Sequence[str], None] = "595fa27828ea"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {c["name"] for c in inspector.get_columns("resumes")}
    for name, column in [
        ("missing_skills", sa.Column("missing_skills", sa.Text(), nullable=True)),
        ("recommended_roles", sa.Column("recommended_roles", sa.Text(), nullable=True)),
    ]:
        if name not in columns:
            op.add_column("resumes", column)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {c["name"] for c in inspector.get_columns("resumes")}
    for name in ("recommended_roles", "missing_skills"):
        if name in columns:
            op.drop_column("resumes", name)
