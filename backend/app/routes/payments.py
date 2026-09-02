import hashlib
import hmac
import json
from datetime import datetime, timedelta
from uuid import uuid4

import razorpay
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Subscription, User
from ..services.email_service import (
    send_payment_failed_email,
    send_payment_receipt_email,
    send_subscription_email,
)
from ..services.subscription_service import get_effective_plan, has_plan_access

router = APIRouter(prefix="/payments", tags=["Payments"])

PLANS = {
    "Pro": {"amount": 99, "duration_days": 30},
    "Premium": {"amount": 149, "duration_days": 30},
}


class CreateOrderRequest(BaseModel):
    plan: str


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


def _client():
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Razorpay payments are not configured on the server.")
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


def _get_subscription(db: Session, user_id: int, lock: bool = False):
    query = db.query(Subscription).filter(Subscription.user_id == user_id)
    if lock:
        query = query.with_for_update()
    return query.first()


def _activate_subscription(db: Session, subscription: Subscription, plan: str, payment_id: str) -> bool:
    if plan not in PLANS:
        raise ValueError("Invalid plan.")

    # Idempotency guard. Webhook + frontend verification may both arrive.
    if (
        subscription.status == "active"
        and subscription.plan == plan
        and subscription.razorpay_payment_id == payment_id
        and subscription.expires_at
        and subscription.expires_at > datetime.utcnow()
    ):
        return False

    now = datetime.utcnow()
    subscription.plan = plan
    subscription.status = "active"
    subscription.razorpay_payment_id = payment_id
    subscription.started_at = now
    subscription.expires_at = now + timedelta(days=PLANS[plan]["duration_days"])
    return True


def _validate_order(order: dict, plan: str, user_id: int) -> None:
    notes = order.get("notes") or {}
    if str(notes.get("user_id", "")) != str(user_id):
        raise HTTPException(status_code=400, detail="Payment does not belong to this account.")
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid payment plan.")
    expected_amount = PLANS[plan]["amount"] * 100
    if int(order.get("amount", 0)) != expected_amount or order.get("currency") != "INR":
        raise HTTPException(status_code=400, detail="Payment order details do not match the selected plan.")
    if str(notes.get("plan", "")) != plan:
        raise HTTPException(status_code=400, detail="Payment plan mismatch.")


@router.post("/create-order")
def create_order(request: CreateOrderRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = request.plan.strip()
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan.")

    current_plan = get_effective_plan(db=db, user=current_user)
    if has_plan_access(current_plan=current_plan, required_plan=plan):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "ALREADY_HAS_ACCESS",
                "message": f"You already have {current_plan} access.",
                "current_plan": current_plan,
                "requested_plan": plan,
            },
        )

    client = _client()
    amount_paise = PLANS[plan]["amount"] * 100
    try:
        order = client.order.create(
            data={
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"critiqon-{current_user.id}-{uuid4().hex[:20]}",
                "notes": {"user_id": str(current_user.id), "plan": plan},
            }
        )
    except Exception as error:
        print("Razorpay order creation error:", repr(error))
        raise HTTPException(status_code=502, detail="Unable to create payment order.")

    subscription = _get_subscription(db, current_user.id, lock=True)
    if not subscription:
        subscription = Subscription(user_id=current_user.id, plan="Free", status="active")
        db.add(subscription)
        db.flush()

    # Do NOT set an existing paid subscription to pending. A failed upgrade
    # must never revoke the user's currently active plan.
    subscription.razorpay_order_id = order["id"]
    subscription.razorpay_payment_id = None
    subscription.razorpay_signature = None
    db.commit()

    return {
        "key_id": RAZORPAY_KEY_ID,
        "order_id": order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "plan": plan,
        "user": {"name": current_user.full_name, "email": current_user.email},
    }


@router.post("/verify")
def verify_payment(
    request: VerifyPaymentRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = _client()
    subscription = _get_subscription(db, current_user.id, lock=True)
    if not subscription or subscription.razorpay_order_id != request.razorpay_order_id:
        raise HTTPException(status_code=400, detail="Invalid Razorpay order.")

    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": request.razorpay_order_id,
                "razorpay_payment_id": request.razorpay_payment_id,
                "razorpay_signature": request.razorpay_signature,
            }
        )
    except Exception:
        # A bad signature is not proof of a failed customer payment. Do not
        # send a misleading failure email for a request that may be forged.
        raise HTTPException(status_code=400, detail="Payment verification failed.")

    try:
        order = client.order.fetch(request.razorpay_order_id)
        payment = client.payment.fetch(request.razorpay_payment_id)
    except Exception as error:
        print("Razorpay verification fetch error:", repr(error))
        raise HTTPException(status_code=502, detail="Unable to verify payment status.")

    notes = order.get("notes") or {}
    purchased_plan = str(notes.get("plan", ""))
    _validate_order(order, purchased_plan, current_user.id)

    if payment.get("order_id") != subscription.razorpay_order_id:
        raise HTTPException(status_code=400, detail="Payment order mismatch.")

    captured = payment.get("captured") is True or str(payment.get("status", "")).lower() == "captured"
    if not captured:
        raise HTTPException(status_code=400, detail="Payment has not been captured yet.")

    changed = _activate_subscription(db, subscription, purchased_plan, request.razorpay_payment_id)
    subscription.razorpay_signature = request.razorpay_signature
    db.commit()
    db.refresh(subscription)

    if changed:
        background_tasks.add_task(
            send_subscription_email,
            current_user.full_name,
            current_user.email,
            subscription.plan,
            subscription.expires_at,
        )
        background_tasks.add_task(
            send_payment_receipt_email,
            current_user.full_name,
            current_user.email,
            subscription.plan,
            int(order.get("amount", 0)),
            subscription.razorpay_order_id,
            request.razorpay_payment_id,
            subscription.expires_at,
        )

    return {
        "message": "Payment verified successfully.",
        "plan": subscription.plan,
        "status": subscription.status,
        "expires_at": subscription.expires_at,
        "order_id": subscription.razorpay_order_id,
        "payment_id": request.razorpay_payment_id,
        "amount": int(order.get("amount", 0)),
        "currency": order.get("currency", "INR"),
    }


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    x_razorpay_signature: str | None = Header(default=None),
):
    if not RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Razorpay webhook secret is not configured.")
    raw_body = await request.body()
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing Razorpay webhook signature.")

    expected = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    try:
        payload = json.loads(raw_body.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid webhook payload.")

    event = payload.get("event", "")
    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    order_entity = payload.get("payload", {}).get("order", {}).get("entity", {})

    if event == "payment.failed":
        order_id = payment_entity.get("order_id")
        if order_id:
            subscription = db.query(Subscription).filter(Subscription.razorpay_order_id == order_id).first()
            if subscription and subscription.user:
                background_tasks.add_task(
                    send_payment_failed_email,
                    subscription.user.full_name,
                    subscription.user.email,
                )
        return {"status": "ok"}

    if event not in {"payment.captured", "order.paid"}:
        return {"status": "ignored"}

    order_id = payment_entity.get("order_id") if event == "payment.captured" else order_entity.get("id")
    payment_id = payment_entity.get("id") if event == "payment.captured" else order_entity.get("payment_id")
    if not order_id or not payment_id:
        return {"status": "ignored"}

    client = _client()
    try:
        order = client.order.fetch(order_id)
        payment = client.payment.fetch(payment_id)
    except Exception as error:
        print("Webhook Razorpay fetch error:", repr(error))
        raise HTTPException(status_code=500, detail="Unable to verify Razorpay webhook payment.")

    notes = order.get("notes") or {}
    try:
        user_id = int(notes.get("user_id"))
    except (TypeError, ValueError):
        return {"status": "ignored"}
    plan = str(notes.get("plan", ""))
    if plan not in PLANS:
        return {"status": "ignored"}

    try:
        _validate_order(order, plan, user_id)
    except HTTPException:
        return {"status": "ignored"}

    captured = payment.get("captured") is True or str(payment.get("status", "")).lower() == "captured"
    if not captured or payment.get("order_id") != order_id:
        return {"status": "ignored"}

    subscription = _get_subscription(db, user_id, lock=True)
    if not subscription or subscription.razorpay_order_id != order_id:
        return {"status": "ignored"}

    changed = _activate_subscription(db, subscription, plan, payment_id)
    db.commit()
    db.refresh(subscription)

    if changed and subscription.user:
        background_tasks.add_task(
            send_subscription_email,
            subscription.user.full_name,
            subscription.user.email,
            subscription.plan,
            subscription.expires_at,
        )
        background_tasks.add_task(
            send_payment_receipt_email,
            subscription.user.full_name,
            subscription.user.email,
            subscription.plan,
            int(order.get("amount", 0)),
            subscription.razorpay_order_id,
            payment_id,
            subscription.expires_at,
        )

    return {"status": "ok"}


@router.get("/subscription")
def get_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subscription = _get_subscription(db, current_user.id)
    if not subscription:
        return {"plan": "Free", "status": "active", "started_at": None, "expires_at": None}

    if subscription.expires_at and subscription.expires_at < datetime.utcnow() and subscription.status == "active":
        subscription.plan = "Free"
        subscription.status = "expired"
        subscription.razorpay_order_id = None
        db.commit()
        db.refresh(subscription)

    return {
        "plan": subscription.plan,
        "status": subscription.status,
        "started_at": subscription.started_at,
        "expires_at": subscription.expires_at,
    }
