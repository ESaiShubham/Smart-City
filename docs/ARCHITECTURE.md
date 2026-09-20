# SAATHI — System Architecture & Design

**AI-Powered Urban Traffic Intelligence & Decision Support**  
*Neurax Hackathon 3.0 · Domain 1 — AI in Smart Cities*  
*Team Buggie: E Sai Shubham, Aastha Tiwari, Janvi Gadge*

---

## 1. High-Level Architecture

SAATHI is a software-only, centralized urban traffic intelligence platform designed for city traffic operators and urban planners. It is built as a reactive, multi-tiered full-stack system:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HYDERABAD COMMAND CENTER                        │
│                   React 19 + Leaflet + Recharts                        │
│     (Desktop Command Wall, Tablet Ingress, Mobile Field Dispatch)       │
└───────────────────▲───────────────────────────────────▲────────────────┘
                    │ REST (HTTP/JSON)                  │ WebSocket Stream (/ws/traffic)
┌───────────────────▼───────────────────────────────────▼────────────────┐
│                         FASTAPI BACKEND CORE                           │
│  - REST API Routers (/api/v1/*)    - WebSocket Connection Manager       │
│  - JWT Role-Based Auth Engine       - Central Simulation Playback Loop  │
└───────▲──────────────────▲──────────────────▲──────────────────▲───────┘
        │                  │                  │                  │
┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼───────┐
│ MULTI-HORIZON  │ │ DETERMINISTIC  │ │ NETWORKX GRAPH │ │ WHAT-IF       │
│ XGBoost ML     │ │ QUEUING THEORY │ │ SPILLOVER      │ │ SANDBOX       │
│ FORECASTER     │ │ RECOVERY       │ │ RIPPLE CASCADE │ │ COUNTER-      │
│ (+15, +30,     │ │ (Clearance Rate│ │ (Downstream    │ │ FACTUALS      │
│  +45, +60 min) │ │  Solver)       │ │  Propagation)  │ │ (Capacity Δ)  │
└────────────────┘ └────────────────┘ └────────────────┘ └───────────────┘
        │                  │                  │                  │
┌───────▼──────────────────▼──────────────────▼──────────────────▼───────┐
│                       CENTRAL PERSISTENCE LAYER                        │
│             PostgreSQL / SQLite ORM Database (SQLAlchemy)              │
│   - nodes, roads, traffic_observations, incidents, forecasts, users    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Device Real-Time Synchronization

1. **State Centralization**: Rather than keeping simulation state local to a single browser instance, the backend acts as the single source of truth.
2. **WebSocket Hub (`/ws/traffic`)**:
   - Device A triggers an incident creation or alters playback speed.
   - The FastAPI backend validates, persists to database, recalculates downstream metrics, and broadcasts a `simulation_tick` or `incident_created` payload to all active client connections.
   - Device B, Device C, and mobile clients immediately re-render with matching state in under 50ms.

---

## 3. Decision-Support & Non-Authoritative Safeguards

SAATHI explicitly does not actuate or control physical traffic signal controllers. All outputs are strictly classified and displayed as simulated decision support with explainable reasoning for human operators.
