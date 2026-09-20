import os
import networkx as nx
import pandas as pd
from typing import Dict, Any, List, Optional

class RippleEngine:
    """
    NetworkX graph-based spillover and congestion ripple prediction engine:
    - Builds a directed road graph where nodes = intersections and edges = road segments.
    - Simulates downstream cascade and propagation times from congested origins.
    """

    def __init__(self, network_csv_path: str = "data/raw/network.csv", nodes_csv_path: str = "data/raw/nodes.csv"):
        self.network_csv_path = network_csv_path
        self.nodes_csv_path = nodes_csv_path
        self.graph = nx.DiGraph()
        self.segment_map: Dict[str, Dict[str, Any]] = {}
        self.node_map: Dict[str, Dict[str, Any]] = {}
        self.build_graph()

    def build_graph(self):
        """Constructs the NetworkX graph from nodes and network CSVs."""
        self.graph.clear()
        self.segment_map = {}
        self.node_map = {}

        if os.path.exists(self.nodes_csv_path):
            nodes_df = pd.read_csv(self.nodes_csv_path)
            for _, row in nodes_df.iterrows():
                nid = str(row["node_id"])
                node_data = {
                    "node_id": nid,
                    "lat": float(row.get("lat", 17.385)),
                    "lon": float(row.get("lon", 78.486)),
                    "x": float(row.get("x", 0)),
                    "y": float(row.get("y", 0))
                }
                self.node_map[nid] = node_data
                self.graph.add_node(nid, **node_data)

        if os.path.exists(self.network_csv_path):
            net_df = pd.read_csv(self.network_csv_path)
            for _, row in net_df.iterrows():
                seg_id = str(row["segment_id"])
                u = str(row["source_node"])
                v = str(row["target_node"])
                length_km = float(row.get("length_km", 1.0))
                free_speed = float(row.get("free_flow_speed_kmh", 50.0))
                capacity = float(row.get("capacity_vph", 2000.0))
                lanes = int(row.get("lanes", 2))
                road_class = str(row.get("road_class", "collector"))
                bottleneck = int(row.get("structural_bottleneck", 0))

                edge_attrs = {
                    "segment_id": seg_id,
                    "source_node": u,
                    "target_node": v,
                    "length_km": length_km,
                    "free_flow_speed_kmh": free_speed,
                    "capacity_vph": capacity,
                    "lanes": lanes,
                    "road_class": road_class,
                    "structural_bottleneck": bottleneck,
                    "weight": length_km / max(free_speed, 10.0) # travel time in hours
                }
                self.segment_map[seg_id] = edge_attrs
                self.graph.add_edge(u, v, **edge_attrs)

    def predict_ripple(
        self,
        source_segment_id: str,
        current_telemetry: Optional[Dict[str, Any]] = None,
        max_depth: int = 3
    ) -> Dict[str, Any]:
        """
        Simulates downstream congestion spillover across the directed network graph.
        """
        source_edge = self.segment_map.get(source_segment_id)
        if not source_edge:
            return {
                "source_segment": source_segment_id,
                "current_congestion": 0.0,
                "affected_segments": [],
                "total_impacted_length_km": 0.0,
                "cascade_summary": f"Segment {source_segment_id} not found in road network."
            }

        target_node = source_edge["target_node"]
        curr_speed = float(current_telemetry.get("speed_kmh", 20.0)) if current_telemetry else 20.0
        curr_congestion = float(current_telemetry.get("congestion_index", 0.75)) if current_telemetry else 0.75
        curr_queue = float(current_telemetry.get("queue_length_veh", 400.0)) if current_telemetry else 400.0

        # Excess spillover load
        excess_vehicles = max(0.0, curr_queue * 0.65)

        affected = []
        visited_nodes = {source_edge["source_node"], target_node}
        visited_segments = {source_segment_id}

        queue_to_explore = [(target_node, 1, 0.0, excess_vehicles)]

        while queue_to_explore:
            curr_node, depth, elapsed_time_min, carrying_load = queue_to_explore.pop(0)
            if depth > max_depth or carrying_load <= 20:
                continue

            # Outgoing road segments from curr_node
            out_edges = self.graph.out_edges(curr_node, data=True)
            if not out_edges:
                continue

            # Distribute carrying load among downstream branches
            load_per_branch = carrying_load / float(len(out_edges))

            for _, next_node, edge_data in out_edges:
                seg_id = edge_data["segment_id"]
                if seg_id in visited_segments:
                    continue

                visited_segments.add(seg_id)
                length_km = edge_data["length_km"]
                capacity = edge_data["capacity_vph"]
                lanes = edge_data["lanes"]
                road_class = edge_data["road_class"]

                # Transit time along this segment (minutes)
                transit_min = (length_km / max(curr_speed * 0.9, 10.0)) * 60.0
                arrival_min = round(elapsed_time_min + transit_min, 1)

                # Predict resulting congestion on downstream segment
                available_cap = max(100.0, capacity - load_per_branch * 1.5)
                load_ratio = load_per_branch / max(100.0, capacity * 0.3)
                pred_congestion = min(0.98, max(0.20, curr_congestion * (0.85 ** depth) + load_ratio * 0.15))

                if pred_congestion >= 0.75:
                    risk = "critical"
                elif pred_congestion >= 0.50:
                    risk = "high"
                elif pred_congestion >= 0.30:
                    risk = "medium"
                else:
                    risk = "low"

                affected.append({
                    "segment_id": seg_id,
                    "target_node": next_node,
                    "road_class": road_class,
                    "risk": risk,
                    "estimated_arrival_minutes": arrival_min,
                    "predicted_congestion": round(pred_congestion, 3),
                    "cascade_level": depth,
                    "available_capacity_vph": round(available_cap, 1)
                })

                if next_node not in visited_nodes:
                    visited_nodes.add(next_node)
                    queue_to_explore.append((next_node, depth + 1, arrival_min, load_per_branch * 0.75))

        # Sort by arrival minutes
        affected.sort(key=lambda x: x["estimated_arrival_minutes"])
        total_len = sum(self.segment_map.get(a["segment_id"], {}).get("length_km", 1.0) for a in affected)

        summary = (
            f"Congestion on {source_segment_id} will ripple through {len(affected)} downstream segments "
            f"covering {total_len:.1f} km over the next 15-45 minutes."
        ) if affected else f"No immediate downstream ripple propagation detected for {source_segment_id}."

        return {
            "source_segment": source_segment_id,
            "current_congestion": round(curr_congestion, 3),
            "affected_segments": affected,
            "total_impacted_length_km": round(total_len, 2),
            "cascade_summary": summary
        }

ripple_engine = RippleEngine()
