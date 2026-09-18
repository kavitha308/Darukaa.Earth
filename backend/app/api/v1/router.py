from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, metrics, projects, sites

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(sites.router)
api_router.include_router(metrics.router)
