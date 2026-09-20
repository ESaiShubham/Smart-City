from fastapi import APIRouter
from backend.app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "city": settings.CITY_NAME,
        "disclaimer": "SIMULATION & DECISION SUPPORT MODE — NOT CONNECTED TO PHYSICAL SIGNALS"
    }
