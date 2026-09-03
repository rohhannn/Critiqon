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

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from ..auth import hash_password, verify_password
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
    email_configured,
    send_login_email,
    send_otp_email,
    send_welcome_email,
)


router = APIRouter()


# ============================================================
# EMAIL OTP CONFIGURATION
# ============================================================

OTP_LENGTH = 6

OTP_EXPIRY_MINUTES = 10

OTP_RESEND_COOLDOWN_SECONDS = 60

OTP_MAX_ATTEMPTS = 5


# ============================================================
# HELPERS
# ============================================================

def _normalise_email(email: str) -> str:
    return email.strip().lower()


def _hash_otp(email: str, otp: str) -> str:
    message = f"{email}:{otp}".encode("utf-8")

    return hmac.new(
        SECRET_KEY.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()


def _create_access_response(user: User) -> dict:
    access_token = create_access_token(
        data={
            "sub": user.email,
        }
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


def _validate_password(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters.",
        )

    # bcrypt has a 72-byte input limit.
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password must not exceed 72 bytes.",
        )


# ============================================================
# EMAIL OTP SCHEMAS
# ============================================================

class RequestOTP(BaseModel):
    email: EmailStr


class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str


# ============================================================
# PASSWORD REGISTRATION
# ============================================================

@router.post("/register")
def register(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Create a Critiqon account using email + password.
    """

    email = _normalise_email(
        str(user_data.email)
    )

    full_name = user_data.full_name.strip()

    password = user_data.password

    if not full_name:
        raise HTTPException(
            status_code=400,
            detail="Full name cannot be empty.",
        )

    _validate_password(password)

    # --------------------------------------------------------
    # Check existing account
    # --------------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail=(
                "An account with this email already exists. "
                "Please sign in instead."
            ),
        )

    # --------------------------------------------------------
    # Create user
    # --------------------------------------------------------

    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "An account with this email already exists. "
                "Please sign in instead."
            ),
        )

    # --------------------------------------------------------
    # Welcome email
    # --------------------------------------------------------

    background_tasks.add_task(
        send_welcome_email,
        user.full_name,
        user.email,
    )

    return {
        "message": "Account created successfully.",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
        },
    }


# ============================================================
# PASSWORD LOGIN
# ============================================================

@router.post("/login")
def login(
    user_data: UserLogin,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Authenticate using email + password.
    """

    email = _normalise_email(
        str(user_data.email)
    )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Do not reveal whether an email exists.
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    try:
        password_valid = verify_password(
            user_data.password,
            user.hashed_password,
        )
    except Exception:
        password_valid = False

    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # --------------------------------------------------------
    # Login notification
    # --------------------------------------------------------

    background_tasks.add_task(
        send_login_email,
        user.full_name,
        user.email,
    )

    return _create_access_response(user)


# ============================================================
# EMAIL OTP — REQUEST
# ============================================================

@router.post("/request-otp")
def request_otp(
    request: RequestOTP,
    db: Session = Depends(get_db),
):
    """
    Generate and send a six-digit verification code.

    OTP login can be used for both existing accounts and
    first-time users.
    """

    email = _normalise_email(
        str(request.email)
    )

    now = datetime.utcnow()

    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == email
        )
        .first()
    )

    # --------------------------------------------------------
    # Cooldown
    # --------------------------------------------------------

    if (
        otp_record
        and otp_record.last_sent_at
    ):
        elapsed = (
            now - otp_record.last_sent_at
        ).total_seconds()

        if (
            elapsed
            < OTP_RESEND_COOLDOWN_SECONDS
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
                    "seconds before requesting another code."
                ),
                headers={
                    "Retry-After": str(retry_after)
                },
            )

    # --------------------------------------------------------
    # Email configuration
    # --------------------------------------------------------

    if not email_configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "Email delivery is not configured. "
                "Configure RESEND_API_KEY and EMAIL_FROM "
                "on the server."
            ),
        )

    # --------------------------------------------------------
    # Generate OTP
    # --------------------------------------------------------

    otp = str(
        secrets.randbelow(900000) + 100000
    )

    # --------------------------------------------------------
    # Create / replace OTP
    # --------------------------------------------------------

    if otp_record is None:
        otp_record = EmailOTP(
            email=email,
            code_hash=_hash_otp(
                email,
                otp,
            ),
            expires_at=(
                now
                + timedelta(
                    minutes=OTP_EXPIRY_MINUTES
                )
            ),
            attempts=0,
            last_sent_at=now,
        )

        db.add(otp_record)

    else:
        otp_record.code_hash = _hash_otp(
            email,
            otp,
        )

        otp_record.expires_at = (
            now
            + timedelta(
                minutes=OTP_EXPIRY_MINUTES
            )
        )

        otp_record.attempts = 0
        otp_record.last_sent_at = now

    db.commit()

    # --------------------------------------------------------
    # Send OTP
    # --------------------------------------------------------

    delivered = send_otp_email(
        email=email,
        otp=otp,
        expires_minutes=OTP_EXPIRY_MINUTES,
    )

    if not delivered:
        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=503,
            detail=(
                "We could not send the verification code. "
                "Please try again shortly."
            ),
        )

    return {
        "message": "Verification code sent.",
        "expires_in": OTP_EXPIRY_MINUTES * 60,
        "resend_after": OTP_RESEND_COOLDOWN_SECONDS,
    }


# ============================================================
# EMAIL OTP — VERIFY
# ============================================================

@router.post("/verify-otp")
def verify_otp(
    request: VerifyOTP,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Verify an OTP and authenticate/create the user.
    """

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
            detail="Enter the 6-digit verification code.",
        )

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
                "This code is invalid or has expired. "
                "Request a new code."
            ),
        )

    if otp_record.expires_at < now:
        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail=(
                "This code has expired. "
                "Request a new code."
            ),
        )

    if otp_record.attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail=(
                "Too many incorrect attempts. "
                "Request a new code."
            ),
        )

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
            OTP_MAX_ATTEMPTS
            - otp_record.attempts,
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Incorrect verification code. "
                f"{remaining} attempt"
                f"{'s' if remaining != 1 else ''}"
                " remaining."
            ),
        )

    # ========================================================
    # VALID OTP
    # ========================================================

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    is_new_user = user is None

    # --------------------------------------------------------
    # Create account for first-time OTP user
    # --------------------------------------------------------

    if user is None:
        display_name = (
            email
            .split("@", 1)[0]
            .replace(".", " ")
            .replace("_", " ")
            .strip()
        )

        display_name = " ".join(
            part.capitalize()
            for part in display_name.split()
        )

        if not display_name:
            display_name = "Critiqon User"

        user = User(
            full_name=display_name,
            email=email,

            # Random password means this OTP-created account
            # can still use the password column required by
            # the existing database schema.
            hashed_password=hash_password(
                secrets.token_urlsafe(32)
            ),
        )

        db.add(user)

        db.flush()

    # --------------------------------------------------------
    # Delete used OTP
    # --------------------------------------------------------

    db.delete(otp_record)

    db.commit()

    db.refresh(user)

    # --------------------------------------------------------
    # Emails
    # --------------------------------------------------------

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

    return _create_access_response(user)


# ============================================================
# GOOGLE LOGIN
# ============================================================

class GoogleLoginRequest(BaseModel):
    credential: str


@router.post("/google-login")
def google_login(
    request: GoogleLoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail=(
                "Google Sign-In is not configured "
                "on the server."
            ),
        )

    if not request.credential:
        raise HTTPException(
            status_code=400,
            detail="Google credential was not provided.",
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
            detail="Google Sign-In verification failed.",
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
                "Google account email could "
                "not be verified."
            ),
        )

    name = str(
        google_user.get("name")
        or google_user.get("given_name")
        or email.split("@", 1)[0]
    ).strip()

    if not name:
        name = email.split("@", 1)[0]

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    is_new_user = user is None

    if user is None:
        user = User(
            full_name=name,
            email=email,
            hashed_password=hash_password(
                secrets.token_urlsafe(32)
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

    return _create_access_response(user)


# ============================================================
# OAUTH2 PASSWORD LOGIN
# ============================================================

@router.post("/login/oauth")
def login_oauth(
    form_data: OAuth2PasswordRequestForm = Depends(),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    """
    Compatibility endpoint for Swagger/OAuth2 clients.
    """

    email = _normalise_email(
        form_data.username
    )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    try:
        valid = verify_password(
            form_data.password,
            user.hashed_password,
        )
    except Exception:
        valid = False

    if not valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    return _create_access_response(user)


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(
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
    current_user: User = Depends(
        get_current_user
    ),
):
    full_name = profile.full_name.strip()

    email = _normalise_email(
        str(profile.email)
    )

    if not full_name:
        raise HTTPException(
            status_code=400,
            detail="Full name cannot be empty.",
        )

    if email != current_user.email:
        raise HTTPException(
            status_code=400,
            detail=(
                "Email changes require a fresh "
                "verification-code flow and cannot "
                "be changed from profile settings."
            ),
        )

    current_user.full_name = full_name

    db.commit()
    db.refresh(current_user)

    return current_user


# ============================================================
# CHANGE PASSWORD
# ============================================================

@router.put("/password")
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Allows an authenticated user to change their password.
    """

    try:
        valid = verify_password(
            password_data.current_password,
            current_user.hashed_password,
        )
    except Exception:
        valid = False

    if not valid:
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )

    _validate_password(
        password_data.new_password
    )

    current_user.hashed_password = (
        hash_password(
            password_data.new_password
        )
    )

    db.commit()

    return {
        "message": "Password changed successfully.",
    }