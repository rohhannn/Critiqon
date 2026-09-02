from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


# =========================================================
# USER
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    full_name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password = Column(
        String,
        nullable=False,
    )


    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    resumes = relationship(
        "Resume",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    job_matches = relationship(
        "JobMatch",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    interview_sessions = relationship(
        "InterviewSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    interview_answers = relationship(
        "InterviewAnswer",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    subscription = relationship(
        "Subscription",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


# =========================================================
# PASSWORDLESS EMAIL OTP
# =========================================================

class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    last_sent_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# =========================================================
# RESUME
# =========================================================

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    filename = Column(
        String,
        nullable=False,
    )

    filepath = Column(
        String,
        nullable=False,
    )

    # Storage metadata. Existing local resumes remain supported; new
    # production uploads use Cloudinary when it is configured.
    storage_provider = Column(
        String,
        nullable=False,
        default="local",
    )

    storage_key = Column(
        String,
        nullable=True,
    )

    storage_version = Column(
        String,
        nullable=True,
    )

    extracted_text = Column(
        Text,
        nullable=False,
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # =====================================================
    # AI ANALYSIS
    # =====================================================

    ats_score = Column(
        Integer,
        nullable=True,
    )

    summary = Column(
        Text,
        nullable=True,
    )

    strengths = Column(
        Text,
        nullable=True,
    )

    weaknesses = Column(
        Text,
        nullable=True,
    )

    skills = Column(
        Text,
        nullable=True,
    )

    missing_skills = Column(
        Text,
        nullable=True,
    )

    suggestions = Column(
        Text,
        nullable=True,
    )

    recommended_roles = Column(
        Text,
        nullable=True,
    )

    # =====================================================
    # OWNERSHIP
    # =====================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    user = relationship(
        "User",
        back_populates="resumes",
    )

    job_matches = relationship(
        "JobMatch",
        back_populates="resume",
        cascade="all, delete-orphan",
    )

    interview_sessions = relationship(
        "InterviewSession",
        back_populates="resume",
        cascade="all, delete-orphan",
    )

    interview_answers = relationship(
        "InterviewAnswer",
        back_populates="resume",
        cascade="all, delete-orphan",
    )


# =========================================================
# JOB MATCH HISTORY
# =========================================================

class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    resume_id = Column(
        Integer,
        ForeignKey("resumes.id"),
        nullable=False,
    )

    job_description = Column(
        Text,
        nullable=False,
    )

    match_score = Column(
        Integer,
        nullable=True,
    )

    recommendation = Column(
        Text,
        nullable=True,
    )

    matched_skills = Column(
        Text,
        nullable=True,
    )

    missing_skills = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    user = relationship(
        "User",
        back_populates="job_matches",
    )

    resume = relationship(
        "Resume",
        back_populates="job_matches",
    )


# =========================================================
# INTERVIEW PREP SESSION
# =========================================================

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    resume_id = Column(
        Integer,
        ForeignKey("resumes.id"),
        nullable=False,
    )

    job_description = Column(
        Text,
        nullable=True,
    )

    difficulty = Column(
        String,
        nullable=False,
    )

    question_count = Column(
        Integer,
        nullable=False,
    )

    questions = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    user = relationship(
        "User",
        back_populates="interview_sessions",
    )

    resume = relationship(
        "Resume",
        back_populates="interview_sessions",
    )

    answers = relationship(
        "InterviewAnswer",
        back_populates="session",
        cascade="all, delete-orphan",
    )


# =========================================================
# INTERVIEW ANSWER / EVALUATION
# =========================================================

class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # =====================================================
    # OWNERSHIP / RELATIONSHIPS
    # =====================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    resume_id = Column(
        Integer,
        ForeignKey("resumes.id"),
        nullable=False,
    )

    session_id = Column(
        Integer,
        ForeignKey("interview_sessions.id"),
        nullable=False,
    )

    # =====================================================
    # INTERVIEW CONTENT
    # =====================================================

    question = Column(
        Text,
        nullable=False,
    )

    answer = Column(
        Text,
        nullable=False,
    )

    # =====================================================
    # OVERALL SCORE
    # =====================================================

    score = Column(
        Integer,
        nullable=True,
    )

    # =====================================================
    # DETAILED SCORES
    # =====================================================

    technical_score = Column(
        Integer,
        nullable=True,
    )

    communication_score = Column(
        Integer,
        nullable=True,
    )

    relevance_score = Column(
        Integer,
        nullable=True,
    )

    # =====================================================
    # AI FEEDBACK
    # =====================================================

    feedback = Column(
        Text,
        nullable=True,
    )

    strengths = Column(
        Text,
        nullable=True,
    )

    improvements = Column(
        Text,
        nullable=True,
    )

    missing_points = Column(
        Text,
        nullable=True,
    )

    improved_answer = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    user = relationship(
        "User",
        back_populates="interview_answers",
    )

    resume = relationship(
        "Resume",
        back_populates="interview_answers",
    )

    session = relationship(
        "InterviewSession",
        back_populates="answers",
    )


# =========================================================
# SUBSCRIPTION
# =========================================================

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
    )

    # =====================================================
    # PLAN
    # =====================================================

    plan = Column(
        String,
        nullable=False,
        default="Free",
    )

    # =====================================================
    # SUBSCRIPTION STATUS
    # =====================================================

    status = Column(
        String,
        nullable=False,
        default="active",
    )

    # =====================================================
    # RAZORPAY
    # =====================================================

    razorpay_order_id = Column(
        String,
        nullable=True,
    )

    razorpay_payment_id = Column(
        String,
        nullable=True,
    )

    razorpay_signature = Column(
        String,
        nullable=True,
    )

    # =====================================================
    # SUBSCRIPTION DATES
    # =====================================================

    started_at = Column(
        DateTime,
        nullable=True,
    )

    expires_at = Column(
        DateTime,
        nullable=True,
    )

    # =====================================================
    # RELATIONSHIP
    # =====================================================

    user = relationship(
        "User",
        back_populates="subscription",
    )