from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Authentication schemas
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "viewer"

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Node & Road Schemas
class NodeSchema(BaseModel):
    node_id: str
    x: float
    y: float
    lat: float
    lon: float
    name: Optional[str] = None

    class Config:
        from_attributes = True

class RoadSchema(BaseModel):
    segment_id: str
    source_node: str
    target_node: str
    road_class: str
    lanes: int
    free_flow_speed_kmh: float
    capacity_vph: float
    length_km: float
    grade_pct: Optional[float] = 0.0
    structural_bottleneck: int
    importance: float
    peak_capacity_factor: float
    name: Optional[str] = None

    class Config:
        from_attributes = True

# Traffic Observation & Current Status Schemas
class TrafficObservationSchema(BaseModel):
    timestamp: datetime
    segment_id: str
    speed_kmh: float
    flow_vph: float
    occupancy_pct: float
    travel_time_min: float
    free_flow_time_min: float
    delay_min: float
    queue_length_veh: float
    congestion_index: float
    sensor_quality: float

    class Config:
        from_attributes = True

class CurrentRoadStatus(BaseModel):
    segment_id: str
    name: Optional[str] = None
    road_class: str
    lanes: int
    capacity_vph: float
    free_flow_speed_kmh: float
    current_speed_kmh: float
    current_flow_vph: float
    occupancy_pct: float
    queue_length_veh: float
    delay_min: float
    congestion_index: float
    level: str # green, yellow, orange, red
    active_incident: Optional[bool] = False
    incident_details: Optional[Dict[str, Any]] = None
    source_node: str
    target_node: str
    source_lat: float
    source_lon: float
    target_lat: float
    target_lon: float

# Forecast Schemas
class HorizonForecast(BaseModel):
    horizon_minutes: int
    predicted_speed_kmh: float
    predicted_flow_vph: float
    predicted_congestion_index: float
    level: str
    status_label: str
    confidence: float

class ForecastResponse(BaseModel):
    segment_id: str
    generated_at: datetime
    current_speed_kmh: float
    current_congestion: float
    current_level: str
    forecast: Dict[str, HorizonForecast] # "15m", "30m", "45m", "60m"
    confidence: Dict[str, float]
    model_type: str = "XGBoost Multi-Horizon Forecaster v2"

# Incident Schemas
class IncidentCreate(BaseModel):
    segment_id: str
    incident_type: Optional[str] = "lane_blockage" # lane_blockage, stalled_vehicle, accident_like
    severity: Optional[int] = 2
    lanes_blocked: Optional[int] = 1
    description: Optional[str] = None

class IncidentResponse(BaseModel):
    incident_id: str
    segment_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    incident_type: str
    severity: int
    lanes_blocked: int
    status: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Recovery Schemas
class RecoveryResponse(BaseModel):
    segment_id: str
    timestamp: datetime
    queue_length_veh: float
    effective_capacity_vph: float
    arrival_rate_vph: float
    net_clearing_rate_vph: float
    estimated_recovery_minutes: Optional[float]
    status: str # recovering, requires_intervention, cleared
    confidence: float
    explanation: str

# Ripple Schemas
class RippleAffectedSegment(BaseModel):
    segment_id: str
    target_node: str
    road_class: str
    risk: str # low, medium, high, critical
    estimated_arrival_minutes: float
    predicted_congestion: float
    cascade_level: int
    available_capacity_vph: float

class RippleResponse(BaseModel):
    source_segment: str
    current_congestion: float
    affected_segments: List[RippleAffectedSegment]
    total_impacted_length_km: float
    cascade_summary: str

# Advisory & Diversion Schemas
class AdvisoryResponse(BaseModel):
    segment_id: str
    generated_at: datetime
    severity: str # info, warning, critical
    headline: str
    bullet_points: List[str]
    ripple_warning: Optional[str]
    recommended_diversion: Optional[Dict[str, Any]]
    disclaimer: str = "Decision-support simulation advisory only. Not a direct signal actuator."

class DiversionRecommendationResponse(BaseModel):
    segment_id: str
    primary_route_blocked: bool
    recommended_route: List[str]
    alternative_routes: List[List[str]]
    reason: str
    expected_travel_time_min: float
    baseline_travel_time_min: float
    time_saved_min: float

# What-If Simulation Schemas
class SimulationModification(BaseModel):
    segment_id: str
    lanes_delta: Optional[int] = 0 # e.g. -1 for lane closure
    capacity_multiplier: Optional[float] = 1.0 # e.g. 0.5 for 50% capacity
    is_closed: Optional[bool] = False
    demand_multiplier: Optional[float] = 1.0

class SimulationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    modifications: List[SimulationModification]

class SimulationResponse(BaseModel):
    simulation_id: str
    name: str
    created_at: datetime
    baseline: Dict[str, Any]
    scenario: Dict[str, Any]
    delta: Dict[str, Any]
    newly_stressed_segments: List[str]

# Dashboard Summary Schema
class DashboardSummary(BaseModel):
    timestamp: datetime
    active_incidents_count: int
    critical_roads_count: int
    average_congestion_index: float
    average_speed_kmh: float
    spillover_risk_roads_count: int
    simulation_status: str
    simulation_speed: float
    city: str
