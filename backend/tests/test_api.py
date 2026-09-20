import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "city" in data

def test_dashboard_summary():
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "active_incidents_count" in data
    assert "average_speed_kmh" in data
    assert "average_congestion_index" in data

def test_roads_endpoint():
    response = client.get("/api/v1/roads")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "segment_id" in data[0]

def test_traffic_current():
    response = client.get("/api/v1/traffic/current")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_incident_create_and_clear():
    # 1. Create incident
    payload = {
        "segment_id": "R0001",
        "incident_type": "lane_blockage",
        "severity": 2,
        "lanes_blocked": 1,
        "description": "Test incident for pytest"
    }
    create_resp = client.post("/api/v1/incidents", json=payload)
    assert create_resp.status_code == 200
    inc_data = create_resp.json()
    inc_id = inc_data["incident_id"]
    assert inc_data["status"] == "active"

    # 2. Verify road has active incident
    road_resp = client.get("/api/v1/traffic/R0001")
    assert road_resp.status_code == 200
    road_data = road_resp.json()
    assert road_data["active_incident"] == True

    # 3. Clear incident
    clear_resp = client.post(f"/api/v1/incidents/{inc_id}/clear")
    assert clear_resp.status_code == 200
    clear_data = clear_resp.json()
    assert clear_data["status"] == "cleared"
