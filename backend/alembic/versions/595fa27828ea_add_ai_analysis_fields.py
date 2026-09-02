"""add ai analysis fields

Revision ID: 595fa27828ea
Revises: fdefd3644206
Create Date: 2026-07-30 13:05:13.220343
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "595fa27828ea"
down_revision: Union[str, Sequence[str], None] = "fdefd3644206"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {c["name"] for c in inspector.get_columns("resumes")}
    for name, column in [
        ("ats_score", sa.Column("ats_score", sa.Integer(), nullable=True)),
        ("summary", sa.Column("summary", sa.Text(), nullable=True)),
        ("strengths", sa.Column("strengths", sa.Text(), nullable=True)),
        ("weaknesses", sa.Column("weaknesses", sa.Text(), nullable=True)),
        ("suggestions", sa.Column("suggestions", sa.Text(), nullable=True)),
        ("skills", sa.Column("skills", sa.Text(), nullable=True)),
    ]:
        if name not in columns:
            op.add_column("resumes", column)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {c["name"] for c in inspector.get_columns("resumes")}
    for name in ("skills", "suggestions", "weaknesses", "strengths", "summary", "ats_score"):
        if name in columns:
            op.drop_column("resumes", name)
