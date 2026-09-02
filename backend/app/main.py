from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import text

from .config import APP_NAME, AUTO_CREATE_TABLES, CORS_ORIGINS
from .database import engine
from .models import Base
from .routes.auth import router as auth_router
from .routes import dashboard, interview, jobs, payments, reports, resume


# Production deployments should run `alembic upgrade head` before starting.
# The opt-in create_all fallback is kept for simple local development.
if AUTO_CREATE_TABLES:
    Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=f"{APP_NAME} API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(resume.router)
app.include_router(dashboard.router)
app.include_router(jobs.router)
app.include_router(interview.router)
app.include_router(reports.router)
app.include_router(payments.router)


@app.get("/")
def root():
    return {"message": f"Welcome to {APP_NAME} API"}


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "service": APP_NAME,
            "database": "ok",
        }

    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "service": APP_NAME,
                "database": "unavailable",
            },
        )


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    """
    Serve the application's existing SVG favicon when a browser
    requests the conventional /favicon.ico path.

    This prevents an unnecessary 404 in the API logs while keeping
    the existing frontend favicon unchanged.
    """

    favicon_path = (
        Path(__file__).resolve().parents[2]
        / "frontend"
        / "public"
        / "favicon.svg"
    )

    if favicon_path.exists():
        return FileResponse(
            favicon_path,
            media_type="image/svg+xml",
        )

    return JSONResponse(
        status_code=404,
        content={"detail": "Favicon not found"},
    )