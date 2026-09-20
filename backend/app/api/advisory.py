from fastapi import APIRouter, HTTPException
from backend.app.services.simulation_service import simulation_service
from backend.app.advisory.engine import advisory_engine
from backend.app.ml.predictor import predictor
from backend.app.recovery.engine import recovery_engine
from backend.app.ripple.engine import ripple_engine
from backend.app.schemas import AdvisoryResponse, DiversionRecommendationResponse

router = APIRouter(tags=["Advisories & Diversions"])

@router.get("/advisory/{segment_id}", response_model=AdvisoryResponse)
def get_advisory(segment_id: str):
    """
    Synthesizes current telemetry, ML forecast, recovery time, and ripple cascade
    into an explainable, human-readable operator advisory.
    """
    road = simulation_service.get_road_status(segment_id)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road segment {segment_id} not found")

    forecast_data = predictor.predict(road)
    recovery_data = recovery_engine.calculate_recovery(segment_id, road, road.get("incident_details"))
    ripple_data = ripple_engine.predict_ripple(segment_id, road)

    res = advisory_engine.generate_advisory(
        segment_id=segment_id,
        current_data=road,
        forecast_data=forecast_data,
        recovery_data=recovery_data,
        ripple_data=ripple_data,
        incident=road.get("incident_details")
    )
    return res

@router.get("/recommendations/{segment_id}", response_model=DiversionRecommendationResponse)
def get_diversion_recommendation(segment_id: str):
    """
    Calculates alternative route diversions around a congested or blocked segment
    using NetworkX path search with capacity-congestion impedance.
    """
    road = simulation_service.get_road_status(segment_id)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road segment {segment_id} not found")

    res = advisory_engine.recommend_diversion(
        segment_id=segment_id,
        incident=road.get("incident_details")
    )
    return res
