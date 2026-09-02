# Critiqon passwordless email OTP setup

## Files to replace

- backend/app/routes/auth.py
- backend/app/services/email_service.py
- backend/app/models.py
- backend/alembic/versions/20260831_add_email_otp_auth.py
- frontend/src/pages/Login/Login.tsx
- frontend/src/pages/Login/Login.css

## Database

From `backend/` run:

    alembic upgrade head

The migration creates the `email_otps` table. It does not delete existing users, resumes, subscriptions, or payment history.

## Resend

The current `onboarding@resend.dev` sender is only suitable for Resend's restricted testing flow. For real users, verify a domain in Resend and use a From address on that verified domain.

Example:

    EMAIL_FROM=Critiqon <auth@critiqon.com>

Do not commit `RESEND_API_KEY` to Git.

## Login flow

1. User enters email.
2. Backend generates a random 6-digit OTP.
3. OTP is stored only as a keyed hash with a 10-minute expiry.
4. User receives the OTP by email.
5. User enters the OTP.
6. Backend verifies it with a 5-attempt limit.
7. Existing users receive a JWT.
8. First-time verified emails automatically create a Critiqon account.
9. A login notification is sent after successful verification.

## Purchase emails

The existing Razorpay payment verification/webhook already sends both:

- plan activation email
- payment receipt email

Those emails go to the authenticated user's verified email address. Once Resend is configured with a verified sending domain, they can be delivered to real customers.

## Frontend

The login page no longer uses a password. Google Sign-In remains available as a separate verified-login option.

## Important

If you already have a production database, run the Alembic migration before deploying the new backend. Do not delete or recreate the `users` table.
