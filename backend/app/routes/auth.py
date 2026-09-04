from datetime import datetime, timedelta
import hashlib
import hmac
import secrets

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
)

from fastapi.security import OAuth2PasswordRequestForm

from pydantic import BaseModel, EmailStr

from sqlalchemy.orm import Session

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from ..auth import hash_password
from ..config import GOOGLE_CLIENT_ID
from ..database import get_db
from ..dependencies import get_current_user
from ..jwt_handler import SECRET_KEY, create_access_token
from ..models import EmailOTP, User

from ..schemas import (
    ProfileUpdate,
    PasswordChange,
    UserCreate,
    UserResponse,
    UserLogin,
)

from ..services.email_service import (
    send_login_email,
    send_otp_email,
    send_welcome_email,
)


router = APIRouter()


# ============================================================
# OTP CONFIGURATION
# ============================================================

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS = 5


# ============================================================
# HELPERS
# ============================================================

def _normalise_email(
    email: str,
) -> str:
    return (
        email
        .strip()
        .lower()
    )


def _hash_otp(
    email: str,
    otp: str,
) -> str:
    message = (
        f"{email}:{otp}"
        .encode("utf-8")
    )

    return hmac.new(
        SECRET_KEY.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()


def _create_access_response(
    user: User,
) -> dict:
    access_token = (
        create_access_token(
            data={
                "sub": user.email,
            }
        )
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
        },
    }


def _create_and_store_otp(
    email: str,
    db: Session,
) -> tuple[str, int]:
    """
    Create a new OTP and store only its hash.
    """

    now = datetime.utcnow()

    otp = str(
        secrets.randbelow(
            900000
        ) + 100000
    )

    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == email
        )
        .first()
    )

    if (
        otp_record
        and otp_record.last_sent_at
    ):
        elapsed = (
            now -
            otp_record.last_sent_at
        ).total_seconds()

        if (
            elapsed <
            OTP_RESEND_COOLDOWN_SECONDS
        ):
            retry_after = max(
                1,
                OTP_RESEND_COOLDOWN_SECONDS
                - int(elapsed),
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Please wait {retry_after} "
                    "seconds before requesting "
                    "another code."
                ),
                headers={
                    "Retry-After": str(
                        retry_after
                    )
                },
            )

    code_hash = _hash_otp(
        email,
        otp,
    )

    expires_at = (
        now +
        timedelta(
            minutes=OTP_EXPIRY_MINUTES
        )
    )

    if otp_record is None:
        otp_record = EmailOTP(
            email=email,
            code_hash=code_hash,
            expires_at=expires_at,
            attempts=0,
            last_sent_at=now,
        )

        db.add(otp_record)

    else:
        otp_record.code_hash = (
            code_hash
        )

        otp_record.expires_at = (
            expires_at
        )

        otp_record.attempts = 0
        otp_record.last_sent_at = now

    db.commit()

    return (
        otp,
        OTP_RESEND_COOLDOWN_SECONDS,
    )


# ============================================================
# PASSWORDLESS EMAIL OTP
# ============================================================

class RequestOTP(
    BaseModel
):
    email: EmailStr


class VerifyOTP(
    BaseModel
):
    email: EmailStr
    otp: str


# ============================================================
# NORMAL LOGIN OTP
#
# Existing users can use this endpoint.
# First-time emails are also allowed here because the
# established passwordless flow creates an account after
# successful verification.
# ============================================================

@router.post(
    "/request-otp"
)
def request_otp(
    request: RequestOTP,
    db: Session = Depends(get_db),
):
    email = _normalise_email(
        str(request.email)
    )

    otp, resend_after = (
        _create_and_store_otp(
            email,
            db,
        )
    )

    # OTP delivery is intentionally synchronous.
    from ..services.email_service import (
        email_configured,
    )

    if not email_configured():
        otp_record = (
            db.query(EmailOTP)
            .filter(
                EmailOTP.email == email
            )
            .first()
        )

        if otp_record:
            db.delete(
                otp_record
            )
            db.commit()

        raise HTTPException(
            status_code=503,
            detail=(
                "Email delivery is not configured. "
                "Configure RESEND_API_KEY and "
                "EMAIL_FROM on the server."
            ),
        )

    delivered = send_otp_email(
        email=email,
        otp=otp,
        expires_minutes=OTP_EXPIRY_MINUTES,
    )

    if not delivered:
        otp_record = (
            db.query(EmailOTP)
            .filter(
                EmailOTP.email == email
            )
            .first()
        )

        if otp_record:
            db.delete(
                otp_record
            )
            db.commit()

        raise HTTPException(
            status_code=503,
            detail=(
                "We could not send the verification "
                "code. Please try again shortly."
            ),
        )

    return {
        "message": (
            "Verification code sent."
        ),
        "expires_in": (
            OTP_EXPIRY_MINUTES *
            60
        ),
        "resend_after": (
            resend_after
        ),
    }


# ============================================================
# NEW ACCOUNT REGISTRATION
#
# IMPORTANT:
#
# This is the endpoint used by Get Started.
#
# Existing email:
#     409 Conflict
#
# New email:
#     Send OTP
#
# The actual User record is created only after the OTP
# is successfully verified.
# ============================================================

@router.post(
    "/register"
)
def register(
    request: RequestOTP,
    db: Session = Depends(get_db),
):
    email = _normalise_email(
        str(request.email)
    )

    # --------------------------------------------------------
    # CHECK EXISTING USER
    # --------------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This email is already registered. "
                "Please log in instead."
            ),
        )

    # --------------------------------------------------------
    # CREATE OTP
    # --------------------------------------------------------

    otp, resend_after = (
        _create_and_store_otp(
            email,
            db,
        )
    )

    # --------------------------------------------------------
    # VERIFY EMAIL CONFIGURATION
    # --------------------------------------------------------

    from ..services.email_service import (
        email_configured,
    )

    if not email_configured():
        otp_record = (
            db.query(EmailOTP)
            .filter(
                EmailOTP.email == email
            )
            .first()
        )

        if otp_record:
            db.delete(
                otp_record
            )
            db.commit()

        raise HTTPException(
            status_code=503,
            detail=(
                "Email delivery is not configured. "
                "Configure RESEND_API_KEY and "
                "EMAIL_FROM on the server."
            ),
        )

    # --------------------------------------------------------
    # SEND OTP
    # --------------------------------------------------------

    delivered = send_otp_email(
        email=email,
        otp=otp,
        expires_minutes=OTP_EXPIRY_MINUTES,
    )

    if not delivered:
        otp_record = (
            db.query(EmailOTP)
            .filter(
                EmailOTP.email == email
            )
            .first()
        )

        if otp_record:
            db.delete(
                otp_record
            )
            db.commit()

        raise HTTPException(
            status_code=503,
            detail=(
                "We could not send the verification "
                "code. Please try again shortly."
            ),
        )

    return {
        "message": (
            "Verification code sent."
        ),
        "expires_in": (
            OTP_EXPIRY_MINUTES *
            60
        ),
        "resend_after": (
            resend_after
        ),
    }


# ============================================================
# VERIFY OTP
# ============================================================

@router.post(
    "/verify-otp"
)
def verify_otp(
    request: VerifyOTP,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    email = _normalise_email(
        str(request.email)
    )

    otp = request.otp.strip()

    if (
        not otp.isdigit()
        or len(otp) != OTP_LENGTH
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Enter the 6-digit "
                "verification code."
            ),
        )

    # --------------------------------------------------------
    # FIND OTP
    # --------------------------------------------------------

    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == email
        )
        .first()
    )

    now = datetime.utcnow()

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail=(
                "This code is invalid or "
                "has expired. Request a new code."
            ),
        )

    # --------------------------------------------------------
    # EXPIRATION
    # --------------------------------------------------------

    if (
        otp_record.expires_at <
        now
    ):
        db.delete(
            otp_record
        )

        db.commit()

        raise HTTPException(
            status_code=400,
            detail=(
                "This code has expired. "
                "Request a new code."
            ),
        )

    # --------------------------------------------------------
    # ATTEMPT LIMIT
    # --------------------------------------------------------

    if (
        otp_record.attempts >=
        OTP_MAX_ATTEMPTS
    ):
        raise HTTPException(
            status_code=429,
            detail=(
                "Too many incorrect attempts. "
                "Request a new code."
            ),
        )

    # --------------------------------------------------------
    # VERIFY HASH
    # --------------------------------------------------------

    expected = _hash_otp(
        email,
        otp,
    )

    if not hmac.compare_digest(
        otp_record.code_hash,
        expected,
    ):
        otp_record.attempts += 1

        db.commit()

        remaining = max(
            0,
            OTP_MAX_ATTEMPTS -
            otp_record.attempts,
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Incorrect verification code. "
                f"{remaining} attempt"
                f"{'s' if remaining != 1 else ''} remaining."
            ),
        )

    # --------------------------------------------------------
    # FIND USER
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    is_new_user = (
        user is None
    )

    # --------------------------------------------------------
    # CREATE NEW USER
    #
    # This is what makes the Get Started OTP flow work.
    # The user does NOT exist in the database before
    # verification.
    # --------------------------------------------------------

    if user is None:
        display_name = (
            email
            .split(
                "@",
                1,
            )[0]
            .replace(
                ".",
                " ",
            )
            .replace(
                "_",
                " ",
            )
            .strip()
        )

        display_name = (
            " ".join(
                part.capitalize()
                for part in
                display_name.split()
            )
            or "Critiqon User"
        )

        user = User(
            full_name=display_name,
            email=email,

            # Kept only because the existing database
            # schema expects a password hash.
            #
            # Password authentication itself is disabled.
            hashed_password=hash_password(
                secrets.token_urlsafe(
                    48
                )
            ),
        )

        db.add(user)

        db.flush()

    # --------------------------------------------------------
    # DELETE USED OTP
    # --------------------------------------------------------

    db.delete(
        otp_record
    )

    db.commit()

    db.refresh(
        user
    )

    # --------------------------------------------------------
    # WELCOME EMAIL
    # --------------------------------------------------------

    if is_new_user:
        background_tasks.add_task(
            send_welcome_email,
            user.full_name,
            user.email,
        )

    # --------------------------------------------------------
    # LOGIN EMAIL
    # --------------------------------------------------------

    background_tasks.add_task(
        send_login_email,
        user.full_name,
        user.email,
    )

    # --------------------------------------------------------
    # RETURN JWT
    # --------------------------------------------------------

    return _create_access_response(
        user
    )


# ============================================================
# LEGACY PASSWORD LOGIN
# ============================================================

@router.post(
    "/login"
)
def legacy_login_disabled(
    user: UserLogin,
):
    raise HTTPException(
        status_code=410,
        detail=(
            "Password login has been replaced "
            "by email verification codes. "
            "Use /request-otp and /verify-otp."
        ),
    )


# ============================================================
# GOOGLE LOGIN
# ============================================================

class GoogleLoginRequest(
    BaseModel
):
    credential: str


@router.post(
    "/google-login"
)
def google_login(
    request: GoogleLoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail=(
                "Google Sign-In is not "
                "configured on the server."
            ),
        )

    if not request.credential:
        raise HTTPException(
            status_code=400,
            detail=(
                "Google credential "
                "was not provided."
            ),
        )

    try:
        google_user = (
            id_token.verify_oauth2_token(
                request.credential,
                google_requests.Request(),
                GOOGLE_CLIENT_ID,
            )
        )

    except Exception as error:
        print(
            "Google token verification error:",
            repr(error),
        )

        raise HTTPException(
            status_code=401,
            detail=(
                "Google Sign-In "
                "verification failed."
            ),
        )

    email = _normalise_email(
        str(
            google_user.get(
                "email",
                "",
            )
        )
    )

    if (
        not email
        or google_user.get(
            "email_verified"
        ) is not True
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Google account email "
                "could not be verified."
            ),
        )

    name = str(
        google_user.get(
            "name"
        )
        or google_user.get(
            "given_name"
        )
        or email.split(
            "@",
            1,
        )[0]
    ).strip()

    if not name:
        name = "Critiqon User"

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    is_new_user = (
        user is None
    )

    if user is None:
        user = User(
            full_name=name,
            email=email,
            hashed_password=hash_password(
                secrets.token_urlsafe(
                    48
                )
            ),
        )

        db.add(user)

        db.commit()

        db.refresh(user)

    if is_new_user:
        background_tasks.add_task(
            send_welcome_email,
            user.full_name,
            user.email,
        )

    background_tasks.add_task(
        send_login_email,
        user.full_name,
        user.email,
    )

    return _create_access_response(
        user
    )


# ============================================================
# SWAGGER / LEGACY PASSWORD LOGIN
# ============================================================

@router.post(
    "/login/oauth"
)
def login_oauth_disabled(
    form_data: OAuth2PasswordRequestForm =
        Depends(),
):
    raise HTTPException(
        status_code=410,
        detail=(
            "Password login is disabled. "
            "Use email OTP authentication."
        ),
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User =
        Depends(
            get_current_user
        ),
):
    return current_user


# ============================================================
# UPDATE PROFILE
# ============================================================

@router.put(
    "/profile",
    response_model=UserResponse,
)
def update_profile(
    profile: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User =
        Depends(
            get_current_user
        ),
):
    full_name = (
        profile.full_name.strip()
    )

    email = _normalise_email(
        str(profile.email)
    )

    if not full_name:
        raise HTTPException(
            status_code=400,
            detail=(
                "Full name cannot be empty."
            ),
        )

    if (
        email !=
        current_user.email
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Email changes require "
                "a fresh verification-code "
                "flow and cannot be changed "
                "from profile settings."
            ),
        )

    current_user.full_name = (
        full_name
    )

    db.commit()

    db.refresh(
        current_user
    )

    return current_user


# ============================================================
# CHANGE PASSWORD
# ============================================================

@router.put(
    "/password"
)
def change_password_disabled(
    password_data: PasswordChange,
):
    raise HTTPException(
        status_code=410,
        detail=(
            "Password authentication is disabled. "
            "Critiqon uses email verification codes."
        ),
    )