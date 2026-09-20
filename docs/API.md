# SAATHI — REST API & WebSocket Stream Specification

Base URL: `http://localhost:8000/api/v1`  
WebSocket Stream: `ws://localhost:8000/ws/traffic`

---

## 1. Endpoints Overview

### Health & Status
- `GET /health` — Service health, city identifier, and non-authoritative advisory disclaimer.

### Road Network Topology
- `GET /roads` — Returns array of road segments with geometric coordinates and static capacities.
- `GET /roads/{segment_id}` — Details for a specific road segment.
- `GET /nodes` — Returns array of intersection nodes with geographical coordinates (lat/lon).

### Traffic Telemetry & Forecasting
- `GET /traffic/current` — Returns real-time or simulated telemetry across all city segments.
- `GET /traffic/{segment_id}` — Returns status for a single road.
- `GET /traffic/{segment_id}/forecast` — Returns multi-horizon XGBoost forecast (+15m, +30m, +45m, +60m) with speeds, flows, congestion, and confidence levels.

### Incident Management
- `GET /incidents` — Returns all active incidents.
- `POST /incidents` — Injects/creates a new incident. Triggers immediate WebSocket broadcast.
- `POST /incidents/{incident_id}/clear` — Resolves an incident and broadcasts network recovery.

### Predictive Decision Support
- `GET /recovery/{segment_id}` — Returns deterministic queuing-theory recovery estimation, effective discharge capacity, and flags `requires_intervention` when arrival demand exceeds capacity.
- `GET /ripple/{segment_id}` — Traces downstream NetworkX graph cascade from congested nodes, ranking affected segments with arrival minutes and risk tiers.
- `GET /advisory/{segment_id}` — Generates human-readable operator advisory.
- `GET /recommendations/{segment_id}` — Computes optimal alternative route diversions with travel-time comparison.

### Counterfactual What-If Simulations
- `POST /simulations` — Evaluates counterfactual scenario (lane removals, capacity drops, demand spikes) and returns Baseline vs Scenario comparison.
- `POST /simulations/control` — Controls simulation clock (`play`, `pause`, `reset`, `speed`).

### Dashboard Summary
- `GET /dashboard/summary` — Global KPI metrics (active incidents, critical roads, avg speed, avg congestion).

---

## 2. WebSocket Real-Time Events (`/ws/traffic`)

| Event Type | Description |
| :--- | :--- |
| `connection_established` | Initial handshake providing snapshot of current city state |
| `simulation_tick` | Fired on every clock advance (+5 min) with updated global summary |
| `incident_created` | Fired whenever an incident is registered from any device |
| `incident_cleared` | Fired when an incident is resolved |
