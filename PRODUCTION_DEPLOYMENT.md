# Critiqon — Production Deployment

This package is intended to be deployed with a managed PostgreSQL database, durable resume storage, HTTPS, and server-side secrets.

## 1. Required services

- PostgreSQL
- OpenAI API
- Google Identity Services (optional if Google login is enabled)
- Razorpay
- Resend
- Cloudinary (recommended and used for production resume storage)

## 2. Environment variables

Copy the templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend

Set real values for:

```env
DATABASE_URL=postgresql://...
SECRET_KEY=<long-random-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
GOOGLE_CLIENT_ID=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...
EMAIL_FROM=Critiqon <noreply@your-domain.com>
APP_NAME=Critiqon
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com
AUTO_CREATE_TABLES=false
```

`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, Cloudinary API secret, OpenAI key, Resend key, database credentials, and `SECRET_KEY` must never be exposed to the frontend.

### Frontend

```env
VITE_API_URL=https://your-api-domain.com
VITE_GOOGLE_CLIENT_ID=...
```

Only public/client-safe values belong in `frontend/.env`.

## 3. Database migrations

Do not rely on `Base.metadata.create_all()` in production.

From the backend directory:

```bash
cd backend
python -m pip install -r requirements.txt
alembic upgrade head
```

Then start the API:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The migration chain now contains a baseline schema and a storage migration. Existing databases can be upgraded without recreating their tables.

## 4. Resume storage

Production uploads use Cloudinary when `STORAGE_PROVIDER=cloudinary`. The API refuses resume uploads if Cloudinary is explicitly selected but its credentials are missing or still placeholder values.

- PDFs are uploaded as authenticated raw assets.
- The database stores the Cloudinary asset key/version rather than relying on ephemeral server disk.
- Resume access still goes through the authenticated Critiqon API endpoint.
- The API returns a signed Cloudinary URL only after verifying the current user owns the resume.
- Existing local resumes remain readable through the legacy local-storage fallback.
- Local storage is intended for development only; it is not durable on most managed hosting platforms.

Do not deploy user-uploaded PDFs inside the application repository.

## 5. Razorpay

Use Razorpay Test Mode until the complete payment flow passes.

The public webhook endpoint is:

```text
https://your-api-domain.com/payments/webhook
```

Verify the webhook secret on the server. Never put the Razorpay secret in frontend environment variables.

Test:

- order creation
- successful payment
- signature verification
- captured-payment verification
- failed payment
- webhook signature rejection
- duplicate webhook delivery
- Pro → Premium upgrade
- expired subscription downgrade

## 6. Email

Resend is used for transactional email. Verify your sending domain before production and set `EMAIL_FROM` to a verified address.

## 7. Frontend build

```bash
cd frontend
npm ci
npm run lint
npm run build
```

Deploy `frontend/dist` to the static host of your choice.

## 8. Health check

Use:

```text
GET /health
```

The endpoint checks database connectivity.


## 8.1 Static-host SPA fallback

If the frontend is deployed to a static host, configure all application routes to serve `index.html` as the fallback document. Without this, refreshing `/dashboard`, `/resume-analysis`, or another client-side route can produce a hosting-level 404 even though React Router is configured correctly.

Do not deploy `frontend/.env`, `backend/.env`, `node_modules`, `venv`, `.git`, `dist`, or `backend/uploads` as part of the application artifact. The repository now includes `.env.example` templates for configuration discovery without secrets.

## 9. Pre-launch checklist

### Authentication
- registration works
- duplicate email is rejected
- login works
- invalid credentials are rejected
- Google login is verified server-side
- password changes work
- profile changes work

### Resume
- only PDFs are accepted
- 10 MB limit works
- unreadable PDFs are rejected
- Cloudinary upload works
- preview works
- download works
- another user cannot access a resume by changing its ID

### Plans
- Free can use free features
- Pro unlocks Job Match, Cover Letter and Interview Prep
- Premium unlocks Reports
- backend blocks unauthorized paid endpoints even if the frontend is bypassed
- expired subscriptions downgrade to Free

### Payments
- amount and currency are verified server-side
- order notes are tied to the authenticated user
- payment signature is verified
- payment is confirmed as captured before activation
- duplicate webhook/verification does not duplicate activation
- failed payments do not unlock plans

### Deployment
- no real `.env` files in Git
- no API secrets in frontend source
- no `node_modules`, `venv`, `.git`, `dist`, or uploaded resumes in deployment artifacts
- HTTPS enabled
- PostgreSQL backups enabled
- production CORS contains only trusted frontend origins

## 8.2 Container deployment

The repository includes production-oriented `backend/Dockerfile` and `frontend/Dockerfile` files. The backend container runs migrations before starting Uvicorn; the frontend container serves the Vite build through Nginx with the required SPA fallback.

For the frontend image, provide `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` at build time. Do not place backend secrets in frontend build arguments or source files.
