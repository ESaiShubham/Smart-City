import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="viewer", nullable=False) # admin, operator, viewer
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Node(Base):
    __tablename__ = "nodes"

    node_id = Column(String(20), primary_key=True, index=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    name = Column(String(100), nullable=True)

class Road(Base):
    __tablename__ = "roads"

    segment_id = Column(String(20), primary_key=True, index=True)
    source_node = Column(String(20), ForeignKey("nodes.node_id"), nullable=False)
    target_node = Column(String(20), ForeignKey("nodes.node_id"), nullable=False)
    road_class = Column(String(50), nullable=False)
    lanes = Column(Integer, default=2)
    free_flow_speed_kmh = Column(Float, default=50.0)
    capacity_vph = Column(Float, default=2000.0)
    length_km = Column(Float, default=1.0)
    grade_pct = Column(Float, default=0.0)
    signal_id = Column(String(20), nullable=True)
    structural_bottleneck = Column(Integer, default=0)
    importance = Column(Float, default=0.5)
    peak_capacity_factor = Column(Float, default=1.0)
    name = Column(String(100), nullable=True)

    source = relationship("Node", foreign_keys=[source_node])
    target = relationship("Node", foreign_keys=[target_node])

class TrafficObservation(Base):
    __tablename__ = "traffic_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    segment_id = Column(String(20), ForeignKey("roads.segment_id"), nullable=False, index=True)
    source_node = Column(String(20), nullable=True)
    target_node = Column(String(20), nullable=True)
    speed_kmh = Column(Float, nullable=False)
    flow_vph = Column(Float, nullable=False)
    occupancy_pct = Column(Float, nullable=False)
    travel_time_min = Column(Float, nullable=False)
    free_flow_time_min = Column(Float, nullable=False)
    delay_min = Column(Float, default=0.0)
    queue_length_veh = Column(Float, default=0.0)
    congestion_index = Column(Float, default=0.0)
    sensor_quality = Column(Float, default=1.0)

    road = relationship("Road")

    __table_args__ = (
        Index("ix_obs_time_segment", "timestamp", "segment_id"),
    )

class TrafficForecast(Base):
    __tablename__ = "traffic_forecasts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    segment_id = Column(String(20), ForeignKey("roads.segment_id"), nullable=False, index=True)
    horizon_minutes = Column(Integer, nullable=False) # 15, 30, 45, 60
    predicted_speed_kmh = Column(Float, nullable=False)
    predicted_flow_vph = Column(Float, nullable=False)
    predicted_congestion_index = Column(Float, nullable=False)
    predicted_level = Column(String(20), nullable=False) # free, moderate, heavy, critical
    confidence = Column(Float, default=0.85)

    road = relationship("Road")

    __table_args__ = (
        Index("ix_forecast_seg_horizon", "segment_id", "horizon_minutes"),
    )

class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(String(50), primary_key=True, index=True)
    segment_id = Column(String(20), ForeignKey("roads.segment_id"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=True)
    incident_type = Column(String(50), default="lane_blockage") # lane_blockage, stalled_vehicle, accident_like
    severity = Column(Integer, default=2) # 1: Minor, 2: Moderate, 3: Severe
    lanes_blocked = Column(Integer, default=1)
    status = Column(String(20), default="active", index=True) # active, cleared
    description = Column(Text, nullable=True)
    created_by = Column(String(50), nullable=True)

    road = relationship("Road")

class Roadwork(Base):
    __tablename__ = "roadworks"

    id = Column(String(50), primary_key=True, index=True)
    segment_id = Column(String(20), ForeignKey("roads.segment_id"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    lanes_reduced = Column(Integer, default=1)
    speed_limit_override = Column(Float, nullable=True)
    status = Column(String(20), default="active")

class TrafficContext(Base):
    __tablename__ = "traffic_context"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    temperature_c = Column(Float, default=25.0)
    rain_intensity = Column(Float, default=0.0)
    event_level = Column(Integer, default=0)
    event_id = Column(String(50), nullable=True)
    holiday_flag = Column(Integer, default=0)
    day_of_week = Column(Integer, default=0)
    hour = Column(Float, default=0.0)

class Advisory(Base):
    __tablename__ = "advisories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    segment_id = Column(String(20), ForeignKey("roads.segment_id"), nullable=False, index=True)
    severity = Column(String(20), default="info") # info, warning, critical
    message = Column(Text, nullable=False)
    affected_corridors = Column(JSON, nullable=True)
    recommended_action = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class RipplePrediction(Base):
    __tablename__ = "ripple_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    source_segment_id = Column(String(20), ForeignKey("roads.segment_id"), nullable=False, index=True)
    affected_segment_id = Column(String(20), ForeignKey("roads.segment_id"), nullable=False, index=True)
    risk_level = Column(String(20), default="medium") # low, medium, high
    estimated_arrival_minutes = Column(Float, nullable=False)
    predicted_congestion = Column(Float, nullable=False)
    cascade_depth = Column(Integer, default=1)

class RecoveryPrediction(Base):
    __tablename__ = "recovery_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    segment_id = Column(String(20), ForeignKey("roads.segment_id"), nullable=False, index=True)
    queue_length_veh = Column(Float, nullable=False)
    effective_capacity_vph = Column(Float, nullable=False)
    arrival_rate_vph = Column(Float, nullable=False)
    estimated_recovery_minutes = Column(Float, nullable=True)
    status = Column(String(30), default="recovering") # recovering, requires_intervention, cleared
    confidence = Column(Float, default=0.85)

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(String(50), nullable=True)
    modifications = Column(JSON, nullable=False) # list of road interventions, lane changes, closures
    description = Column(Text, nullable=True)

class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    simulation_id = Column(String(50), ForeignKey("simulations.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    baseline_metrics = Column(JSON, nullable=False)
    scenario_metrics = Column(JSON, nullable=False)
    delta_summary = Column(JSON, nullable=False)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    segment_id = Column(String(20), ForeignKey("roads.segment_id"), nullable=False, index=True)
    recommended_route = Column(JSON, nullable=False) # list of segment IDs
    alternative_routes = Column(JSON, nullable=True)
    reason = Column(Text, nullable=False)
    expected_travel_time_min = Column(Float, nullable=False)
    time_saved_min = Column(Float, default=0.0)

class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    payload = Column(JSON, nullable=False)
