import os

# Load environment variables natively from .env if present
_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(_env_path):
    with open(_env_path, "r", encoding="utf-8") as _f:
        for _line in _f:
            if "=" in _line and not _line.strip().startswith("#"):
                _k, _v = _line.strip().split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.database import engine, Base
from backend.routes import auth, documents, analysis, reports, audit, analytics, ai, users, admin
from backend.seed_data import seed_database

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Ensure uploads directory structure exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
for sub in ["documents", "forensics", "faces", "samples"]:
    os.makedirs(os.path.join(UPLOAD_DIR, sub), exist_ok=True)

# Run seeding on startup
try:
    seed_database()
except Exception as e:
    print(f"[TRUSTID Startup] Database seed note: {e}")

app = FastAPI(
    title="TRUSTID API",
    description="Secure Digital Document & Identity Screening System - Trust AI Multimodal Intelligence",
    version="1.0.0"
)

# CORS Configuration
default_origins = [
    "https://trust-id-sigma.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
_cors_env = os.getenv("CORS_ORIGINS", "")
if _cors_env:
    for orig in _cors_env.split(","):
        o = orig.strip()
        if o and o not in default_origins:
            default_origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include feature routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(analysis.router)
app.include_router(ai.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(analytics.router)
app.include_router(users.router)
app.include_router(admin.router)

@app.get("/health")
def health():
    """Standard deployment health check endpoint."""
    return {"status": "ok"}

@app.get("/api/health")
def health_check():
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    key_configured = bool(gemini_key and gemini_key != "your_actual_gemini_api_key")
    db_type = "PostgreSQL" if "postgres" in os.getenv("DATABASE_URL", "") else "SQLite / SQLAlchemy ORM"
    return {
        "status": "healthy",
        "system": "TRUSTID Secure Digital Document & Identity Screening System",
        "version": "1.0.0",
        "model": "Trust AI Neural Engine",
        "trust_ai_status": "Connected" if key_configured else "Not Configured",
        "database": db_type
    }

# Mount frontend production build if present to serve directly on port 8000
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static_assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            return {"detail": "Not Found"}
        target_file = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "name": "TRUSTID API",
            "tagline": "AI-powered document intelligence for faster, explainable and secure verification.",
            "documentation": "/docs"
        }
