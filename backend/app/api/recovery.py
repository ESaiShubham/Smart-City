from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.services.simulation_service import simulation_service
from backend.app.recovery.engine import recovery_engine
from backend.app.schemas import RecoveryResponse

router = APIRouter(prefix="/recovery", tags=["Incident Recovery-Time Prediction"])

@router.get("/{segment_id}", response_model=RecoveryResponse)
def get_recovery_prediction(
    segment_id: str,
    queue_length: Optional[float] = Query(None, description="Override queue length in vehicles for what-if exploration"),
    arrival_rate: Optional[float] = Query(None, description="Override arrival rate in vehicles/hour")
):
    """
    Computes deterministic recovery time:
    net clearing rate = effective capacity - arrival rate
    estimated recovery time = queue size / net clearing rate
    Identifies edge cases where arrival rate >= effective capacity ('requires_intervention').
    """
    road = simulation_service.get_road_status(segment_id)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road segment {segment_id} not found")

    incident = road.get("incident_details")
    res = recovery_engine.calculate_recovery(
        segment_id=segment_id,
        road=road,
        incident=incident,
        queue_override=queue_length,
        arrival_override=arrival_rate
    )
    return res
