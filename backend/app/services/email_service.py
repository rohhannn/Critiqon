from html import escape

import httpx

from ..config import APP_NAME, EMAIL_FROM, FRONTEND_URL, RESEND_API_KEY


# =========================================================
# EMAIL CONFIGURATION
# =========================================================

def email_configured() -> bool:
    return bool(
        RESEND_API_KEY
        and EMAIL_FROM
    )


# =========================================================
# SEND EMAIL
# =========================================================

def send_email(
    to: str,
    subject: str,
    html: str,
) -> bool:
    """
    Send transactional email through Resend.

    Email failures do not break the main application flow.
    """

    if not email_configured():

        print(
            "Email service is not configured; "
            f"skipping email to {to!r}."
        )

        return False

    try:

        response = httpx.post(

            "https://api.resend.com/emails",

            headers={
                "Authorization":
                    f"Bearer {RESEND_API_KEY}",

                "Content-Type":
                    "application/json",
            },

            json={

                "from":
                    EMAIL_FROM,

                "to":
                    [to],

                "subject":
                    subject,

                "html":
                    html,
            },

            timeout=15.0,
        )


        # =================================================
        # RESEND ERROR DEBUGGING
        # =================================================

        if response.status_code >= 400:

            print("")
            print("========================================")
            print("RESEND EMAIL ERROR")
            print("========================================")
            print(
                "STATUS:",
                response.status_code,
            )
            print(
                "RESPONSE:",
                response.text,
            )
            print(
                "TO:",
                to,
            )
            print(
                "FROM:",
                EMAIL_FROM,
            )
            print("========================================")
            print("")

            return False


        response.raise_for_status()


        print(
            f"Email sent successfully to {to!r}"
        )


        return True


    except Exception as error:

        print("")
        print("========================================")
        print("EMAIL DELIVERY ERROR")
        print("========================================")
        print(
            "TYPE:",
            type(error).__name__,
        )
        print(
            "ERROR:",
            repr(error),
        )
        print("========================================")
        print("")

        return False


# =========================================================
# HTML EMAIL LAYOUT
# =========================================================

def _layout(
    title: str,
    body: str,
) -> str:

    return f"""
<!doctype html>

<html>

<body
    style="
        margin:0;
        background:#f5f7f3;
        font-family:Arial,sans-serif;
        color:#17201a;
    "
>

    <div
        style="
            max-width:620px;
            margin:32px auto;
            padding:0 16px;
        "
    >

        <div
            style="
                background:#4F46E5;
                color:#fff;
                padding:20px 24px;
                border-radius:14px 14px 0 0;
            "
        >

            <strong
                style="
                    font-size:20px;
                "
            >
                {escape(APP_NAME)}
            </strong>

        </div>


        <div
            style="
                background:#fff;
                padding:28px 24px;
                border-radius:0 0 14px 14px;
            "
        >

            <h1
                style="
                    margin-top:0;
                    font-size:24px;
                "
            >
                {escape(title)}
            </h1>

            {body}


            <p
                style="
                    margin-top:28px;
                    color:#64748b;
                    font-size:13px;
                "
            >
                This is an automated message from
                {escape(APP_NAME)}.
            </p>

        </div>

    </div>

</body>

</html>
"""


# =========================================================
# WELCOME EMAIL
# =========================================================

def send_welcome_email(
    name: str,
    email: str,
) -> bool:

    safe_name = escape(name)

    return send_email(

        email,

        f"Welcome to {APP_NAME}",

        _layout(

            f"Welcome to {APP_NAME}",

            f"""

            <p>
                Hi {safe_name},
            </p>

            <p>
                Your account has been created successfully.
            </p>

            <p>
                You can now upload your resume,
                check your ATS score, and use the
                features available on your plan.
            </p>

            <p>

                <a
                    href="{escape(FRONTEND_URL)}"

                    style="
                        display:inline-block;
                        padding:11px 18px;
                        background:#4F46E5;
                        color:#fff;
                        text-decoration:none;
                        border-radius:8px;
                    "
                >
                    Open Critiqon
                </a>

            </p>

            """,
        ),
    )


# =========================================================
# LOGIN EMAIL
# =========================================================

def send_login_email(
    name: str,
    email: str,
) -> bool:

    safe_name = escape(name)

    return send_email(

        email,

        f"New login to {APP_NAME}",

        _layout(

            "New login detected",

            f"""

            <p>
                Hi {safe_name},
            </p>

            <p>
                Your {escape(APP_NAME)}
                account was just signed in.
            </p>

            <p>
                If this was you, no action is required.
            </p>

            <p>
                If you do not recognize this login,
                change your password immediately and
                contact support.
            </p>

            """,
        ),
    )


# =========================================================
# SUBSCRIPTION ACTIVATED EMAIL
# =========================================================

def send_subscription_email(
    name: str,
    email: str,
    plan: str,
    expires_at,
) -> bool:

    safe_name = escape(name)

    safe_plan = escape(plan)


    # -----------------------------------------------------
    # Format datetime safely
    # -----------------------------------------------------

    if expires_at:

        if hasattr(
            expires_at,
            "strftime",
        ):

            expiry = expires_at.strftime(
                "%d %b %Y"
            )

        else:

            expiry = str(
                expires_at
            )

    else:

        expiry = "your subscription period"


    return send_email(

        email,

        f"{plan} plan activated - {APP_NAME}",

        _layout(

            f"{plan} plan activated",

            f"""

            <p>
                Hi {safe_name},
            </p>

            <p>
                Your
                <strong>
                    {safe_plan}
                </strong>
                plan is now active.
            </p>

            <p>
                Your plan is valid until
                <strong>
                    {escape(expiry)}
                </strong>.
            </p>

            <p>
                Your account permissions will
                update automatically.
            </p>

            <p>

                <a
                    href="{escape(FRONTEND_URL)}"

                    style="
                        display:inline-block;
                        padding:11px 18px;
                        background:#4F46E5;
                        color:#fff;
                        text-decoration:none;
                        border-radius:8px;
                    "
                >
                    Open Critiqon
                </a>

            </p>

            """,
        ),
    )


# =========================================================
# PAYMENT FAILED EMAIL
# =========================================================

def send_payment_failed_email(
    name: str,
    email: str,
) -> bool:

    return send_email(

        email,

        f"Payment failed - {APP_NAME}",

        _layout(

            "Payment failed",

            f"""

            <p>
                Hi {escape(name)},
            </p>

            <p>
                Your recent payment could not be completed.
            </p>

            <p>
                No paid plan was activated by this
                failed payment.
            </p>

            <p>
                You can try again from the Pricing page.
            </p>

            <p>

                <a
                    href="{escape(FRONTEND_URL)}/pricing"

                    style="
                        display:inline-block;
                        padding:11px 18px;
                        background:#4F46E5;
                        color:#fff;
                        text-decoration:none;
                        border-radius:8px;
                    "
                >
                    View Plans
                </a>

            </p>

            """,
        ),
    )

def send_payment_receipt_email(
    name: str,
    email: str,
    plan: str,
    amount_paise: int,
    order_id: str,
    payment_id: str,
    expires_at,
) -> bool:
    amount = f"₹{amount_paise / 100:,.2f}"
    expiry = (
        expires_at.strftime("%d %b %Y")
        if hasattr(expires_at, "strftime")
        else str(expires_at or "-")
    )
    return send_email(
        email,
        f"Payment receipt - {APP_NAME}",
        _layout(
            "Payment successful",
            f"""
            <p>Hi {escape(name)},</p>
            <p>Your payment was successfully captured and your <strong>{escape(plan)}</strong> plan is now active.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
              <tr><td style="padding:8px 0;color:#64748b;">Amount</td><td style="padding:8px 0;text-align:right;font-weight:700;">{escape(amount)}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Plan</td><td style="padding:8px 0;text-align:right;">{escape(plan)}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Order ID</td><td style="padding:8px 0;text-align:right;word-break:break-all;">{escape(order_id)}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Payment ID</td><td style="padding:8px 0;text-align:right;word-break:break-all;">{escape(payment_id)}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">Valid until</td><td style="padding:8px 0;text-align:right;">{escape(expiry)}</td></tr>
            </table>
            <p>Keep this email as your payment receipt. Your account access has been updated automatically.</p>
            <p><a href="{escape(FRONTEND_URL)}/dashboard" style="display:inline-block;padding:11px 18px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;">Open Critiqon</a></p>
            """,
        ),
    )


# =========================================================
# EMAIL OTP LOGIN
# =========================================================

def send_otp_email(
    email: str,
    otp: str,
    expires_minutes: int = 10,
) -> bool:
    safe_otp = escape(otp)

    return send_email(
        email,
        f"Your {APP_NAME} verification code",
        _layout(
            "Your verification code",
            f"""
            <p>Hello,</p>

            <p>Use the verification code below to sign in to your {escape(APP_NAME)} account:</p>

            <div style="margin:28px 0;text-align:center;">
                <span style="display:inline-block;padding:16px 24px;border-radius:12px;background:#f1f5f9;color:#111827;font-size:32px;letter-spacing:8px;font-weight:800;font-family:Arial,sans-serif;">
                    {safe_otp}
                </span>
            </div>

            <p>This code expires in <strong>{expires_minutes} minutes</strong>.</p>
            <p>If you did not request this code, you can safely ignore this email.</p>
            <p style="color:#64748b;font-size:13px;">Never share this code with anyone, including Critiqon support.</p>
            """,
        ),
    )
