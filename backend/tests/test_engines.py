import pytest
from backend.app.recovery.engine import recovery_engine
from backend.app.ripple.engine import ripple_engine
from backend.app.advisory.engine import advisory_engine
from backend.app.ml.predictor import predictor

def test_recovery_normal_clearing():
    road = {
        "lanes": 3,
        "capacity_vph": 3000.0,
        "peak_capacity_factor": 1.0,
        "congestion_index": 0.2
    }
    incident = {
        "lanes_blocked": 1,
        "severity": 2,
        "queue_length_veh": 300.0
    }
    res = recovery_engine.calculate_recovery("R0001", road, incident, arrival_override=1000.0)
    assert res["status"] == "recovering"
    assert res["estimated_recovery_minutes"] is not None
    assert res["estimated_recovery_minutes"] > 0

def test_recovery_requires_intervention():
    road = {
        "lanes": 2,
        "capacity_vph": 1500.0,
        "peak_capacity_factor": 1.0,
        "congestion_index": 0.8
    }
    incident = {
        "lanes_blocked": 2, # All lanes blocked
        "severity": 3,
        "queue_length_veh": 500.0
    }
    res = recovery_engine.calculate_recovery("R0002", road, incident, arrival_override=1200.0)
    assert res["status"] == "requires_intervention"
    assert res["estimated_recovery_minutes"] is None
    assert "exceeds effective" in res["explanation"]

def test_ripple_engine_spillover():
    # If network graph has segments
    if ripple_engine.segment_map:
        seg_id = list(ripple_engine.segment_map.keys())[0]
        telemetry = {
            "speed_kmh": 15.0,
            "congestion_index": 0.85,
            "queue_length_veh": 450.0
        }
        res = ripple_engine.predict_ripple(seg_id, telemetry)
        assert "affected_segments" in res
        assert "total_impacted_length_km" in res

def test_predictor_forecast():
    sample_road = {
        "segment_id": "R0001",
        "speed_kmh": 40.0,
        "flow_vph": 800.0,
        "congestion_index": 0.2,
        "capacity_vph": 2000.0,
        "lanes": 2,
        "free_flow_speed_kmh": 50.0,
        "road_class": "collector"
    }
    res = predictor.predict(sample_road)
    assert "forecast" in res
    assert "15m" in res["forecast"]
    assert "30m" in res["forecast"]
    assert "45m" in res["forecast"]
    assert "60m" in res["forecast"]
    assert res["forecast"]["15m"]["level"] in ["green", "yellow", "orange", "red"]
