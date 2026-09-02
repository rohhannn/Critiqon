"""Add interview answers.

The baseline migration already includes this table; this revision remains
compatible with older databases that predate interview answer storage.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "6ac0662e4244"
down_revision: Union[str, Sequence[str], None] = "cf1e0e3b3394"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("interview_answers"):
        op.create_table(
            "interview_answers",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("resume_id", sa.Integer(), nullable=False),
            sa.Column("session_id", sa.Integer(), nullable=False),
            sa.Column("question", sa.Text(), nullable=False),
            sa.Column("answer", sa.Text(), nullable=False),
            sa.Column("score", sa.Integer(), nullable=True),
            sa.Column("technical_score", sa.Integer(), nullable=True),
            sa.Column("communication_score", sa.Integer(), nullable=True),
            sa.Column("relevance_score", sa.Integer(), nullable=True),
            sa.Column("feedback", sa.Text(), nullable=True),
            sa.Column("strengths", sa.Text(), nullable=True),
            sa.Column("improvements", sa.Text(), nullable=True),
            sa.Column("missing_points", sa.Text(), nullable=True),
            sa.Column("improved_answer", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"]),
            sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_interview_answers_id", "interview_answers", ["id"], unique=False)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("interview_answers"):
        op.drop_table("interview_answers")
