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
# EMAIL OTP CONFIGURATION
# ============================================================

OTP_LENGTH = 6

# OTP remains valid for 10 minutes.
OTP_EXPIRY_MINUTES = 10

# User can request another OTP after 60 seconds.
OTP_RESEND_COOLDOWN_SECONDS = 60

# Maximum incorrect attempts for one OTP.
OTP_MAX_ATTEMPTS = 5


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def _normalise_email(email: str) -> str:
    """
    Normalise an email address so that authentication is
    case-insensitive and whitespace is removed.
    """
    return email.strip().lower()


def _hash_otp(email: str, otp: str) -> str:
    """
    Hash the OTP before storing it in the database.

    The raw OTP is never stored in the database.
    """
    message = f"{email}:{otp}".encode("utf-8")

    return hmac.new(
        SECRET_KEY.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()


def _create_access_response(user: User) -> dict:
    """
    Create the application's JWT response after successful
    authentication.
    """

    access_token = create_access_token(
        data={
            "sub": user.email
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


# ============================================================
# EMAIL OTP LOGIN
# ============================================================

class RequestOTP(BaseModel):
    email: EmailStr


class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str


# ============================================================
# REQUEST OTP
# ============================================================

@router.post("/request-otp")
def request_otp(
    request: RequestOTP,
    db: Session = Depends(get_db),
):
    """
    Generate and send a six-digit verification code.

    This is the first step of passwordless authentication.
    """

    email = _normalise_email(str(request.email))

    now = datetime.utcnow()

    # --------------------------------------------------------
    # Check whether an OTP already exists
    # --------------------------------------------------------

    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == email
        )
        .first()
    )

    # --------------------------------------------------------
    # Resend cooldown
    # --------------------------------------------------------

    if otp_record and otp_record.last_sent_at:

        elapsed = (
            now - otp_record.last_sent_at
        ).total_seconds()

        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:

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
    # Generate secure six-digit OTP
    # --------------------------------------------------------

    otp = str(
        secrets.randbelow(900000) + 100000
    )

    # --------------------------------------------------------
    # Create or replace OTP record
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

    # --------------------------------------------------------
    # Save OTP before sending
    # --------------------------------------------------------

    db.commit()

    # --------------------------------------------------------
    # Check email configuration
    # --------------------------------------------------------

    from ..services.email_service import email_configured

    if not email_configured():

        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=503,
            detail=(
                "Email delivery is not configured. "
                "Configure RESEND_API_KEY and EMAIL_FROM "
                "on the server."
            ),
        )

    # --------------------------------------------------------
    # Send OTP email
    # --------------------------------------------------------

    delivered = send_otp_email(
        email=email,
        otp=otp,
        expires_minutes=OTP_EXPIRY_MINUTES,
    )

    # --------------------------------------------------------
    # If email delivery failed, don't leave a usable OTP
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Success
    # --------------------------------------------------------

    return {
        "message": "Verification code sent.",
        "expires_in": OTP_EXPIRY_MINUTES * 60,
        "resend_after": OTP_RESEND_COOLDOWN_SECONDS,
    }


# ============================================================
# VERIFY OTP
# ============================================================

@router.post("/verify-otp")
def verify_otp(
    request: VerifyOTP,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Verify the email OTP.

    If valid:
        - Create the user if necessary
        - Delete the OTP
        - Create JWT
        - Send login email
        - Send welcome email for new accounts
        - Return authenticated user
    """

    email = _normalise_email(
        str(request.email)
    )

    otp = request.otp.strip()

    # --------------------------------------------------------
    # Validate OTP format
    # --------------------------------------------------------

    if not otp.isdigit() or len(otp) != OTP_LENGTH:

        raise HTTPException(
            status_code=400,
            detail=(
                "Enter the 6-digit verification code."
            ),
        )

    # --------------------------------------------------------
    # Find OTP
    # --------------------------------------------------------

    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == email
        )
        .first()
    )

    now = datetime.utcnow()

    # --------------------------------------------------------
    # OTP doesn't exist
    # --------------------------------------------------------

    if not otp_record:

        raise HTTPException(
            status_code=400,
            detail=(
                "This code is invalid or has expired. "
                "Request a new code."
            ),
        )

    # --------------------------------------------------------
    # OTP expired
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Too many attempts
    # --------------------------------------------------------

    if otp_record.attempts >= OTP_MAX_ATTEMPTS:

        raise HTTPException(
            status_code=429,
            detail=(
                "Too many incorrect attempts. "
                "Request a new code."
            ),
        )

    # --------------------------------------------------------
    # Calculate expected OTP hash
    # --------------------------------------------------------

    expected = _hash_otp(
        email,
        otp,
    )

    # --------------------------------------------------------
    # Compare securely
    # --------------------------------------------------------

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
    # OTP IS VALID
    # ========================================================

    # --------------------------------------------------------
    # Find existing user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    is_new_user = user is None

    # --------------------------------------------------------
    # Create account if this is the first login
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

            # ------------------------------------------------
            # Password login is disabled.
            #
            # This random password only exists because the
            # current database model requires hashed_password.
            # ------------------------------------------------

            hashed_password=hash_password(
                secrets.token_urlsafe(48)
            ),
        )

        db.add(user)

        # Get the database ID before commit.
        db.flush()

    # --------------------------------------------------------
    # Delete used OTP
    # --------------------------------------------------------

    db.delete(otp_record)

    # --------------------------------------------------------
    # Commit user + OTP deletion
    # --------------------------------------------------------

    db.commit()

    db.refresh(user)

    # --------------------------------------------------------
    # Welcome email for brand-new account
    # --------------------------------------------------------

    if is_new_user:

        background_tasks.add_task(
            send_welcome_email,
            user.full_name,
            user.email,
        )

    # --------------------------------------------------------
    # Login notification
    # --------------------------------------------------------

    background_tasks.add_task(
        send_login_email,
        user.full_name,
        user.email,
    )

    # --------------------------------------------------------
    # Return JWT
    # --------------------------------------------------------

    return _create_access_response(
        user
    )


# ============================================================
# LEGACY PASSWORD LOGIN DISABLED
# ============================================================

@router.post("/login")
def legacy_login_disabled(
    user: UserLogin,
):
    """
    Password login has been intentionally disabled.

    Authentication is now performed through:
        /request-otp
        /verify-otp
    """

    raise HTTPException(
        status_code=410,
        detail=(
            "Password login has been replaced "
            "by email verification codes. "
            "Use /request-otp and /verify-otp."
        ),
    )


# ============================================================
# LEGACY PASSWORD REGISTRATION DISABLED
# ============================================================

@router.post("/register")
def legacy_register_disabled(
    user: UserCreate,
):
    """
    Password registration has been disabled.

    A Critiqon account is automatically created after
    successful email OTP verification.
    """

    raise HTTPException(
        status_code=410,
        detail=(
            "Password registration has been replaced "
            "by email verification. "
            "Enter your email on the sign-in page."
        ),
    )


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
    """
    Verify Google Identity Services ID token
    and authenticate/create the user.
    """

    # --------------------------------------------------------
    # Check Google configuration
    # --------------------------------------------------------

    if not GOOGLE_CLIENT_ID:

        raise HTTPException(
            status_code=503,
            detail=(
                "Google Sign-In is not configured "
                "on the server."
            ),
        )

    # --------------------------------------------------------
    # Check credential
    # --------------------------------------------------------

    if not request.credential:

        raise HTTPException(
            status_code=400,
            detail=(
                "Google credential was not provided."
            ),
        )

    # --------------------------------------------------------
    # Verify Google ID token
    # --------------------------------------------------------

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
                "Google Sign-In verification failed."
            ),
        )

    # --------------------------------------------------------
    # Extract email
    # --------------------------------------------------------

    email = _normalise_email(
        str(
            google_user.get(
                "email",
                "",
            )
        )
    )

    # --------------------------------------------------------
    # Verify Google email
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Get Google user's name
    # --------------------------------------------------------

    name = str(
        google_user.get("name")
        or google_user.get("given_name")
        or email.split("@", 1)[0]
    ).strip()

    if not name:
        name = email.split("@", 1)[0]

    # --------------------------------------------------------
    # Find existing user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    is_new_user = user is None

    # --------------------------------------------------------
    # Create Google user
    # --------------------------------------------------------

    if user is None:

        user = User(
            full_name=name,
            email=email,
            hashed_password=hash_password(
                secrets.token_urlsafe(48)
            ),
        )

        db.add(user)

        db.commit()
        db.refresh(user)

    # --------------------------------------------------------
    # Welcome email for new Google account
    # --------------------------------------------------------

    if is_new_user:

        background_tasks.add_task(
            send_welcome_email,
            user.full_name,
            user.email,
        )

    # --------------------------------------------------------
    # Login email
    # --------------------------------------------------------

    background_tasks.add_task(
        send_login_email,
        user.full_name,
        user.email,
    )

    # --------------------------------------------------------
    # Return JWT
    # --------------------------------------------------------

    return _create_access_response(
        user
    )


# ============================================================
# OAUTH2 PASSWORD LOGIN DISABLED
# ============================================================

@router.post("/login/oauth")
def login_oauth_disabled(
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """
    Swagger/OAuth2 password authentication is disabled.
    """

    raise HTTPException(
        status_code=410,
        detail=(
            "Password login is disabled. "
            "Use email verification codes."
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
    """
    Update user's profile.

    Email cannot be changed directly because email is the
    authentication identity. A separate email verification
    flow should be used for email changes.
    """

    full_name = profile.full_name.strip()

    email = _normalise_email(
        str(profile.email)
    )

    # --------------------------------------------------------
    # Validate name
    # --------------------------------------------------------

    if not full_name:

        raise HTTPException(
            status_code=400,
            detail=(
                "Full name cannot be empty."
            ),
        )

    # --------------------------------------------------------
    # Prevent unverified email changes
    # --------------------------------------------------------

    if email != current_user.email:

        raise HTTPException(
            status_code=400,
            detail=(
                "Email changes require a fresh "
                "verification-code flow and cannot "
                "be changed from profile settings."
            ),
        )

    # --------------------------------------------------------
    # Update profile
    # --------------------------------------------------------

    current_user.full_name = full_name

    db.commit()
    db.refresh(current_user)

    return current_user


# ============================================================
# CHANGE PASSWORD DISABLED
# ============================================================

@router.put("/password")
def change_password_disabled(
    password_data: PasswordChange,
):
    """
    Password authentication is disabled.

    Kept as a compatibility endpoint so old frontend/API
    calls receive a clear response rather than breaking
    unpredictably.
    """

    raise HTTPException(
        status_code=410,
        detail=(
            "Password authentication is disabled. "
            "Critiqon uses email verification codes."
        ),
    )