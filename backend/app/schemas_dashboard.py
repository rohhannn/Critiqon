from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# =========================================================
# RECENT RESUME
# =========================================================

class RecentResume(BaseModel):
    id: int
    filename: str
    ats_score: float
    uploaded_at: datetime


# =========================================================
# ATS HISTORY
# =========================================================

class ATSHistoryItem(BaseModel):
    label: str
    score: float


# =========================================================
# DASHBOARD RESPONSE
# =========================================================

class DashboardResponse(BaseModel):

    # -----------------------------------------------------
    # USER
    # -----------------------------------------------------

    user: str

    # -----------------------------------------------------
    # RESUME / ATS
    # -----------------------------------------------------

    total_resumes: int

    latest_ats_score: float

    average_ats_score: float

    skills_found: int

    recent_resume: Optional[RecentResume] = None

    ats_history: List[ATSHistoryItem] = Field(
        default_factory=list
    )

    # -----------------------------------------------------
    # INTERVIEW
    # -----------------------------------------------------

    total_interviews: int

    completed_interviews: int

    total_questions_answered: int

    average_interview_score: float

    latest_interview_score: float