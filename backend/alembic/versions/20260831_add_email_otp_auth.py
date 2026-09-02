"""Add secure passwordless email OTP authentication fields."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260831_email_otp"
down_revision: Union[str, Sequence[str], None] = "20260823_storage"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("email_otps"):
        op.create_table(
            "email_otps",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("code_hash", sa.String(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("last_sent_at", sa.DateTime(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_email_otps_id", "email_otps", ["id"], unique=False)
        op.create_index("ix_email_otps_email", "email_otps", ["email"], unique=True)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("email_otps"):
        op.drop_table("email_otps")
