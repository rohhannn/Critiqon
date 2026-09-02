from __future__ import annotations

from pathlib import Path
import time

import cloudinary
import cloudinary.uploader
from cloudinary.utils import private_download_url

from ..config import (
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME,
)


_PLACEHOLDER_VALUES = {
    "",
    "your_api_key",
    "your_api_secret",
    "your_cloud_name",
    "your_cloudinary_cloud_name",
    "your_cloudinary_api_key",
    "your_cloudinary_api_secret",
    "...",
}


def _is_real_credential(value: str | None) -> bool:
    if not value:
        return False
    return value.strip().lower() not in _PLACEHOLDER_VALUES


def cloudinary_configured() -> bool:
    return all(
        _is_real_credential(value)
        for value in (
            CLOUDINARY_CLOUD_NAME,
            CLOUDINARY_API_KEY,
            CLOUDINARY_API_SECRET,
        )
    )


def _configure() -> None:
    if not cloudinary_configured():
        raise RuntimeError("Cloudinary storage is not configured.")

    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_resume(file_path: Path, user_id: int, public_id: str) -> dict:
    """Upload a resume as an authenticated Cloudinary raw asset."""
    _configure()

    return cloudinary.uploader.upload(
        str(file_path),
        resource_type="raw",
        type="authenticated",
        public_id=public_id,
        overwrite=False,
        invalidate=True,
    )


def delete_resume(public_id: str) -> None:
    if not cloudinary_configured() or not public_id:
        return

    _configure()
    try:
        cloudinary.uploader.destroy(
            public_id,
            resource_type="raw",
            type="authenticated",
            invalidate=True,
        )
    except Exception:
        # Cleanup must never hide the original request/database error.
        pass


def signed_resume_url(
    public_id: str,
    version: int | str | None = None,
    expires_in: int = 300,
) -> str:
    """Return a short-lived signed download URL for an authenticated raw asset."""
    _configure()

    # Cloudinary's private_download_url expects the format separately.
    normalized_public_id = public_id[:-4] if public_id.lower().endswith(".pdf") else public_id

    return private_download_url(
        normalized_public_id,
        "pdf",
        resource_type="raw",
        type="authenticated",
        attachment=False,
        expires_at=int(time.time()) + expires_in,
        secure=True,
    )
