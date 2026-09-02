from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator


def _to_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [item.strip() for item in value.splitlines() if item.strip()]
    return []


class ResumeResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    ats_score: int | None = None
    model_config = ConfigDict(from_attributes=True)


class ResumeAnalysisResponse(BaseModel):
    id: int
    filename: str
    ats_score: int | None = None
    summary: str | None = None
    strengths: list[str] = []
    weaknesses: list[str] = []
    skills: list[str] = []
    missing_skills: list[str] = []
    suggestions: list[str] = []
    recommended_roles: list[str] = []
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator(
        "strengths",
        "weaknesses",
        "skills",
        "missing_skills",
        "suggestions",
        "recommended_roles",
        mode="before",
    )
    @classmethod
    def normalize_lists(cls, value: Any) -> list[str]:
        return _to_list(value)
