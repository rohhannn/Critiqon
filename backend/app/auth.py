from passlib.context import CryptContext


# ============================================================
# PASSWORD HASHING
# ============================================================
#
# Critiqon now uses email OTP authentication.
#
# Password hashing is retained only because the existing
# User database model still contains a hashed_password field.
# New users receive a random unusable password value.
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    """
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a password against an existing bcrypt hash.

    Kept for compatibility with the existing application/database.
    Password-based login itself is disabled in routes/auth.py.
    """
    return pwd_context.verify(password, hashed_password)