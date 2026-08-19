from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.session import engine
from app.database.base import Base
import os
from fastapi.staticfiles import StaticFiles
from app.routers import health_router, auth_router, users_router, patients_router, upload_router, predict_router, profile_router, admin_doctors_router

# Import all models to ensure DeclarativeBase registers them for table creation
import app.models  # noqa: F401


from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown events."""
    # Startup: create database tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            dialect_name = conn.dialect.name
            if dialect_name == "postgresql":
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS picture VARCHAR(512);"))
                await conn.execute(text("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;"))
            elif dialect_name == "mysql":
                try:
                    await conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR(255);"))
                except Exception:
                    pass
                try:
                    await conn.execute(text("ALTER TABLE users ADD COLUMN picture VARCHAR(512);"))
                except Exception:
                    pass
                try:
                    await conn.execute(text("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;"))
                except Exception:
                    pass
                try:
                    await conn.execute(text("ALTER TABLE doctor_profiles MODIFY COLUMN last_active_at DATETIME NULL;"))
                except Exception:
                    pass
        except Exception:
            pass
    yield
    # Shutdown: dispose of database engine connections
    await engine.dispose()


from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    errors = exc.errors()
    first_err = errors[0] if errors else {}
    msg = first_err.get("msg", "Validation error.")
    if msg.startswith("Value error, "):
        msg = msg.replace("Value error, ", "")
    field = str(first_err.get("loc", ["field"])[-1])
    return JSONResponse(
        status_code=400,
        content={"success": False, "message": msg, "field": field, "detail": msg}
    )

# Set up CORS middleware to allow all frontend origins & ports with credentials support
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "http://127.0.0.1",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routers (Supporting /api/v1, /api, and root /predict routes)
app.include_router(health_router)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(patients_router, prefix=settings.API_V1_STR)
app.include_router(upload_router, prefix=settings.API_V1_STR)
app.include_router(predict_router, prefix=settings.API_V1_STR)
app.include_router(profile_router, prefix=settings.API_V1_STR)
app.include_router(admin_doctors_router, prefix=settings.API_V1_STR)

# Aliases for /api prefix and root /predict routes
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(patients_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(predict_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(admin_doctors_router, prefix="/api")
app.include_router(predict_router)

# Mount uploads static directory for doctor photos and scans
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(os.path.join(uploads_dir, "avatars"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")






@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint redirect hint."""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": "/health"
    }
