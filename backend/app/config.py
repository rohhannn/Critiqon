from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

# Load the backend .env deterministically, independent of the shell's CWD.
load_dotenv(ENV_FILE, override=False)


def env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip()


DATABASE_URL = env("DATABASE_URL")
SECRET_KEY = env("SECRET_KEY")
ALGORITHM = env("ALGORITHM", "HS256") or "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(env("ACCESS_TOKEN_EXPIRE_MINUTES", "30") or "30")
OPENAI_API_KEY = env("OPENAI_API_KEY")
OPENAI_MODEL = env("OPENAI_MODEL", "gpt-4.1-mini") or "gpt-4.1-mini"
GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID")
RAZORPAY_KEY_ID = env("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = env("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = env("RAZORPAY_WEBHOOK_SECRET")
CLOUDINARY_CLOUD_NAME = env("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = env("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = env("CLOUDINARY_API_SECRET")
STORAGE_PROVIDER = (env("STORAGE_PROVIDER", "local") or "local").lower()
RESEND_API_KEY = env("RESEND_API_KEY")
EMAIL_FROM = env("EMAIL_FROM")
APP_NAME = env("APP_NAME", "Critiqon") or "Critiqon"
FRONTEND_URL = env("FRONTEND_URL", "http://localhost:5173") or "http://localhost:5173"
AUTO_CREATE_TABLES = (env("AUTO_CREATE_TABLES", "false") or "false").lower() == "true"
CORS_ORIGINS = [
    item.strip()
    for item in (env("CORS_ORIGINS", FRONTEND_URL) or "").split(",")
    if item.strip()
]

if not CORS_ORIGINS:
    raise RuntimeError("CORS_ORIGINS must contain at least one trusted frontend origin.")

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def require_database() -> str:
    if not DATABASE_URL:
        raise RuntimeError(f"DATABASE_URL is not configured. Expected it in: {ENV_FILE}")
    return DATABASE_URL


def require_secret_key() -> str:
    placeholder_values = {
        "",
        "your_super_secret_key_change_this",
        "replace-with-a-long-random-secret",
        "your_secret_key",
    }
    if not SECRET_KEY or SECRET_KEY.strip().lower() in placeholder_values:
        raise RuntimeError(f"SECRET_KEY must be configured in: {ENV_FILE}")
    return SECRET_KEY
