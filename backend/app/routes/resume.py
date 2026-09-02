import os
import uuid
import fitz

from pathlib import Path
from typing import List, Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    HTTPException,
)

from fastapi.responses import FileResponse, RedirectResponse

from pydantic import BaseModel

from sqlalchemy.orm import Session

from ..config import STORAGE_PROVIDER, UPLOAD_DIR
from ..services.storage_service import (
    cloudinary_configured,
    delete_resume,
    signed_resume_url,
    upload_resume as upload_resume_to_cloudinary,
)
from ..database import get_db

from ..models import (
    Resume,
    User,
    JobMatch,
)

from ..schemas_resume import (
    ResumeResponse,
    ResumeAnalysisResponse,
)

from ..services.pdf_service import (
    extract_text_from_pdf,
)

from ..services.ai_service import (
    analyze_resume,
)

from ..services.resume_insights import (
    extract_resume_insights,
)

from ..services.job_match_service import (
    analyze_job_match,
)

from ..services.subscription_service import (
    require_plan,
)

from ..dependencies import (
    get_current_user,
)


router = APIRouter(
    prefix="/resume",
    tags=["Resume"],
)


UPLOAD_FOLDER = Path(UPLOAD_DIR)
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


# =========================================================
# REQUEST MODELS
# =========================================================

class MatchRequest(BaseModel):

    resume_id: int

    job_description: str


# =========================================================
# HELPERS
# =========================================================

def safe_list(
    value: Any,
) -> list:

    """
    Convert AI/service output into a clean list.

    Supports:
    - list
    - tuple
    - newline-separated string
    - comma-separated string
    - None
    """

    if value is None:
        return []


    if isinstance(value, list):

        return [
            str(item).strip()
            for item in value
            if str(item).strip()
        ]


    if isinstance(value, tuple):

        return [
            str(item).strip()
            for item in value
            if str(item).strip()
        ]


    if isinstance(value, str):

        value = value.strip()

        if not value:
            return []


        if "\n" in value:

            return [
                item.strip()
                for item in value.split("\n")
                if item.strip()
            ]


        if "," in value:

            return [
                item.strip()
                for item in value.split(",")
                if item.strip()
            ]


        return [value]


    return []


def safe_number(
    value: Any,
    default: float = 0,
) -> float:

    """
    Safely convert AI/service numeric output
    into a number between 0 and 100.
    """

    try:

        number = float(value)


        if number < 0:
            return 0


        if number > 100:
            return 100


        return int(round(number))


    except (
        TypeError,
        ValueError,
    ):

        return default


# =========================================================
# UPLOAD RESUME
# =========================================================

@router.post("/upload")
async def upload_resume(

    file: UploadFile = File(...),

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user),

):

    # =====================================================
    # VALIDATE FILE
    # =====================================================

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="Invalid file name.",
        )


    if not file.filename.lower().endswith(
        ".pdf"
    ):

        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are supported.",
        )


    original_filename = Path(file.filename).name
    if not original_filename or original_filename.lower().split(".")[-1] != "pdf":
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")

    stored_filename = f"{current_user.id}_{uuid.uuid4().hex}.pdf"
    file_path = UPLOAD_FOLDER / stored_filename
    uploaded_cloudinary_key = None

    try:
        total_bytes = 0
        with open(file_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Resume PDF must be 10 MB or smaller.")
                buffer.write(chunk)

        if total_bytes == 0:
            raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")

        with open(file_path, "rb") as uploaded_file:
            if uploaded_file.read(5) != b"%PDF-":
                raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF.")


        # =================================================
        # EXTRACT PDF TEXT
        # =================================================

        pdf_text = (
            extract_text_from_pdf(
                file_path
            )
        )


        if not pdf_text.strip():

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unable to extract readable "
                    "text from the PDF."
                ),
            )


        # =================================================
        # COUNT PAGES
        # =================================================

        document = fitz.open(
            file_path
        )

        pages = len(
            document
        )

        document.close()


        # =================================================
        # AI RESUME ANALYSIS
        # =================================================

        analysis = analyze_resume(
            pdf_text
        )


        # =================================================
        # RESUME INSIGHTS
        # =================================================

        insights = extract_resume_insights(

            text=pdf_text,

            pages=pages,

            ats_score=analysis.get(
                "ats_score",
                0,
            ),

        )


        # =================================================
        # PERSIST FILE
        # =================================================

        storage_provider = "local"
        storage_key = None
        storage_version = None
        storage_filepath = str(file_path)

        use_cloudinary = (
            STORAGE_PROVIDER == "cloudinary"
            or (STORAGE_PROVIDER == "auto" and cloudinary_configured())
        )

        if STORAGE_PROVIDER not in {"local", "cloudinary", "auto"}:
            raise HTTPException(
                status_code=500,
                detail="Invalid STORAGE_PROVIDER configuration. Use local, cloudinary, or auto.",
            )

        if STORAGE_PROVIDER == "cloudinary" and not cloudinary_configured():
            raise HTTPException(
                status_code=503,
                detail="Cloudinary storage is required but not configured on the server.",
            )

        if use_cloudinary:
            cloudinary_public_id = f"resumes/{current_user.id}/{uuid.uuid4().hex}.pdf"
            uploaded_asset = upload_resume_to_cloudinary(
                file_path=file_path,
                user_id=current_user.id,
                public_id=cloudinary_public_id,
            )
            storage_provider = "cloudinary"
            storage_key = str(uploaded_asset.get("public_id") or cloudinary_public_id)
            uploaded_cloudinary_key = storage_key
            storage_version = str(uploaded_asset.get("version") or "") or None
            storage_filepath = f"cloudinary://{storage_key}"

            # The application filesystem is only temporary when Cloudinary
            # is enabled; do not leave user documents on ephemeral disk.
            try:
                file_path.unlink()
            except FileNotFoundError:
                pass

        # =================================================
        # SAVE RESUME
        # =================================================

        resume = Resume(

            filename=original_filename,

            filepath=storage_filepath,

            storage_provider=storage_provider,

            storage_key=storage_key,

            storage_version=storage_version,

            extracted_text=pdf_text,

            ats_score=analysis.get(
                "ats_score"
            ),

            summary=analysis.get(
                "summary"
            ),

            strengths="\n".join(
                safe_list(analysis.get("strengths"))
            ),

            weaknesses="\n".join(
                safe_list(analysis.get("weaknesses"))
            ),

            skills="\n".join(
                safe_list(analysis.get("skills"))
            ),

            missing_skills="\n".join(
                safe_list(analysis.get("missing_skills"))
            ),

            suggestions="\n".join(
                safe_list(analysis.get("suggestions"))
            ),

            recommended_roles="\n".join(
                safe_list(analysis.get("recommended_roles"))
            ),

            user_id=current_user.id,

        )


        db.add(
            resume
        )

        db.commit()

        db.refresh(
            resume
        )


        return {

            "message":
                "Resume uploaded successfully",

            "resume_id":
                resume.id,

            "filename":
                resume.filename,

            "analysis":
                analysis,

            "insights":
                insights,

        }


    except HTTPException:
        if uploaded_cloudinary_key:
            delete_resume(uploaded_cloudinary_key)
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception:
            pass
        raise


    except Exception as error:

        db.rollback()
        if uploaded_cloudinary_key:
            delete_resume(uploaded_cloudinary_key)
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception:
            pass

        print(
            "Resume upload error:",
            repr(error),
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to upload and "
                "analyze resume."
            ),
        )

# =========================================================
# GET RESUME ANALYSIS
# =========================================================

@router.get(
    "/{resume_id}",
    response_model=ResumeAnalysisResponse,
)
def get_resume_analysis(

    resume_id: int,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user),

):

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


    return resume


# =========================================================
# RE-ANALYZE EXISTING RESUME
# =========================================================

@router.post("/{resume_id}/analyze", response_model=ResumeAnalysisResponse)
def reanalyze_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found.")
    if not resume.extracted_text or not resume.extracted_text.strip():
        raise HTTPException(status_code=400, detail="This resume does not contain readable text.")

    try:
        analysis = analyze_resume(resume.extracted_text)
        resume.ats_score = safe_number(analysis.get("ats_score"), 0)
        resume.summary = str(analysis.get("summary") or "").strip()
        resume.strengths = "\n".join(safe_list(analysis.get("strengths")))
        resume.weaknesses = "\n".join(safe_list(analysis.get("weaknesses")))
        resume.skills = "\n".join(safe_list(analysis.get("skills")))
        resume.missing_skills = "\n".join(safe_list(analysis.get("missing_skills")))
        resume.suggestions = "\n".join(safe_list(analysis.get("suggestions")))
        resume.recommended_roles = "\n".join(safe_list(analysis.get("recommended_roles")))
        db.commit()
        db.refresh(resume)
        return resume
    except HTTPException:
        raise
    except Exception as error:
        db.rollback()
        print("Resume re-analysis error:", repr(error))
        raise HTTPException(status_code=502, detail="AI resume analysis failed. Check the OpenAI configuration and try again.")


# =========================================================
# JOB MATCH
# =========================================================

@router.post("/match")
async def match_resume(

    request: MatchRequest,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user),

):

    # =====================================================
    # PRO PLAN REQUIRED
    # =====================================================

    require_plan(

        db=db,

        user=current_user,

        required_plan="Pro",

        feature_name="Job Match",

    )


    # =====================================================
    # VALIDATE JOB DESCRIPTION
    # =====================================================

    job_description = (
        request.job_description.strip()
    )


    if not job_description:

        raise HTTPException(
            status_code=400,
            detail="Job description is required.",
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
            request.resume_id,

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
    # CHECK RESUME TEXT
    # =====================================================

    if not resume.extracted_text:

        raise HTTPException(
            status_code=400,
            detail=(
                "Selected resume does not "
                "contain readable text."
            ),
        )


    if not resume.extracted_text.strip():

        raise HTTPException(
            status_code=400,
            detail=(
                "Selected resume does not "
                "contain readable text."
            ),
        )


    # =====================================================
    # GENERATE AI MATCH
    # =====================================================

    try:

        result = analyze_job_match(

            resume_text=
                resume.extracted_text,

            job_description=
                job_description,

        )


        # =================================================
        # NORMALIZE AI RESULT
        # =================================================

        if not isinstance(
            result,
            dict,
        ):

            raise ValueError(
                "Job match service returned "
                "an invalid response."
            )


        match_score = safe_number(
            result.get(
                "match_score",
                0,
            )
        )


        experience_match = safe_number(
            result.get(
                "experience_match",
                0,
            )
        )


        education_match = safe_number(
            result.get(
                "education_match",
                0,
            )
        )


        matched_skills = safe_list(
            result.get(
                "matched_skills",
                [],
            )
        )


        missing_skills = safe_list(
            result.get(
                "missing_skills",
                [],
            )
        )


        matched_required_skills = safe_list(
            result.get(
                "matched_required_skills",
                [],
            )
        )


        matched_preferred_skills = safe_list(
            result.get(
                "matched_preferred_skills",
                [],
            )
        )


        missing_required_skills = safe_list(
            result.get(
                "missing_required_skills",
                [],
            )
        )


        missing_preferred_skills = safe_list(
            result.get(
                "missing_preferred_skills",
                [],
            )
        )


        required_skills = safe_list(
            result.get(
                "required_skills",
                [],
            )
        )


        preferred_skills = safe_list(
            result.get(
                "preferred_skills",
                [],
            )
        )


        suggestions = safe_list(
            result.get(
                "suggestions",
                [],
            )
        )


        recommendation = str(
            result.get(
                "recommendation",
                "",
            )
            or ""
        ).strip()


        # =================================================
        # SAVE JOB MATCH HISTORY
        # =================================================

        job_match = JobMatch(

            user_id=
                current_user.id,

            resume_id=
                resume.id,

            job_description=
                job_description,

            match_score=
                match_score,

            recommendation=
                recommendation,

            matched_skills=
                "\n".join(
                    matched_skills
                ),

            missing_skills=
                "\n".join(
                    missing_skills
                ),

        )


        db.add(
            job_match
        )

        db.commit()

        db.refresh(
            job_match
        )


        # =================================================
        # RETURN COMPLETE RESPONSE
        # =================================================

        return {

            "match_score":
                match_score,

            "matched_skills":
                matched_skills,

            "missing_skills":
                missing_skills,

            "matched_required_skills":
                matched_required_skills,

            "matched_preferred_skills":
                matched_preferred_skills,

            "missing_required_skills":
                missing_required_skills,

            "missing_preferred_skills":
                missing_preferred_skills,

            "required_skills":
                required_skills,

            "preferred_skills":
                preferred_skills,

            "experience_match":
                experience_match,

            "education_match":
                education_match,

            "suggestions":
                suggestions,

            "recommendation":
                recommendation,

            "job_match_id":
                job_match.id,

            "resume_id":
                resume.id,

            "resume_filename":
                resume.filename,

        }


    except HTTPException:

        raise


    except Exception as error:

        db.rollback()

        print(
            "Job match generation error:",
            error,
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to analyze "
                "job match."
            ),
        )


# =========================================================
# GET ALL USER RESUMES
# =========================================================

@router.get(
    "/",
    response_model=List[ResumeResponse],
)
def get_resumes(

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user),

):

    resumes = (
        db.query(
            Resume
        )
        .filter(
            Resume.user_id ==
            current_user.id
        )
        .order_by(
            Resume.uploaded_at.desc()
        )
        .all()
    )


    return resumes


# =========================================================
# GET RESUME PDF FILE
# =========================================================

@router.get(
    "/{resume_id}/file"
)
def get_resume_file(

    resume_id: int,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user),

):

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


    if resume.storage_provider == "cloudinary" and resume.storage_key:
        try:
            url = signed_resume_url(
                resume.storage_key,
                resume.storage_version,
            )
        except Exception:
            raise HTTPException(
                status_code=502,
                detail="Unable to access the stored resume.",
            )

        return RedirectResponse(url=url, status_code=307)

    if not resume.filepath or not os.path.exists(resume.filepath):
        raise HTTPException(
            status_code=404,
            detail="Resume file no longer exists.",
        )

    return FileResponse(
        path=resume.filepath,
        filename=resume.filename,
        media_type="application/pdf",
    )
