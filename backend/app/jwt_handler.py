from datetime import UTC, datetime, timedelta

from jose import jwt

from .config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, require_secret_key

SECRET_KEY = require_secret_key()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
