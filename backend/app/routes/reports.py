from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user

from ..models import (
    Resume,
    JobMatch,
    InterviewSession,
    InterviewAnswer,
    User,
)

from ..services.subscription_service import (
    require_plan,
)


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# =========================================================
# HELPERS
# =========================================================

def parse_list(value):
    """
    Convert newline-separated database text
    into a clean list.
    """

    if not value:
        return []

    return [
        item.strip()
        for item in value.split("\n")
        if item.strip()
    ]


def safe_average(values):
    """
    Calculate an average safely.
    """

    valid_values = [
        value
        for value in values
        if value is not None
    ]

    if not valid_values:
        return 0

    return round(
        sum(valid_values) / len(valid_values),
        1,
    )


# =========================================================
# GET COMPLETE RESUME REPORT
#
# PREMIUM FEATURE
# =========================================================

@router.get("/{resume_id}")
def get_resume_report(

    resume_id: int,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user),

):

    # =====================================================
    # PREMIUM ACCESS CONTROL
    # =====================================================
    #
    # Reports are a Premium feature.
    #
    # IMPORTANT:
    # The frontend can show the Reports option to everyone,
    # but the backend remains the final authority.
    #
    # Free  -> 403
    # Pro   -> 403
    # Premium -> continue
    #
    # =====================================================

    require_plan(

        db=db,

        user=current_user,

        required_plan="Premium",

        feature_name="Career Reports",

    )


    # =====================================================
    # FIND RESUME
    # =====================================================

    resume = (
        db.query(
            Resume
        )
        .filter(

            Resume.id ==
            resume_id,

            Resume.user_id ==
            current_user.id,

        )
        .first()
    )


    if resume is None:

        raise HTTPException(

            status_code=404,

            detail="Resume not found.",

        )


    # =====================================================
    # JOB MATCH HISTORY
    # =====================================================

    job_matches = (
        db.query(
            JobMatch
        )
        .filter(

            JobMatch.resume_id ==
            resume.id,

            JobMatch.user_id ==
            current_user.id,

        )
        .order_by(
            JobMatch.created_at.desc()
        )
        .all()
    )


    job_match_history = []


    for match in job_matches:

        job_match_history.append(

            {

                "id":
                    match.id,

                "match_score":
                    (
                        match.match_score
                        if match.match_score is not None
                        else 0
                    ),

                "recommendation":
                    (
                        match.recommendation
                        or ""
                    ),

                "matched_skills":
                    parse_list(
                        match.matched_skills
                    ),

                "missing_skills":
                    parse_list(
                        match.missing_skills
                    ),

                "created_at":
                    (
                        match.created_at.isoformat()
                        if match.created_at
                        else None
                    ),

                "job_description":
                    (
                        match.job_description
                        or ""
                    ),

            }

        )


    # =====================================================
    # JOB MATCH SUMMARY
    # =====================================================

    job_scores = [

        match.match_score

        for match in job_matches

        if match.match_score is not None

    ]


    average_job_match = safe_average(
        job_scores
    )


    best_job_match = (

        max(job_scores)

        if job_scores

        else 0

    )


    # =====================================================
    # INTERVIEW SESSIONS
    # =====================================================

    interview_sessions = (
        db.query(
            InterviewSession
        )
        .filter(

            InterviewSession.resume_id ==
            resume.id,

            InterviewSession.user_id ==
            current_user.id,

        )
        .order_by(
            InterviewSession.created_at.desc()
        )
        .all()
    )


    # =====================================================
    # INTERVIEW ANSWERS
    # =====================================================

    interview_answers = (
        db.query(
            InterviewAnswer
        )
        .filter(

            InterviewAnswer.resume_id ==
            resume.id,

            InterviewAnswer.user_id ==
            current_user.id,

        )
        .order_by(
            InterviewAnswer.created_at.asc()
        )
        .all()
    )


    # =====================================================
    # INTERVIEW SESSION REPORT
    # =====================================================

    interview_history = []


    for session in interview_sessions:

        session_answers = [

            answer

            for answer in interview_answers

            if answer.session_id ==
            session.id

        ]


        answer_scores = [

            answer.score

            for answer in session_answers

            if answer.score is not None

        ]


        technical_scores = [

            answer.technical_score

            for answer in session_answers

            if answer.technical_score is not None

        ]


        communication_scores = [

            answer.communication_score

            for answer in session_answers

            if answer.communication_score is not None

        ]


        relevance_scores = [

            answer.relevance_score

            for answer in session_answers

            if answer.relevance_score is not None

        ]


        # =================================================
        # COMPLETION
        # =================================================

        question_count = (
            session.question_count or 0
        )


        answered_count = len(
            session_answers
        )


        completion_percentage = (

            round(
                (
                    answered_count
                    / question_count
                ) * 100
            )

            if question_count

            else 0

        )


        # =================================================
        # SESSION REPORT
        # =================================================

        interview_history.append(

            {

                "id":
                    session.id,

                "difficulty":
                    (
                        session.difficulty
                        or ""
                    ),

                "question_count":
                    question_count,

                "answered_count":
                    answered_count,

                "completion_percentage":
                    completion_percentage,

                "average_score":
                    safe_average(
                        answer_scores
                    ),

                "average_technical_score":
                    safe_average(
                        technical_scores
                    ),

                "average_communication_score":
                    safe_average(
                        communication_scores
                    ),

                "average_relevance_score":
                    safe_average(
                        relevance_scores
                    ),

                "created_at":
                    (
                        session.created_at.isoformat()
                        if session.created_at
                        else None
                    ),

                "job_description":
                    (
                        session.job_description
                        or ""
                    ),

            }

        )


    # =====================================================
    # INTERVIEW SUMMARY
    # =====================================================

    total_interview_sessions = len(
        interview_sessions
    )


    total_interview_questions = sum(

        session.question_count or 0

        for session in interview_sessions

    )


    total_questions_answered = len(
        interview_answers
    )


    completed_interview_sessions = 0


    for session in interview_sessions:

        session_answer_count = len(

            [

                answer

                for answer in interview_answers

                if answer.session_id ==
                session.id

            ]

        )


        if (

            session.question_count

            and session_answer_count >=
            session.question_count

        ):

            completed_interview_sessions += 1


    # =====================================================
    # INTERVIEW SCORE SUMMARY
    # =====================================================

    interview_scores = [

        answer.score

        for answer in interview_answers

        if answer.score is not None

    ]


    technical_scores = [

        answer.technical_score

        for answer in interview_answers

        if answer.technical_score is not None

    ]


    communication_scores = [

        answer.communication_score

        for answer in interview_answers

        if answer.communication_score is not None

    ]


    relevance_scores = [

        answer.relevance_score

        for answer in interview_answers

        if answer.relevance_score is not None

    ]


    average_interview_score = safe_average(
        interview_scores
    )


    best_interview_score = (

        max(interview_scores)

        if interview_scores

        else 0

    )


    latest_interview_score = (

        interview_scores[-1]

        if interview_scores

        else 0

    )


    average_technical_score = safe_average(
        technical_scores
    )


    average_communication_score = safe_average(
        communication_scores
    )


    average_relevance_score = safe_average(
        relevance_scores
    )


    # =====================================================
    # RETURN COMPLETE REPORT
    # =====================================================

    return {

        # =================================================
        # RESUME
        # =================================================

        "resume": {

            "id":
                resume.id,

            "filename":
                resume.filename,

            "uploaded_at":
                (
                    resume.uploaded_at.isoformat()
                    if resume.uploaded_at
                    else None
                ),

            "ats_score":
                (
                    resume.ats_score
                    if resume.ats_score is not None
                    else 0
                ),

            "summary":
                (
                    resume.summary
                    or ""
                ),

            "strengths":
                parse_list(
                    resume.strengths
                ),

            "weaknesses":
                parse_list(
                    resume.weaknesses
                ),

            "skills":
                parse_list(
                    resume.skills
                ),

            "missing_skills":
                parse_list(
                    resume.missing_skills
                ),

            "suggestions":
                parse_list(
                    resume.suggestions
                ),

            "recommended_roles":
                parse_list(
                    resume.recommended_roles
                ),

        },


        # =================================================
        # JOB MATCH
        # =================================================

        "job_match": {

            "total_matches":
                len(job_matches),

            "average_score":
                average_job_match,

            "best_score":
                best_job_match,

            "history":
                job_match_history,

        },


        # =================================================
        # INTERVIEW
        # =================================================

        "interview": {

            "total_sessions":
                total_interview_sessions,

            "completed_sessions":
                completed_interview_sessions,

            "total_questions":
                total_interview_questions,

            "total_questions_answered":
                total_questions_answered,

            "average_score":
                average_interview_score,

            "best_score":
                best_interview_score,

            "latest_score":
                latest_interview_score,

            "average_technical_score":
                average_technical_score,

            "average_communication_score":
                average_communication_score,

            "average_relevance_score":
                average_relevance_score,

            "history":
                interview_history,

        },

    }