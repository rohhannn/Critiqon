"""Add extracted resume text.

The baseline migration already includes this column; this revision is kept
for compatibility with the historical migration chain and safely upgrades old
schemas that do not have it.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "fdefd3644206"
down_revision: Union[str, Sequence[str], None] = "000000000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {c["name"] for c in inspector.get_columns("resumes")}
    if "extracted_text" not in columns:
        op.add_column(
            "resumes",
            sa.Column("extracted_text", sa.Text(), nullable=True),
        )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {c["name"] for c in inspector.get_columns("resumes")}
    if "extracted_text" in columns:
        op.drop_column("resumes", "extracted_text")
