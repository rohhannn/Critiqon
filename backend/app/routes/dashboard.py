from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user

from ..models import (
    Resume,
    User,
    InterviewSession,
    InterviewAnswer,
)

from ..schemas_dashboard import DashboardResponse


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/",
    response_model=DashboardResponse,
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # =========================================================
    # RESUMES
    # =========================================================

    resumes = (
        db.query(Resume)
        .filter(
            Resume.user_id == current_user.id
        )
        .order_by(
            Resume.uploaded_at.asc()
        )
        .all()
    )


    total_resumes = len(resumes)


    latest_resume = (
        resumes[-1]
        if resumes
        else None
    )


    latest_ats = (
        latest_resume.ats_score
        if latest_resume
        and latest_resume.ats_score is not None
        else 0
    )


    # =========================================================
    # AVERAGE ATS
    # =========================================================

    average_ats = (
        db.query(
            func.avg(
                Resume.ats_score
            )
        )
        .filter(
            Resume.user_id == current_user.id,
            Resume.ats_score.isnot(None),
        )
        .scalar()
    )


    if average_ats is None:
        average_ats = 0


    # =========================================================
    # SKILLS
    # =========================================================

    skills_found = 0


    if (
        latest_resume
        and latest_resume.skills
    ):

        skills_found = len(
            [
                skill
                for skill in latest_resume.skills.split("\n")
                if skill.strip()
            ]
        )


    # =========================================================
    # RECENT RESUME
    # =========================================================

    recent_resume = None


    if latest_resume:

        recent_resume = {
            "id": latest_resume.id,

            "filename": latest_resume.filename,

            "uploaded_at": latest_resume.uploaded_at,

            "ats_score": (
                latest_resume.ats_score
                if latest_resume.ats_score is not None
                else 0
            ),
        }


    # =========================================================
    # ATS HISTORY
    # =========================================================

    chart_resumes = resumes[-10:]


    ats_history = []


    for resume in chart_resumes:

        ats_history.append(
            {
                "label": (
                    resume.uploaded_at.strftime(
                        "%d %b"
                    )
                ),

                "score": (
                    resume.ats_score
                    if resume.ats_score is not None
                    else 0
                ),
            }
        )


    # =========================================================
    # INTERVIEW SESSIONS
    # =========================================================

    interview_sessions = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.user_id
            == current_user.id
        )
        .order_by(
            InterviewSession.created_at.asc()
        )
        .all()
    )


    total_interviews = len(
        interview_sessions
    )


    # =========================================================
    # INTERVIEW ANSWERS
    # =========================================================

    interview_answers = (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.user_id
            == current_user.id
        )
        .order_by(
            InterviewAnswer.created_at.asc()
        )
        .all()
    )


    total_questions_answered = len(
        interview_answers
    )


    # =========================================================
    # COMPLETED INTERVIEWS
    # =========================================================

    completed_interviews = 0


    for session in interview_sessions:

        answer_count = (
            db.query(
                func.count(
                    InterviewAnswer.id
                )
            )
            .filter(
                InterviewAnswer.session_id
                == session.id,
                InterviewAnswer.user_id
                == current_user.id,
            )
            .scalar()
        )


        if (
            answer_count is not None
            and answer_count >= session.question_count
        ):

            completed_interviews += 1


    # =========================================================
    # AVERAGE INTERVIEW SCORE
    # =========================================================

    average_interview_score = (
        db.query(
            func.avg(
                InterviewAnswer.score
            )
        )
        .filter(
            InterviewAnswer.user_id
            == current_user.id,

            InterviewAnswer.score.isnot(None),
        )
        .scalar()
    )


    if average_interview_score is None:
        average_interview_score = 0


    # =========================================================
    # LATEST INTERVIEW SCORE
    # =========================================================

    latest_answer = (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.user_id
            == current_user.id,

            InterviewAnswer.score.isnot(None),
        )
        .order_by(
            InterviewAnswer.created_at.desc(),
            InterviewAnswer.id.desc(),
        )
        .first()
    )


    latest_interview_score = (
        latest_answer.score
        if latest_answer
        and latest_answer.score is not None
        else 0
    )


    # =========================================================
    # FINAL RESPONSE
    # =========================================================

    return {

        # -----------------------------------------------------
        # USER
        # -----------------------------------------------------

        "user": (
            current_user.full_name
            or "User"
        ),


        # -----------------------------------------------------
        # RESUME / ATS
        # -----------------------------------------------------

        "total_resumes": total_resumes,

        "latest_ats_score": latest_ats,

        "average_ats_score": round(
            float(
                average_ats
            ),
            1,
        ),

        "skills_found": skills_found,

        "recent_resume": recent_resume,

        "ats_history": ats_history,


        # -----------------------------------------------------
        # INTERVIEW
        # -----------------------------------------------------

        "total_interviews": (
            total_interviews
        ),

        "completed_interviews": (
            completed_interviews
        ),

        "total_questions_answered": (
            total_questions_answered
        ),

        "average_interview_score": round(
            float(
                average_interview_score
            )
        ),

        "latest_interview_score": (
            latest_interview_score
        ),
    }