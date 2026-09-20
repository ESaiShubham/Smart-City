from fastapi import APIRouter
from backend.app.services.simulation_service import simulation_service
from backend.app.schemas import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Command Center Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary():
    """Returns top-level command center KPIs for Hyderabad traffic operations."""
    summary = simulation_service.get_summary()
    return summary
