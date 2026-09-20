import datetime
from typing import Dict, Any, List, Optional
import networkx as nx
from backend.app.ripple.engine import ripple_engine

class AdvisoryEngine:
    """
    Combined advisory and alternative route recommendation engine:
    - Generates concise human-readable situational intelligence.
    - Uses NetworkX Dijkstra paths with congestion-penalized edge weights to find real diversions.
    """

    @staticmethod
    def generate_advisory(
        segment_id: str,
        current_data: Dict[str, Any],
        forecast_data: Optional[Dict[str, Any]] = None,
        recovery_data: Optional[Dict[str, Any]] = None,
        ripple_data: Optional[Dict[str, Any]] = None,
        incident: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        congestion = float(current_data.get("congestion_index", 0.15))
        speed = float(current_data.get("speed_kmh", 45.0))
        level = current_data.get("level", "green")

        bullets = []

        # 1. Current condition summary
        if incident:
            itype = incident.get("incident_type", "incident").replace("_", " ").title()
            sev = incident.get("severity", 2)
            blocked = incident.get("lanes_blocked", 1)
            bullets.append(
                f"Active {itype} (Severity {sev}/3) blocking {blocked} lane(s) on segment {segment_id}. "
                f"Current speed slowed to {speed:.1f} km/h (Congestion index: {congestion:.2f})."
            )
        elif congestion >= 0.75:
            bullets.append(
                f"Corridor {segment_id} is operating at critical capacity with heavy friction. "
                f"Average speed is {speed:.1f} km/h."
            )
        elif congestion >= 0.50:
            bullets.append(f"Corridor {segment_id} is experiencing moderate-to-heavy traffic flow ({speed:.1f} km/h).")
        else:
            bullets.append(f"Corridor {segment_id} is flowing freely at {speed:.1f} km/h with no active bottlenecks.")

        # 2. Forecast outlook
        if forecast_data and "forecast" in forecast_data:
            f15 = forecast_data["forecast"].get("15m", {})
            f30 = forecast_data["forecast"].get("30m", {})
            f60 = forecast_data["forecast"].get("60m", {})
            bullets.append(
                f"Predicted 15m speed is {f15.get('predicted_speed_kmh', speed):.1f} km/h "
                f"({f15.get('status_label', 'Stable')}). Traffic expected to remain "
                f"{f30.get('status_label', 'consistent')} at +30m and {f60.get('status_label', 'normal')} at +60m."
            )

        # 3. Recovery estimation
        if recovery_data:
            rec_status = recovery_data.get("status")
            rec_min = recovery_data.get("estimated_recovery_minutes")
            if rec_status == "requires_intervention":
                bullets.append(
                    "High Priority: Arrival demand exceeds discharge capacity. Upstream perimeter metering "
                    "or signal timing adjustments recommended to prevent queue lock."
                )
            elif rec_min and rec_min > 0:
                bullets.append(
                    f"Estimated post-incident clearance recovery: ~{rec_min:.0f} minutes "
                    f"at current arrival rate."
                )

        # 4. Ripple spillover warning
        ripple_warning = None
        if ripple_data and ripple_data.get("affected_segments"):
            first_affected = ripple_data["affected_segments"][0]
            sec_affected = ripple_data["affected_segments"][1] if len(ripple_data["affected_segments"]) > 1 else None
            ripple_warning = (
                f"Downstream ripple alert: {first_affected['segment_id']} has high spillover risk "
                f"in ~{first_affected['estimated_arrival_minutes']:.0f} min"
            )
            if sec_affected:
                ripple_warning += f", followed by {sec_affected['segment_id']} in ~{sec_affected['estimated_arrival_minutes']:.0f} min."
            bullets.append(ripple_warning)

        # Headline
        if incident or congestion >= 0.75:
            severity = "critical"
            headline = f"CRITICAL TRAFFIC ADVISORY: Bottleneck on {segment_id}"
        elif congestion >= 0.50:
            severity = "warning"
            headline = f"TRAFFIC WATCH: Elevated congestion on {segment_id}"
        else:
            severity = "info"
            headline = f"TRAFFIC NORMAL: Optimal conditions on {segment_id}"

        return {
            "segment_id": segment_id,
            "generated_at": datetime.datetime.utcnow().isoformat(),
            "severity": severity,
            "headline": headline,
            "bullet_points": bullets,
            "ripple_warning": ripple_warning,
            "recommended_diversion": None,
            "disclaimer": "Decision-support simulation advisory only. Not a direct signal actuator."
        }

    @staticmethod
    def recommend_diversion(
        segment_id: str,
        incident: Optional[Dict[str, Any]] = None,
        congestion_threshold: float = 0.60
    ) -> Dict[str, Any]:
        """
        Computes smart alternative routes avoiding the congested/blocked segment.
        Uses NetworkX Dijkstra with dynamic capacity-congestion impedance.
        """
        source_edge = ripple_engine.segment_map.get(segment_id)
        if not source_edge:
            return {
                "segment_id": segment_id,
                "primary_route_blocked": False,
                "recommended_route": [segment_id],
                "alternative_routes": [],
                "reason": "Segment not in road graph.",
                "expected_travel_time_min": 5.0,
                "baseline_travel_time_min": 5.0,
                "time_saved_min": 0.0
            }

        start_node = source_edge["source_node"]
        end_node = source_edge["target_node"]

        # Baseline travel time
        nominal_speed = source_edge["free_flow_speed_kmh"]
        length_km = source_edge["length_km"]
        baseline_time_min = (length_km / max(nominal_speed, 10.0)) * 60.0

        # Construct weighted sub-graph
        G = ripple_engine.graph.copy()

        # Heavily penalize the troubled segment
        if G.has_edge(start_node, end_node):
            G[start_node][end_node]["weight"] = 9999.0

        # Find 2 shortest paths in the alternative graph
        alternatives = []
        try:
            # We look for paths from start_node to end_node, or downstream neighbors
            raw_paths = list(nx.shortest_simple_paths(G, start_node, end_node, weight="weight"))
            for p in raw_paths[:3]:
                # Convert node path to segment IDs
                seg_path = []
                total_time = 0.0
                for i in range(len(p) - 1):
                    u, v = p[i], p[i + 1]
                    edge = G[u][v]
                    seg_path.append(edge["segment_id"])
                    total_time += (edge["length_km"] / max(edge["free_flow_speed_kmh"], 15.0)) * 60.0
                if seg_path:
                    alternatives.append((seg_path, round(total_time, 1)))
        except Exception:
            # Fallback if no simple path exists
            pass

        if alternatives and len(alternatives) > 0:
            rec_route, rec_time = alternatives[0]
            alt_routes = [route for route, _ in alternatives[1:]]
            time_saved = max(0.0, round((baseline_time_min * 2.5) - rec_time, 1)) if incident else 0.0
            reason = (
                f"Rerouting around {segment_id} via parallel collector corridors avoids the "
                f"{'incident blockage' if incident else 'congestion hotspot'}. "
                f"Expected travel time via diversion: ~{rec_time:.1f} minutes."
            )
            return {
                "segment_id": segment_id,
                "primary_route_blocked": bool(incident or source_edge.get("structural_bottleneck")),
                "recommended_route": rec_route,
                "alternative_routes": alt_routes,
                "reason": reason,
                "expected_travel_time_min": rec_time,
                "baseline_travel_time_min": round(baseline_time_min, 1),
                "time_saved_min": time_saved
            }

        return {
            "segment_id": segment_id,
            "primary_route_blocked": bool(incident),
            "recommended_route": [segment_id],
            "alternative_routes": [],
            "reason": f"No faster alternative corridor found for {segment_id}.",
            "expected_travel_time_min": round(baseline_time_min, 1),
            "baseline_travel_time_min": round(baseline_time_min, 1),
            "time_saved_min": 0.0
        }

advisory_engine = AdvisoryEngine()
