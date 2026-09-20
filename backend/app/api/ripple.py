from fastapi import APIRouter, HTTPException
from backend.app.services.simulation_service import simulation_service
from backend.app.ripple.engine import ripple_engine
from backend.app.schemas import RippleResponse

router = APIRouter(prefix="/ripple", tags=["Congestion Ripple & Spillover Prediction"])

@router.get("/{segment_id}", response_model=RippleResponse)
def get_ripple_prediction(segment_id: str):
    """
    Simulates graph-based downstream spillover across connected intersections.
    Ranks affected downstream road segments, estimated arrival minutes, and risk level.
    """
    road = simulation_service.get_road_status(segment_id)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road segment {segment_id} not found")

    res = ripple_engine.predict_ripple(segment_id, road)
    return res
