import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import SessionLocal, init_db
from app.core.seed import seed_initial_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("darukaa.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown routines."""
    logger.info("Initializing Darukaa.Earth database tables...")
    try:
        init_db()
        db = SessionLocal()
        try:
            seed_initial_data(db)
        finally:
            db.close()
        logger.info("Database initialized and flagship projects seeded successfully.")
    except Exception as e:
        logger.error(f"Error during startup database initialization: {e}", exc_info=True)

    yield

    logger.info("Shutting down Darukaa.Earth backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Darukaa.Earth — Geospatial Carbon & Biodiversity Analytics Platform API.\n\n"
        "Provides RESTful endpoints for JWT authentication, project portfolio management, "
        "geospatial site polygon storage with PostGIS, and ecological time-series metrics."
    ),
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
origins = settings.BACKEND_CORS_ORIGINS
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Convert domain ValueError to standard 400 response."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


@app.get("/")
def root():
    return {
        "platform": "Darukaa.Earth",
        "tagline": "Geospatial Carbon & Biodiversity Analytics",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "version": "1.0.0",
    }
