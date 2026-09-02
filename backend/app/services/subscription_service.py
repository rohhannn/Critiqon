from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import User, Subscription


# =========================================================
# PLAN LEVELS
# =========================================================

PLAN_LEVELS = {
    "Free": 1,
    "Pro": 2,
    "Premium": 3,
}


# =========================================================
# NORMALIZE PLAN
# =========================================================

def normalize_plan(
    plan: str | None,
) -> str:

    if plan == "Premium":
        return "Premium"

    if plan == "Pro":
        return "Pro"

    return "Free"


# =========================================================
# GET EFFECTIVE PLAN
# =========================================================

def get_effective_plan(
    db: Session,
    user: User,
) -> str:

    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user.id
        )
        .first()
    )

    # -----------------------------------------------------
    # No subscription
    # -----------------------------------------------------

    if not subscription:
        return "Free"

    # -----------------------------------------------------
    # Subscription must be active
    # -----------------------------------------------------

    if subscription.status != "active":
        return "Free"

    # -----------------------------------------------------
    # Check expiry
    # -----------------------------------------------------

    if (
        subscription.expires_at
        and subscription.expires_at < datetime.utcnow()
    ):

        # Subscription has expired.
        # Immediately downgrade the effective plan.

        subscription.plan = "Free"
        subscription.status = "expired"

        db.commit()

        return "Free"

    # -----------------------------------------------------
    # Return active plan
    # -----------------------------------------------------

    return normalize_plan(
        subscription.plan
    )


# =========================================================
# CHECK PLAN ACCESS
# =========================================================

def has_plan_access(
    current_plan: str,
    required_plan: str,
) -> bool:

    current_level = PLAN_LEVELS.get(
        normalize_plan(current_plan),
        1,
    )

    required_level = PLAN_LEVELS.get(
        normalize_plan(required_plan),
        1,
    )

    return current_level >= required_level


# =========================================================
# REQUIRE PLAN
# =========================================================

def require_plan(
    db: Session,
    user: User,
    required_plan: str,
    feature_name: str,
) -> str:

    current_plan = get_effective_plan(
        db=db,
        user=user,
    )

    if not has_plan_access(
        current_plan=current_plan,
        required_plan=required_plan,
    ):

        raise HTTPException(
            status_code=403,
            detail={
                "code": "PLAN_REQUIRED",
                "feature": feature_name,
                "required_plan": required_plan,
                "current_plan": current_plan,
                "message": (
                    f"{feature_name} requires "
                    f"{required_plan} plan."
                ),
            },
        )

    return current_plan


# =========================================================
# INTERVIEW QUESTION LIMIT
# =========================================================

def get_interview_question_limit(
    plan: str,
) -> int:

    normalized_plan = normalize_plan(
        plan
    )

    # Premium
    if normalized_plan == "Premium":
        return 20

    # Pro
    if normalized_plan == "Pro":
        return 10

    # Free
    return 0