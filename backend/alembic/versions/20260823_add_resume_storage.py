"""Add durable resume storage metadata.

Revision ID: 20260823_storage
Revises: fde1cad00b52
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260823_storage"
down_revision: Union[str, Sequence[str], None] = "fde1cad00b52"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {c["name"] for c in inspector.get_columns("resumes")}

    if "storage_provider" not in columns:
        op.add_column(
            "resumes",
            sa.Column(
                "storage_provider",
                sa.String(),
                nullable=False,
                server_default="local",
            ),
        )

    if "storage_key" not in columns:
        op.add_column(
            "resumes",
            sa.Column("storage_key", sa.String(), nullable=True),
        )

    if "storage_version" not in columns:
        op.add_column(
            "resumes",
            sa.Column("storage_version", sa.String(), nullable=True),
        )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {c["name"] for c in inspector.get_columns("resumes")}
    for name in ("storage_version", "storage_key", "storage_provider"):
        if name in columns:
            op.drop_column("resumes", name)
