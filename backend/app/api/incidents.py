from typing import List
from fastapi import APIRouter, HTTPException, Depends
from backend.app.services.simulation_service import simulation_service
from backend.app.services.auth_service import require_role
from backend.app.schemas import IncidentCreate, IncidentResponse
from backend.app.websocket.manager import ws_manager

router = APIRouter(prefix="/incidents", tags=["Incidents & Bottlenecks"])

@router.get("", response_model=List[IncidentResponse])
def list_incidents():
    """Returns all active traffic incidents in the city."""
    return list(simulation_service.active_incidents.values())

@router.post("", response_model=IncidentResponse)
async def create_incident(
    inc_in: IncidentCreate,
    _user = Depends(require_role(["operator", "admin", "viewer"]))
):
    """
    Creates or simulates an incident on a road segment.
    Saves to DB, triggers immediate state recalculation, and broadcasts via WebSockets.
    """
    incident = simulation_service.inject_incident(
        segment_id=inc_in.segment_id,
        incident_type=inc_in.incident_type,
        severity=inc_in.severity,
        lanes_blocked=inc_in.lanes_blocked,
        description=inc_in.description
    )

    # Broadcast to all connected devices in near real-time
    await ws_manager.broadcast("incident_created", incident)

    return incident

@router.post("/{incident_id}/clear", response_model=IncidentResponse)
async def clear_incident(
    incident_id: str,
    _user = Depends(require_role(["operator", "admin", "viewer"]))
):
    """Clears an incident and broadcasts network recovery update."""
    cleared = simulation_service.clear_incident(incident_id)
    if not cleared:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    await ws_manager.broadcast("incident_cleared", cleared)
    return cleared
