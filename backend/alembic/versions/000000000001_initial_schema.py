"""Create the complete Critiqon schema.

This baseline makes the migration chain usable on a brand-new database while
remaining safe to run against databases that were previously initialized with
SQLAlchemy create_all().
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "000000000001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(name: str) -> bool:
    return inspect(op.get_bind()).has_table(name)


def upgrade() -> None:
    if not _has_table("users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("full_name", sa.String(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("hashed_password", sa.String(), nullable=False),
        )
        op.create_index("ix_users_id", "users", ["id"], unique=False)
        op.create_index("ix_users_email", "users", ["email"], unique=True)

    if not _has_table("resumes"):
        op.create_table(
            "resumes",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("filename", sa.String(), nullable=False),
            sa.Column("filepath", sa.String(), nullable=False),
            sa.Column("storage_provider", sa.String(), nullable=False, server_default="local"),
            sa.Column("storage_key", sa.String(), nullable=True),
            sa.Column("storage_version", sa.String(), nullable=True),
            sa.Column("extracted_text", sa.Text(), nullable=False),
            sa.Column("uploaded_at", sa.DateTime(), nullable=True),
            sa.Column("ats_score", sa.Integer(), nullable=True),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column("strengths", sa.Text(), nullable=True),
            sa.Column("weaknesses", sa.Text(), nullable=True),
            sa.Column("skills", sa.Text(), nullable=True),
            sa.Column("missing_skills", sa.Text(), nullable=True),
            sa.Column("suggestions", sa.Text(), nullable=True),
            sa.Column("recommended_roles", sa.Text(), nullable=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        )
        op.create_index("ix_resumes_id", "resumes", ["id"], unique=False)

    if not _has_table("job_matches"):
        op.create_table(
            "job_matches",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resumes.id"), nullable=False),
            sa.Column("job_description", sa.Text(), nullable=False),
            sa.Column("match_score", sa.Integer(), nullable=True),
            sa.Column("recommendation", sa.Text(), nullable=True),
            sa.Column("matched_skills", sa.Text(), nullable=True),
            sa.Column("missing_skills", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_job_matches_id", "job_matches", ["id"], unique=False)

    if not _has_table("interview_sessions"):
        op.create_table(
            "interview_sessions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resumes.id"), nullable=False),
            sa.Column("job_description", sa.Text(), nullable=True),
            sa.Column("difficulty", sa.String(), nullable=False),
            sa.Column("question_count", sa.Integer(), nullable=False),
            sa.Column("questions", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_interview_sessions_id", "interview_sessions", ["id"], unique=False)

    if not _has_table("interview_answers"):
        op.create_table(
            "interview_answers",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resumes.id"), nullable=False),
            sa.Column("session_id", sa.Integer(), sa.ForeignKey("interview_sessions.id"), nullable=False),
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
        )
        op.create_index("ix_interview_answers_id", "interview_answers", ["id"], unique=False)

    if not _has_table("subscriptions"):
        op.create_table(
            "subscriptions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("plan", sa.String(), nullable=False, server_default="Free"),
            sa.Column("status", sa.String(), nullable=False, server_default="active"),
            sa.Column("razorpay_order_id", sa.String(), nullable=True),
            sa.Column("razorpay_payment_id", sa.String(), nullable=True),
            sa.Column("razorpay_signature", sa.String(), nullable=True),
            sa.Column("started_at", sa.DateTime(), nullable=True),
            sa.Column("expires_at", sa.DateTime(), nullable=True),
            sa.UniqueConstraint("user_id", name="uq_subscriptions_user_id"),
        )
        op.create_index("ix_subscriptions_id", "subscriptions", ["id"], unique=False)


def downgrade() -> None:
    # Only remove tables when this migration is explicitly downgraded. Later
    # migrations are additive and are intentionally kept independent.
    for table in (
        "subscriptions",
        "interview_answers",
        "interview_sessions",
        "job_matches",
        "resumes",
        "users",
    ):
        if _has_table(table):
            op.drop_table(table)
