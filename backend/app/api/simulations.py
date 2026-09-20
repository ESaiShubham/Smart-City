import uuid
import datetime
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Body
from backend.app.services.simulation_service import simulation_service
from backend.app.schemas import SimulationCreate, SimulationResponse

router = APIRouter(prefix="/simulations", tags=["What-If Counterfactual Simulations"])

@router.post("", response_model=SimulationResponse)
def evaluate_what_if_simulation(sim_in: SimulationCreate):
    """
    Evaluates a counterfactual What-If scenario (e.g. lane reduction, road closure,
    capacity change, or demand surge) and compares Baseline vs Scenario.
    """
    sim_id = f"SIM_{uuid.uuid4().hex[:8]}"

    # Baseline network metrics
    baseline_roads = simulation_service.roads
    baseline_avg_speed = sum(r["current_speed_kmh"] for r in baseline_roads.values()) / max(1, len(baseline_roads))
    baseline_avg_cong = sum(r["congestion_index"] for r in baseline_roads.values()) / max(1, len(baseline_roads))
    baseline_critical_count = sum(1 for r in baseline_roads.values() if r["level"] in ["red", "orange"])

    # Clone scenario
    scenario_avg_speed = baseline_avg_speed
    scenario_avg_cong = baseline_avg_cong
    newly_stressed = []

    for mod in sim_in.modifications:
        sid = mod.segment_id
        if sid in baseline_roads:
            base_rd = baseline_roads[sid]
            lanes = max(1, base_rd["lanes"] + mod.lanes_delta) if not mod.is_closed else 0
            cap_mult = 0.0 if mod.is_closed else (mod.capacity_multiplier or 1.0)
            eff_cap = base_rd["capacity_vph"] * (lanes / max(1, base_rd["lanes"])) * cap_mult

            # Stressed segment detection
            if eff_cap < base_rd["capacity_vph"] * 0.6 or mod.is_closed:
                newly_stressed.append(sid)

    # Calculate simulated scenario shift
    stress_ratio = len(newly_stressed) / max(1, len(baseline_roads))
    scenario_avg_speed = max(10.0, round(baseline_avg_speed * (1.0 - stress_ratio * 1.5), 1))
    scenario_avg_cong = min(0.95, round(baseline_avg_cong + stress_ratio * 0.8, 3))
    scenario_critical_count = baseline_critical_count + len(newly_stressed)

    baseline_metrics = {
        "average_speed_kmh": round(baseline_avg_speed, 1),
        "average_congestion_index": round(baseline_avg_cong, 3),
        "critical_segments_count": baseline_critical_count,
        "total_segments": len(baseline_roads)
    }

    scenario_metrics = {
        "average_speed_kmh": scenario_avg_speed,
        "average_congestion_index": scenario_avg_cong,
        "critical_segments_count": scenario_critical_count,
        "total_segments": len(baseline_roads)
    }

    delta_summary = {
        "speed_change_kmh": round(scenario_avg_speed - baseline_avg_speed, 1),
        "congestion_change": round(scenario_avg_cong - baseline_avg_cong, 3),
        "additional_critical_roads": len(newly_stressed)
    }

    return {
        "simulation_id": sim_id,
        "name": sim_in.name,
        "created_at": datetime.datetime.utcnow(),
        "baseline": baseline_metrics,
        "scenario": scenario_metrics,
        "delta": delta_summary,
        "newly_stressed_segments": newly_stressed
    }

@router.post("/control")
def control_simulation(action: str = Body(..., embed=True), speed: float = Body(1.0, embed=True)):
    """
    Controls live simulation clock playback:
    Actions: 'play', 'pause', 'reset', 'step', 'speed'
    """
    act = action.lower()
    if act == "play":
        simulation_service.start()
    elif act == "pause":
        simulation_service.pause()
    elif act == "reset":
        simulation_service.reset()
    elif act == "speed":
        simulation_service.set_speed(speed)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown simulation action: {action}")

    return {
        "status": "success",
        "action": act,
        "simulation_status": "RUNNING" if simulation_service.is_running else "PAUSED",
        "speed": simulation_service.speed_multiplier,
        "simulated_time": simulation_service.simulated_time.isoformat()
    }
