from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException
from backend.app.services.simulation_service import simulation_service
from backend.app.ml.predictor import predictor
from backend.app.schemas import CurrentRoadStatus, ForecastResponse

router = APIRouter(prefix="/traffic", tags=["Traffic Telemetry & Forecasting"])

@router.get("/current", response_model=List[CurrentRoadStatus])
def get_current_traffic():
    """Returns real-time or simulated traffic telemetry across the entire city grid."""
    return simulation_service.get_all_road_statuses()

@router.get("/{segment_id}", response_model=CurrentRoadStatus)
def get_segment_traffic(segment_id: str):
    """Returns current traffic status for a specific road segment."""
    road = simulation_service.get_road_status(segment_id)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road segment {segment_id} not found")
    return road

@router.get("/{segment_id}/forecast", response_model=ForecastResponse)
def get_segment_forecast(segment_id: str):
    """
    Returns multi-horizon traffic forecasts for +15, +30, +45, +60 minutes
    using trained XGBoost regression models.
    """
    road = simulation_service.get_road_status(segment_id)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road segment {segment_id} not found")

    pred_res = predictor.predict(road)

    return {
        "segment_id": segment_id,
        "generated_at": datetime.utcnow(),
        "current_speed_kmh": road["current_speed_kmh"],
        "current_congestion": road["congestion_index"],
        "current_level": road["level"],
        "forecast": pred_res["forecast"],
        "confidence": pred_res["confidence"],
        "model_type": pred_res["model_type"]
    }
