import json
import time

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import (
    BaseModel,
    Field,
)

from sqlalchemy.orm import Session

from ..database import get_db

from ..dependencies import get_current_user

from ..models import (
    Resume,
    User,
    InterviewSession,
    InterviewAnswer,
)

from ..services.interview_service import (
    generate_interview_questions,
    evaluate_interview_answer,
)

from ..services.subscription_service import (
    require_plan,
    get_interview_question_limit,
)


router = APIRouter(
    prefix="/interview",
    tags=["Interview Prep"],
)


def _clamp_score(value, default: int = 0) -> int:
    """
    Safely convert an AI-generated evaluation score into
    an integer between 0 and 100.
    """

    try:
        score = int(round(float(value)))
    except (TypeError, ValueError):
        return default

    return max(0, min(100, score))


# =========================================================
# GENERATE INTERVIEW QUESTIONS
# =========================================================


class InterviewRequest(BaseModel):
    resume_id: int
    job_description: str = ""
    difficulty: str = "Mixed"

    question_count: int = Field(
        default=10,
        ge=5,
        le=20,
    )


@router.post("/generate")
def generate_interview(
    request: InterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):


    # =====================================================
    # PLAN CHECK
    # =====================================================

    current_plan = require_plan(
        db=db,
        user=current_user,
        required_plan="Pro",
        feature_name="Interview Preparation",
    )


    # =====================================================
    # PLAN QUESTION LIMIT
    # =====================================================

    max_questions = get_interview_question_limit(
        current_plan
    )


    if request.question_count > max_questions:

        required_plan = (
            "Premium"
            if current_plan == "Pro"
            else "Pro"
        )

        raise HTTPException(
            status_code=403,
            detail={
                "code": "QUESTION_LIMIT",
                "feature": "Interview Preparation",
                "required_plan": required_plan,
                "current_plan": current_plan,
                "limit": max_questions,
                "message": (
                    f"{current_plan} plan allows up to "
                    f"{max_questions} questions per session."
                ),
            },
        )

    # =====================================================
    # VALIDATE DIFFICULTY
    # =====================================================

    if request.difficulty not in [
        "Easy",
        "Medium",
        "Hard",
        "Mixed",
    ]:

        raise HTTPException(
            status_code=400,
            detail="Invalid difficulty.",
        )

    # =====================================================
    # FIND RESUME
    # =====================================================


    resume = (
        db.query(Resume)
        .filter(
            Resume.id == request.resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if resume is None:

        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )


    # =====================================================
    # CHECK RESUME TEXT
    # =====================================================

    resume_text = resume.extracted_text or ""


    if not resume_text.strip():

        raise HTTPException(
            status_code=400,
            detail=(
                "Selected resume does not contain "
                "readable text."
            ),
        )

    # =====================================================
    # GENERATE QUESTIONS
    # =====================================================

    try:

        print(
            "INTERVIEW DEBUG: starting AI generation",
            flush=True,
        )

        ai_start_time = time.time()

        result = generate_interview_questions(
            resume_text=resume_text,
            job_description=request.job_description,
            difficulty=request.difficulty,
            question_count=request.question_count,
        )

        ai_elapsed = time.time() - ai_start_time

        print(
            "INTERVIEW DEBUG: AI generation finished "
            f"in {ai_elapsed:.2f}s",
            flush=True,
        )

        # =================================================
        # VALIDATE AI RESULT
        # =================================================

        if not isinstance(result, dict):

            raise ValueError(
                "AI returned an invalid response format."
            )

        questions = result.get(
            "questions",
            [],
        )

        print(
            "INTERVIEW DEBUG: questions received="
            f"{len(questions) if isinstance(questions, list) else 'INVALID'}",
            flush=True,
        )

        if not isinstance(questions, list):

            raise ValueError(
                "AI returned an invalid questions format."
            )

        if not questions:

            raise HTTPException(
                status_code=500,
                detail=(
                    "No interview questions "
                    "were generated."
                ),
            )

        # =================================================
        # ENFORCE REQUESTED QUESTION COUNT
        # =================================================
        #
        # The AI can occasionally return more questions
        # than requested. The backend must never trust the
        # AI to enforce the user's requested count.
        #
        # Example:
        #
        # Requested: 20
        # AI returns: 21
        # Final: 20
        #
        # This guarantees that the database and API
        # response contain exactly the requested number.
        # =================================================

        requested_question_count = request.question_count

        if len(questions) > requested_question_count:

            print(
                "INTERVIEW DEBUG: AI returned "
                f"{len(questions)} questions; "
                f"trimming to requested "
                f"{requested_question_count}",
                flush=True,
            )

            questions = questions[
                :requested_question_count
            ]

        # =================================================
        # FINAL QUESTION COUNT VALIDATION
        # =================================================

        if len(questions) != requested_question_count:

            raise ValueError(
                "AI returned fewer questions than requested."
            )

        print(
            "INTERVIEW DEBUG: final questions count="
            f"{len(questions)}",
            flush=True,
        )

        # =================================================
        # SAVE INTERVIEW SESSION
        # =================================================

        print(
            "INTERVIEW DEBUG: creating interview session",
            flush=True,
        )

        interview_session = InterviewSession(
            user_id=current_user.id,
            resume_id=resume.id,
            job_description=request.job_description,
            difficulty=request.difficulty,

            # IMPORTANT:
            # Use the final validated/truncated list.
            question_count=len(questions),

            questions=json.dumps(
                questions
            ),
        )

        db.add(interview_session)

        print(
            "INTERVIEW DEBUG: committing interview session",
            flush=True,
        )

        db_start_time = time.time()

        db.commit()

        db_elapsed = time.time() - db_start_time

        print(
            "INTERVIEW DEBUG: database commit finished "
            f"in {db_elapsed:.2f}s",
            flush=True,
        )

        db.refresh(interview_session)

        print(
            "INTERVIEW DEBUG: session saved successfully "
            f"id={interview_session.id}",
            flush=True,
        )

        # =================================================
        # RESPONSE
        # =================================================

        response = {
            "session_id": interview_session.id,
            "resume_id": resume.id,
            "resume_filename": resume.filename,
            "questions": questions,
            "plan": current_plan,
            "question_limit": max_questions,
        }

        print(
            "INTERVIEW DEBUG: returning successful response",
            flush=True,
        )

        return response

    except HTTPException:
        raise

    except Exception as error:

        db.rollback()

        print(
            "INTERVIEW GENERATION ERROR:",
            repr(error),
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate "
                "interview questions."
            ),
        )


# =========================================================
# EVALUATE INTERVIEW ANSWER
# PRO+
# =========================================================


class EvaluateAnswerRequest(BaseModel):
    resume_id: int
    session_id: int
    question: str
    answer: str
    job_description: str = ""


@router.post("/evaluate")
def evaluate_answer(
    request: EvaluateAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # =====================================================
    # PLAN CHECK
    # =====================================================

    require_plan(
        db=db,
        user=current_user,
        required_plan="Pro",
        feature_name="Interview Answer Evaluation",
    )

    # =====================================================
    # VALIDATE QUESTION
    # =====================================================

    if not request.question.strip():

        raise HTTPException(
            status_code=400,
            detail="Interview question is required.",
        )

    # =====================================================
    # VALIDATE ANSWER
    # =====================================================

    if not request.answer.strip():

        raise HTTPException(
            status_code=400,
            detail="Answer is required.",
        )

    # =====================================================
    # FIND RESUME
    # =====================================================

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == request.resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if resume is None:

        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    # =====================================================
    # CHECK RESUME TEXT
    # =====================================================

    if (
        not resume.extracted_text
        or not resume.extracted_text.strip()
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Selected resume does not contain "
                "readable text."
            ),
        )

    # =====================================================
    # FIND INTERVIEW SESSION
    # =====================================================

    interview_session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == request.session_id,
            InterviewSession.user_id == current_user.id,
            InterviewSession.resume_id == resume.id,
        )
        .first()
    )

    if interview_session is None:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    # =====================================================
    # VALIDATE SESSION QUESTIONS
    # =====================================================

    try:

        session_questions = json.loads(
            interview_session.questions or "[]"
        )

    except (
        TypeError,
        json.JSONDecodeError,
    ):

        session_questions = []

    valid_questions = {
        str(
            item.get(
                "question",
                "",
            )
        ).strip()

        for item in session_questions

        if (
            isinstance(item, dict)
            and item.get("question")
        )
    }

    if request.question.strip() not in valid_questions:

        raise HTTPException(
            status_code=400,
            detail=(
                "The submitted question does not "
                "belong to this interview session."
            ),
        )

    # =====================================================
    # CHECK DUPLICATE ANSWER
    # =====================================================

    existing_answer = (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.session_id
            == interview_session.id,
            InterviewAnswer.user_id
            == current_user.id,
            InterviewAnswer.question
            == request.question.strip(),
        )
        .first()
    )

    if existing_answer:

        raise HTTPException(
            status_code=409,
            detail=(
                "This interview question has "
                "already been evaluated."
            ),
        )

    # =====================================================
    # CHECK SESSION COMPLETION
    # =====================================================

    answered_count = (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.session_id
            == interview_session.id,
            InterviewAnswer.user_id
            == current_user.id,
        )
        .count()
    )

    if answered_count >= interview_session.question_count:

        raise HTTPException(
            status_code=409,
            detail=(
                "This interview session is "
                "already complete."
            ),
        )

    # =====================================================
    # EVALUATE ANSWER
    # =====================================================

    try:

        result = evaluate_interview_answer(
            question=request.question,
            answer=request.answer,
            resume_text=resume.extracted_text,
            job_description=(
                interview_session.job_description
                or ""
            ),
        )

        score = _clamp_score(
            result.get(
                "score",
                0,
            )
        )

        technical_score = _clamp_score(
            result.get(
                "technical_score",
                0,
            )
        )

        communication_score = _clamp_score(
            result.get(
                "communication_score",
                0,
            )
        )

        relevance_score = _clamp_score(
            result.get(
                "relevance_score",
                0,
            )
        )

        strengths = result.get(
            "strengths",
            [],
        )

        improvements = result.get(
            "improvements",
            [],
        )

        missing_points = result.get(
            "missing_points",
            [],
        )

        feedback = result.get(
            "feedback",
            "",
        )

        improved_answer = result.get(
            "improved_answer",
            "",
        )

        # =================================================
        # SAVE ANSWER
        # =================================================

        interview_answer = InterviewAnswer(
            user_id=current_user.id,
            resume_id=resume.id,
            session_id=interview_session.id,
            question=request.question,
            answer=request.answer,
            score=score,
            technical_score=technical_score,
            communication_score=communication_score,
            relevance_score=relevance_score,
            feedback=feedback,
            strengths=json.dumps(
                strengths
            ),
            improvements=json.dumps(
                improvements
            ),
            missing_points=json.dumps(
                missing_points
            ),
            improved_answer=improved_answer,
        )

        db.add(interview_answer)

        db.commit()

        db.refresh(interview_answer)

        # =================================================
        # RESPONSE
        # =================================================

        return {
            "id": interview_answer.id,
            "session_id": interview_session.id,
            "score": score,
            "technical_score": technical_score,
            "communication_score": communication_score,
            "relevance_score": relevance_score,
            "strengths": strengths,
            "improvements": improvements,
            "missing_points": missing_points,
            "feedback": feedback,
            "improved_answer": improved_answer,
        }

    except HTTPException:
        raise

    except Exception as error:

        db.rollback()

        print(
            "Interview evaluation error:",
            repr(error),
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to evaluate "
                "interview answer."
            ),
        )


# =========================================================
# INTERVIEW HISTORY
# PRO+
# =========================================================


@router.get("/history")
def get_interview_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # =====================================================
    # PLAN CHECK
    # =====================================================

    require_plan(
        db=db,
        user=current_user,
        required_plan="Pro",
        feature_name="Interview History",
    )

    # =====================================================
    # GET SESSIONS
    # =====================================================

    sessions = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.user_id
            == current_user.id,
        )
        .order_by(
            InterviewSession.created_at.desc(),
        )
        .all()
    )

    history = []

    # =====================================================
    # PROCESS SESSIONS
    # =====================================================

    for session in sessions:

        answers = (
            db.query(InterviewAnswer)
            .filter(
                InterviewAnswer.session_id
                == session.id,
                InterviewAnswer.user_id
                == current_user.id,
            )
            .order_by(
                InterviewAnswer.created_at.asc(),
            )
            .all()
        )

        # =================================================
        # SCORES
        # =================================================

        scores = [
            answer.score
            for answer in answers
            if answer.score is not None
        ]

        technical_scores = [
            answer.technical_score
            for answer in answers
            if answer.technical_score is not None
        ]

        communication_scores = [
            answer.communication_score
            for answer in answers
            if answer.communication_score is not None
        ]

        relevance_scores = [
            answer.relevance_score
            for answer in answers
            if answer.relevance_score is not None
        ]

        average_score = (
            round(
                sum(scores)
                / len(scores)
            )
            if scores
            else None
        )

        average_technical_score = (
            round(
                sum(technical_scores)
                / len(technical_scores)
            )
            if technical_scores
            else None
        )

        average_communication_score = (
            round(
                sum(communication_scores)
                / len(communication_scores)
            )
            if communication_scores
            else None
        )

        average_relevance_score = (
            round(
                sum(relevance_scores)
                / len(relevance_scores)
            )
            if relevance_scores
            else None
        )

        # =================================================
        # COMPLETION
        # =================================================

        question_count = (
            session.question_count
            or 0
        )

        completed_count = len(
            answers
        )

        completion_percentage = (
            round(
                (
                    completed_count
                    / question_count
                )
                * 100
            )
            if question_count > 0
            else 0
        )

        completed = (
            completed_count
            >= question_count
            if question_count > 0
            else False
        )

        # =================================================
        # ANSWERS
        # =================================================

        answer_list = []

        for answer in answers:

            # ---------------------------------------------
            # STRENGTHS
            # ---------------------------------------------

            try:

                strengths = (
                    json.loads(
                        answer.strengths
                    )
                    if answer.strengths
                    else []
                )

            except (
                json.JSONDecodeError,
                TypeError,
            ):

                strengths = []

            # ---------------------------------------------
            # IMPROVEMENTS
            # ---------------------------------------------

            try:

                improvements = (
                    json.loads(
                        answer.improvements
                    )
                    if answer.improvements
                    else []
                )

            except (
                json.JSONDecodeError,
                TypeError,
            ):

                improvements = []

            # ---------------------------------------------
            # MISSING POINTS
            # ---------------------------------------------

            try:

                missing_points = (
                    json.loads(
                        answer.missing_points
                    )
                    if answer.missing_points
                    else []
                )

            except (
                json.JSONDecodeError,
                TypeError,
            ):

                missing_points = []

            # ---------------------------------------------
            # ADD ANSWER
            # ---------------------------------------------

            answer_list.append(
                {
                    "id": answer.id,
                    "question": answer.question,
                    "answer": answer.answer,
                    "score": answer.score,
                    "technical_score": (
                        answer.technical_score
                    ),
                    "communication_score": (
                        answer.communication_score
                    ),
                    "relevance_score": (
                        answer.relevance_score
                    ),
                    "feedback": (
                        answer.feedback
                        or ""
                    ),
                    "strengths": strengths,
                    "improvements": improvements,
                    "missing_points": missing_points,
                    "improved_answer": (
                        answer.improved_answer
                        or ""
                    ),
                    "created_at": (
                        answer.created_at
                    ),
                }
            )

        # =================================================
        # ADD SESSION
        # =================================================

        history.append(
            {
                "session_id": session.id,
                "resume_id": session.resume_id,
                "resume_filename": (
                    session.resume.filename
                    if session.resume
                    else None
                ),
                "job_description": (
                    session.job_description
                    or ""
                ),
                "difficulty": session.difficulty,
                "question_count": question_count,
                "completed_count": completed_count,
                "completion_percentage": (
                    completion_percentage
                ),
                "completed": completed,
                "average_score": average_score,
                "average_technical_score": (
                    average_technical_score
                ),
                "average_communication_score": (
                    average_communication_score
                ),
                "average_relevance_score": (
                    average_relevance_score
                ),
                "created_at": session.created_at,
                "answers": answer_list,
            }
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "sessions": history,
        "total_sessions": len(history),
    }