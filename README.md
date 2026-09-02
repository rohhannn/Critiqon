# Critiqon

Critiqon is an AI-powered career preparation platform with resume analysis, ATS scoring, job matching, tailored cover letters, interview preparation, interview history and premium career reports.

## Local development

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend: `http://127.0.0.1:8000`
API docs: `http://127.0.0.1:8000/docs`

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Environment

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`. Never commit either `.env` file.

Required production integrations:

- PostgreSQL
- OpenAI
- Google Identity Services
- Razorpay
- Resend

## Plans

- **Free:** resume upload and resume analysis
- **Pro:** job matching, cover letters, interview preparation and history
- **Premium:** Pro features plus career reports and higher interview limits

The backend is the source of truth for plan access. Never rely on frontend plan checks for security.

## Production

Build the frontend with `npm run build` and run FastAPI behind HTTPS/reverse proxy. Configure Razorpay's public webhook at `/payments/webhook` and use live credentials only after the complete test-mode flow succeeds.
