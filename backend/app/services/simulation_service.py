import os
import asyncio
import logging
import datetime
import pandas as pd
from typing import Dict, Any, List, Optional
from backend.app.config import settings
from backend.app.websocket.manager import ws_manager
from backend.app.ml.predictor import predictor
from backend.app.ripple.engine import ripple_engine
from backend.app.recovery.engine import recovery_engine
from backend.app.advisory.engine import advisory_engine
from backend.app.database import SessionLocal
from backend.app.models import Road, Node, Incident, TrafficObservation

logger = logging.getLogger("SimulationService")

class SimulationService:
    def __init__(self):
        self.is_running = False
        self.speed_multiplier = settings.SIMULATION_DEFAULT_SPEED
        self.step_seconds = settings.SIMULATION_STEP_SECONDS
        self.simulated_time = datetime.datetime(2026, 1, 16, 8, 0, 0)
        self.roads: Dict[str, Dict[str, Any]] = {}
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.active_incidents: Dict[str, Dict[str, Any]] = {}
        self.task: Optional[asyncio.Task] = None
        self.initialize_network()

    def initialize_network(self):
        """Loads nodes and roads into memory from DB or static CSV files."""
        # 1. Load nodes
        nodes_path = os.path.join(settings.DATA_DIR, "raw", "nodes.csv")
        if os.path.exists(nodes_path):
            nodes_df = pd.read_csv(nodes_path)
            for _, r in nodes_df.iterrows():
                nid = str(r["node_id"])
                self.nodes[nid] = {
                    "node_id": nid,
                    "x": float(r.get("x", 0)),
                    "y": float(r.get("y", 0)),
                    "lat": float(r.get("lat", 17.385)),
                    "lon": float(r.get("lon", 78.486)),
                    "name": f"Junction {nid}"
                }

        # 2. Load roads
        net_path = os.path.join(settings.DATA_DIR, "raw", "network.csv")
        if os.path.exists(net_path):
            net_df = pd.read_csv(net_path)
            for _, r in net_df.iterrows():
                sid = str(r["segment_id"])
                u = str(r["source_node"])
                v = str(r["target_node"])
                lanes = int(r.get("lanes", 2))
                free_speed = float(r.get("free_flow_speed_kmh", 50.0))
                capacity = float(r.get("capacity_vph", 2000.0))
                length_km = float(r.get("length_km", 1.0))
                road_class = str(r.get("road_class", "collector"))
                bottleneck = int(r.get("structural_bottleneck", 0))
                importance = float(r.get("importance", 0.5))
                peak_factor = float(r.get("peak_capacity_factor", 1.0))

                src_node = self.nodes.get(u, {"lat": 17.385, "lon": 78.486})
                tgt_node = self.nodes.get(v, {"lat": 17.385 + 0.01, "lon": 78.486 + 0.01})

                # Initial base telemetry
                initial_speed = free_speed * 0.85
                initial_flow = capacity * 0.40
                initial_congestion = 0.15

                self.roads[sid] = {
                    "segment_id": sid,
                    "source_node": u,
                    "target_node": v,
                    "source_lat": src_node["lat"],
                    "source_lon": src_node["lon"],
                    "target_lat": tgt_node["lat"],
                    "target_lon": tgt_node["lon"],
                    "road_class": road_class,
                    "lanes": lanes,
                    "free_flow_speed_kmh": free_speed,
                    "capacity_vph": capacity,
                    "length_km": length_km,
                    "structural_bottleneck": bottleneck,
                    "importance": importance,
                    "peak_capacity_factor": peak_factor,
                    "current_speed_kmh": round(initial_speed, 1),
                    "current_flow_vph": round(initial_flow, 1),
                    "occupancy_pct": 18.0,
                    "queue_length_veh": 0.0,
                    "delay_min": 0.0,
                    "congestion_index": initial_congestion,
                    "level": "green",
                    "active_incident": False,
                    "incident_details": None
                }

        # Seed preloaded hackathon scenario incident on R0360 (or first key)
        default_target = "R0360" if "R0360" in self.roads else list(self.roads.keys())[0]
        self.inject_incident(
            segment_id=default_target,
            incident_type="lane_blockage",
            severity=2,
            lanes_blocked=1,
            description="Initial telemetry demonstration incident"
        )
        logger.info(f"Initialized simulation network with {len(self.roads)} segments and {len(self.nodes)} nodes.")

    def inject_incident(
        self,
        segment_id: str,
        incident_type: str = "lane_blockage",
        severity: int = 2,
        lanes_blocked: int = 1,
        description: str = None
    ) -> Dict[str, Any]:
        """Injects or registers an incident, updating state & persisting to database."""
        inc_id = f"INC_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        incident_data = {
            "incident_id": inc_id,
            "segment_id": segment_id,
            "start_time": self.simulated_time,
            "end_time": None,
            "incident_type": incident_type,
            "severity": severity,
            "lanes_blocked": lanes_blocked,
            "status": "active",
            "description": description or f"{incident_type.replace('_', ' ').title()} blocking {lanes_blocked} lane(s)",
            "queue_length_veh": 320.0 * severity
        }
        self.active_incidents[inc_id] = incident_data

        # Update road state immediately
        if segment_id in self.roads:
            rd = self.roads[segment_id]
            rd["active_incident"] = True
            rd["incident_details"] = incident_data
            rd["incident_severity"] = severity
            rd["lanes_blocked"] = lanes_blocked
            rd["current_speed_kmh"] = max(8.0, rd["free_flow_speed_kmh"] * 0.35)
            rd["congestion_index"] = min(0.95, 0.72 + severity * 0.08)
            rd["queue_length_veh"] = incident_data["queue_length_veh"]
            rd["level"] = "red"

        # Persist to database
        try:
            db = SessionLocal()
            db_inc = Incident(
                incident_id=inc_id,
                segment_id=segment_id,
                start_time=self.simulated_time,
                incident_type=incident_type,
                severity=severity,
                lanes_blocked=lanes_blocked,
                status="active",
                description=description
            )
            db.merge(db_inc)
            db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Error persisting incident to DB: {e}")

        return incident_data

    def clear_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """Clears an active incident and restores road baseline flow."""
        inc = self.active_incidents.pop(incident_id, None)
        if not inc:
            return None

        inc["status"] = "cleared"
        inc["end_time"] = self.simulated_time
        seg_id = inc["segment_id"]

        if seg_id in self.roads:
            rd = self.roads[seg_id]
            rd["active_incident"] = False
            rd["incident_details"] = None
            rd["current_speed_kmh"] = rd["free_flow_speed_kmh"] * 0.75
            rd["congestion_index"] = 0.25
            rd["queue_length_veh"] = 0.0
            rd["level"] = "green"

        # Persist update to DB
        try:
            db = SessionLocal()
            db_inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
            if db_inc:
                db_inc.status = "cleared"
                db_inc.end_time = self.simulated_time
                db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Error updating incident in DB: {e}")

        return inc

    def get_road_status(self, segment_id: str) -> Optional[Dict[str, Any]]:
        return self.roads.get(segment_id)

    def get_all_road_statuses(self) -> List[Dict[str, Any]]:
        return list(self.roads.values())

    def get_summary(self) -> Dict[str, Any]:
        """Calculates global traffic command center KPIs."""
        total_roads = len(self.roads)
        critical_count = sum(1 for r in self.roads.values() if r["level"] in ["red", "orange"])
        avg_speed = sum(r["current_speed_kmh"] for r in self.roads.values()) / max(total_roads, 1)
        avg_cong = sum(r["congestion_index"] for r in self.roads.values()) / max(total_roads, 1)

        # Count spillover risk roads
        spillover_count = 0
        for inc in self.active_incidents.values():
            seg_id = inc["segment_id"]
            ripple_res = ripple_engine.predict_ripple(seg_id, self.roads.get(seg_id))
            spillover_count += len(ripple_res.get("affected_segments", []))

        return {
            "timestamp": self.simulated_time.isoformat(),
            "active_incidents_count": len(self.active_incidents),
            "critical_roads_count": critical_count,
            "average_congestion_index": round(avg_cong, 3),
            "average_speed_kmh": round(avg_speed, 1),
            "spillover_risk_roads_count": spillover_count,
            "simulation_status": "RUNNING" if self.is_running else "PAUSED",
            "simulation_speed": self.speed_multiplier,
            "city": settings.CITY_NAME
        }

    async def tick(self):
        """Advances simulation by one step (+5 minutes) and broadcasts to all devices."""
        self.simulated_time += datetime.timedelta(minutes=5)

        # Micro-fluctuations across network to simulate realistic traffic dynamic
        for sid, rd in self.roads.items():
            if not rd["active_incident"]:
                # Normal variation
                noise = (hash(sid + str(self.simulated_time)) % 7 - 3) * 0.5
                target_spd = rd["free_flow_speed_kmh"] * 0.85 + noise
                rd["current_speed_kmh"] = round(max(15.0, min(rd["free_flow_speed_kmh"], target_spd)), 1)
                rd["congestion_index"] = round(max(0.05, min(0.65, 1.0 - (rd["current_speed_kmh"] / rd["free_flow_speed_kmh"]))), 3)
                if rd["congestion_index"] < 0.25:
                    rd["level"] = "green"
                elif rd["congestion_index"] < 0.50:
                    rd["level"] = "yellow"
                else:
                    rd["level"] = "orange"

        summary = self.get_summary()

        # Broadcast event across WebSockets to all connected browsers/devices
        await ws_manager.broadcast("simulation_tick", {
            "summary": summary,
            "simulated_time": self.simulated_time.isoformat(),
            "active_incidents": list(self.active_incidents.values())
        })

    async def _run_loop(self):
        while self.is_running:
            try:
                await self.tick()
            except Exception as e:
                logger.error(f"Error in simulation tick: {e}")
            # sleep time adjusted by speed multiplier
            sleep_sec = max(0.5, self.step_seconds / max(0.1, self.speed_multiplier))
            await asyncio.sleep(sleep_sec)

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.task = asyncio.create_task(self._run_loop())
            logger.info("Simulation playback started.")

    def pause(self):
        self.is_running = False
        if self.task:
            self.task.cancel()
            self.task = None
        logger.info("Simulation playback paused.")

    def reset(self):
        self.pause()
        self.simulated_time = datetime.datetime(2026, 1, 16, 8, 0, 0)
        self.active_incidents.clear()
        self.initialize_network()
        logger.info("Simulation playback reset.")

    def set_speed(self, speed: float):
        self.speed_multiplier = max(0.5, min(10.0, speed))
        logger.info(f"Simulation speed set to: {self.speed_multiplier}x")

simulation_service = SimulationService()
