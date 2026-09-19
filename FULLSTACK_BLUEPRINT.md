# 🛰️ SAATHI — Full-Stack Architecture Blueprint
### Neurax Hackathon 3.0 · Domain 1: AI in Smart Cities
**Team Buggie**: E Sai Shubham · Aastha Tiwari · Janvi Gadge

> *"See the traffic. Predict the ripple. Guide the city."*

---

## 1. System Architecture Overview

```
                      ┌──────────────────────────────────────────┐
                      │    Traffic Edge Sensors & CCTV Telemetry  │
                      │       (Inductive loops, Radar, GPS)      │
                      └────────────────────┬─────────────────────┘
                                           │ MQTT / HTTPS
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │        Message Queue / Stream Ingestion  │
                      │          (Apache Kafka / RabbitMQ)       │
                      └────────────────────┬─────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
     ┌─────────────────────────────┐               ┌─────────────────────────────┐
     │   PostgreSQL + TimescaleDB  │               │   AI / ML Inference Engine  │
     │      + PostGIS Spatial      │               │  (ST-GCN / Spatio-Temporal  │
     │  (Time-series + Geospatial) │               │   Graph Convolutional Net)  │
     └──────────────┬──────────────┘               └──────────────┬──────────────┘
                    │                                             │
                    └──────────────────────┬──────────────────────┘
                                           │
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │      FastAPI / Node.js Microservices     │
                      │        - REST API (CRUD & Reports)       │
                      │        - WebSockets (Live Telemetry)     │
                      └────────────────────┬─────────────────────┘
                                           │ JSON / WebSocket Frames
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │          SAATHI Frontend Client          │
                      │   (React 18 + TypeScript + Tailwind CSS) │
                      │    - 🔮 Timeline Forecaster (+15..+60m)  │
                      │    - 🔄 Recovery Queuing Calculator      │
                      │    - 🌊 Ripple Cascade Topology Map      │
                      │    - 📣 Tactical Advisory Synthesizer    │
                      └──────────────────────────────────────────┘
```

---

## 2. Database Schema (PostgreSQL + TimescaleDB + PostGIS)

### 2.1 Enable Extensions
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

### 2.2 Table: `roads`
```sql
CREATE TABLE roads (
    id VARCHAR(16) PRIMARY KEY, -- e.g. 'R17'
    code VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL, -- 'ARTERIAL', 'EXPRESSWAY', 'COLLECTOR', 'RING_ROAD'
    free_flow_speed NUMERIC(5,2) NOT NULL, -- km/h
    capacity INTEGER NOT NULL, -- veh/hr
    length_km NUMERIC(5,2) NOT NULL,
    lanes SMALLINT NOT NULL DEFAULT 3,
    geometry GEOMETRY(LineString, 4326), -- PostGIS line representation
    map_x INTEGER NOT NULL, -- UI normalized canvas x (0-850)
    map_y INTEGER NOT NULL, -- UI normalized canvas y (0-560)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Table: `road_connections` (Network Graph Topology)
```sql
CREATE TABLE road_connections (
    id SERIAL PRIMARY KEY,
    source_road_id VARCHAR(16) REFERENCES roads(id) ON DELETE CASCADE,
    target_road_id VARCHAR(16) REFERENCES roads(id) ON DELETE CASCADE,
    distance_km NUMERIC(5,2) NOT NULL,
    spillover_share NUMERIC(4,3) NOT NULL, -- e.g. 0.55 (55% overflow)
    junction_name VARCHAR(128) NOT NULL,
    UNIQUE(source_road_id, target_road_id)
);
```

### 2.4 Table: `traffic_telemetry` (TimescaleDB Hypertable)
```sql
CREATE TABLE traffic_telemetry (
    time TIMESTAMPTZ NOT NULL,
    road_id VARCHAR(16) NOT NULL REFERENCES roads(id),
    current_speed NUMERIC(5,2) NOT NULL,
    arrival_rate INTEGER NOT NULL, -- veh/hr
    queue_vehicles INTEGER NOT NULL DEFAULT 0,
    occupancy_percent NUMERIC(5,2),
    speed_trend NUMERIC(5,2) NOT NULL -- km/h delta over last 15 min
);

-- Convert to hypertable partitioned by time
SELECT create_hypertable('traffic_telemetry', 'time');
CREATE INDEX idx_telemetry_road_time ON traffic_telemetry (road_id, time DESC);
```

### 2.5 Table: `incidents`
```sql
CREATE TABLE incidents (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'INC-2026-081'
    road_id VARCHAR(16) NOT NULL REFERENCES roads(id),
    title VARCHAR(256) NOT NULL,
    incident_type VARCHAR(32) NOT NULL, -- 'COLLISION', 'WATERLOGGING', 'VEHICLE_BREAKDOWN', etc.
    severity VARCHAR(16) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    description TEXT,
    lanes_blocked SMALLINT NOT NULL DEFAULT 1,
    initial_queue INTEGER NOT NULL DEFAULT 0,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_cleared BOOLEAN NOT NULL DEFAULT FALSE,
    cleared_at TIMESTAMPTZ
);
```

---

## 3. Backend API Contract (FastAPI / Node.js)

### 3.1 REST Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/roads` | Returns all roads, metadata, and connected topology |
| `GET` | `/api/v1/telemetry/latest` | Returns latest sensor speed and queue size for all corridors |
| `GET` | `/api/v1/predictions/timeline/{road_id}` | Computes +15, +30, +45, +60m speed predictions & traffic levels |
| `GET` | `/api/v1/predictions/recovery/{road_id}` | Computes queuing drainage rate, recovery mins, and clearance ETA |
| `GET` | `/api/v1/predictions/ripple/{road_id}` | Computes downstream shockwave propagation, at-risk roads & safe bypasses |
| `GET` | `/api/v1/advisory/{road_id}` | Returns synthesized decision-support advisory |
| `POST` | `/api/v1/incidents` | Injects an active traffic incident / blockage |
| `PATCH`| `/api/v1/incidents/{id}/clear`| Marks an incident as cleared and initiates queue drainage |

### 3.2 WebSocket Streaming
- **Endpoint**: `ws://localhost:8000/ws/traffic`
- **Payload Format**:
```json
{
  "type": "TELEMETRY_UPDATE",
  "timestamp": "2026-09-19T18:59:00Z",
  "roads": [
    {
      "id": "R17",
      "currentSpeed": 22.4,
      "currentQueue": 1240,
      "arrivalRate": 1700,
      "level": "MODERATE"
    }
  ]
}
```

---

## 4. Machine Learning Model Architecture (ST-GCN / Spatio-Temporal GNN)

### 4.1 Concept
Urban traffic does not behave as independent time series. A slowdown on $R_{17}$ alters traffic density on $R_{18}$ and $R_{21}$ governed by graph connectivity.

### 4.2 Model Structure
1. **Spatial Dimension**: Graph Convolutional Network (GCN) layer using Normalized Laplacian matrix of the road network:
   $$L = I_n - D^{-1/2} A D^{-1/2}$$
2. **Temporal Dimension**: 1D Gated Temporal Convolutions (GLU) capturing traffic wave inertia over historical time lags (0 to 60 minutes).
3. **Loss Function**: Weighted Mean Absolute Error penalizing critical false negatives during rush hour:
   $$\mathcal{L} = \frac{1}{N} \sum_{i=1}^N w_i |y_i - \hat{y}_i|$$

---

## 5. Transitioning Frontend to Full-Stack

In `src/services/`, the current in-memory prediction functions (`timelinePredictor.ts`, `recoveryPredictor.ts`, `ripplePredictor.ts`, `advisoryGenerator.ts`) are completely isolated from the UI components.

To transition:
1. Set an environment variable in `.env`:
   ```bash
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   VITE_USE_LIVE_API=true
   ```
2. Create `src/services/apiClient.ts` to query the FastAPI backend.
3. The React context in `TrafficContext.tsx` can seamlessly switch from in-memory function calls to `apiClient.getTimeline(...)` without changing a single UI component!
