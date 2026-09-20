from typing import Dict, Any, Optional
import datetime

class RecoveryEngine:
    """
    Deterministic queuing-theory incident recovery calculator:
    - Calculates effective capacity considering blocked lanes and incident severity.
    - Estimates net clearing rate = effective capacity - arrival rate.
    - Accurately detects when arrival demand exceeds capacity ('requires_intervention').
    """

    @staticmethod
    def calculate_recovery(
        segment_id: str,
        road: Dict[str, Any],
        incident: Optional[Dict[str, Any]] = None,
        queue_override: Optional[float] = None,
        arrival_override: Optional[float] = None
    ) -> Dict[str, Any]:
        total_lanes = int(road.get("lanes", 2))
        nominal_capacity = float(road.get("capacity_vph", 2000.0))
        peak_factor = float(road.get("peak_capacity_factor", 1.0))
        congestion = float(road.get("congestion_index", 0.2))

        # Incident parameters
        if incident:
            lanes_blocked = min(total_lanes, int(incident.get("lanes_blocked", 1)))
            severity = int(incident.get("severity", 2))
            queue_length = float(incident.get("queue_length_veh", 450.0))
        else:
            lanes_blocked = 0
            severity = 0
            queue_length = float(road.get("queue_length_veh", 0.0))

        if queue_override is not None:
            queue_length = max(0.0, queue_override)

        # Baseline arrival rate estimation based on road capacity and current traffic
        default_arrival = nominal_capacity * (0.45 + congestion * 0.4)
        arrival_rate = arrival_override if arrival_override is not None else default_arrival

        # Effective clearing capacity of the road
        if lanes_blocked >= total_lanes:
            effective_capacity = 0.0
        else:
            open_ratio = (total_lanes - lanes_blocked) / float(total_lanes)
            # Severe incidents cause rubbernecking slowing open lanes by 15-30%
            rubberneck_penalty = 0.85 if severity >= 2 else 0.95
            effective_capacity = nominal_capacity * open_ratio * peak_factor * rubberneck_penalty

        net_clearing_rate = effective_capacity - arrival_rate

        # Edge cases:
        if queue_length <= 5:
            estimated_minutes = 0.0
            status = "cleared"
            confidence = 0.95
            explanation = "Road is flowing normally with minimal or no queue."
        elif net_clearing_rate <= 0:
            # Arrival demand equals or exceeds effective discharge capacity
            estimated_minutes = None
            status = "requires_intervention"
            confidence = 0.88
            explanation = (
                f"Arrival demand ({arrival_rate:.0f} vph) exceeds effective road capacity "
                f"({effective_capacity:.0f} vph). The queue of {queue_length:.0f} vehicles will continue growing "
                f"without signal timing adjustment or upstream diversions."
            )
        else:
            # Queue clearing calculation
            # estimated hours = queue / net_clearing_rate -> convert to minutes
            est_hours = queue_length / net_clearing_rate
            estimated_minutes = round(est_hours * 60.0, 1)
            status = "recovering"
            confidence = 0.82
            explanation = (
                f"Net clearance rate is {net_clearing_rate:.0f} veh/h. "
                f"Queue of {queue_length:.0f} vehicles expected to dissipate in approximately "
                f"{estimated_minutes:.0f} minutes once clear."
            )

        return {
            "segment_id": segment_id,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "queue_length_veh": round(queue_length, 1),
            "effective_capacity_vph": round(effective_capacity, 1),
            "arrival_rate_vph": round(arrival_rate, 1),
            "net_clearing_rate_vph": round(net_clearing_rate, 1),
            "estimated_recovery_minutes": estimated_minutes,
            "status": status,
            "confidence": confidence,
            "explanation": explanation
        }

recovery_engine = RecoveryEngine()
