from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import BaseModel

from sqlalchemy.orm import Session

from ..database import get_db

from ..dependencies import get_current_user

from ..models import (
    Resume,
    User,
)

from ..services.ai_service import (
    generate_cover_letter,
)

from ..services.subscription_service import (
    require_plan,
)


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


# =========================================================
# REQUEST MODEL
# =========================================================

class CoverLetterRequest(BaseModel):
    resume_id: int
    job_description: str


# =========================================================
# GENERATE COVER LETTER
# PRO+
# =========================================================

@router.post("/cover-letter")
def create_cover_letter(
    request: CoverLetterRequest,
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
        feature_name="Cover Letter",
    )

    # =====================================================
    # VALIDATE JOB DESCRIPTION
    # =====================================================

    if not request.job_description.strip():

        raise HTTPException(
            status_code=400,
            detail="Job description is required.",
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
    # GENERATE COVER LETTER
    # =====================================================

    try:

        cover_letter = generate_cover_letter(
            resume_text=resume.extracted_text,
            job_description=request.job_description,
        )

        return {
            "cover_letter": cover_letter,
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Cover letter generation error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate "
                "cover letter."
            ),
        )