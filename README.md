<div align="center">

# 🛰️ SAATHI
### AI-Powered Urban Traffic Intelligence & Decision Support

> **"See the traffic. Predict the ripple. Guide the city."**

**Neurax Hackathon 3.0 · Domain 1 — AI in Smart Cities**  
**Team Buggie** · E Sai Shubham · Aastha Tiwari · Janvi Gadge

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Leaflet](https://img.shields.io/badge/Map-Leaflet-199900?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost-EB5424?style=flat&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)

</div>

---

## 📌 Executive Summary

**SAATHI** is a software-only, centralized urban traffic intelligence and decision-support command center engineered for Hyderabad's arterial road network. It empowers traffic management authorities and urban planners to:

1. 🔮 **Future Traffic Timeline**: Forecast speeds, flows, and congestion indices across +15, +30, +45, and +60-minute horizons using supervised **XGBoost** regression models.
2. 🔄 **Deterministic Recovery Prediction**: Calculate exact queue dissipation duration based on effective discharge capacity vs incoming demand, flagging `requires_intervention` when demand overwhelms capacity.
3. 🌊 **NetworkX Ripple Spillover**: Trace cascading congestion propagation through connected downstream intersections with estimated arrival times.
4. 🧭 **Smart Diversion Routing**: Propose optimal detour paths with travel-time savings to relieve critical bottlenecks.
5. 🧪 **Counterfactual What-If Sandbox**: Simulate lane closures, capacity drops, or demand spikes and inspect Baseline vs Scenario deltas before taking real-world action.
6. 📡 **Real-Time Multi-Device Sync**: Centralized database-backed state with FastAPI WebSockets (`/ws/traffic`) ensuring immediate synchronization across command-center screens and mobile devices.

> ⚠️ **Important Notice**: SAATHI is a decision-support and simulation platform. It does not directly actuate physical traffic signals.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Leaflet + OpenStreetMap, Recharts, Lucide Icons |
| **Backend Core** | Python 3.13, FastAPI, Pydantic v2, WebSockets, SQLAlchemy ORM |
| **Database** | PostgreSQL (Production Docker) / SQLite (Zero-Configuration Local Development) |
| **ML & Analytics** | XGBoost, Scikit-learn, Pandas, NumPy, NetworkX, Joblib |
| **DevOps** | Docker, Docker Compose, Pytest |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.11+** (Tested on Python 3.13)
- **Node.js 18+** & **npm**
- *(Optional)* Docker & Docker Compose

### 2. Installation & Setup

```bash
# Clone the repository
git clone https://github.com/eshub/saathi.git
cd saathi

# Install Python backend dependencies
py -3.13 -m pip install -r backend/requirements.txt

# Install Frontend dependencies
npm install
```

### 3. Model Training & Evaluation (Offline Pipeline)

```bash
# Clean raw dataset & train multi-horizon XGBoost models (+15m, +30m, +45m, +60m)
py -3.13 scripts/train_models.py

# Evaluate models on unseen validation set
py -3.13 scripts/evaluate_models.py
```

### 4. Running the Application

#### Option A: Local Development (Fastest)

**Terminal 1 — Backend API & WebSockets:**
```bash
py -3.13 -m uvicorn backend.app.main:app --reload --port 8000
```
*API docs will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)*

**Terminal 2 — Frontend Command Center:**
```bash
npm run dev
```
*Open your browser at: [http://localhost:5173](http://localhost:5173)*

#### Option B: Docker Compose (Full Stack with PostgreSQL)

```bash
docker compose up --build
```

---

## 🧪 Automated Testing

Run the full pytest suite for data cleaning, recovery math, ripple graphs, and REST APIs:

```bash
py -3.13 -m pytest backend/tests
```

---

## 📁 Repository Structure

```
saathi/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Routers: /roads, /traffic, /incidents, /recovery, /ripple, /advisory, /simulations
│   │   ├── ml/              # XGBoost model loader & inference engine
│   │   ├── recovery/        # Deterministic queuing theory recovery engine
│   │   ├── ripple/          # NetworkX graph ripple spillover engine
│   │   ├── advisory/        # Natural-language decision generator & route diversion
│   │   ├── services/        # Central simulation playback & state broadcaster
│   │   ├── websocket/       # WebSocket connection manager
│   │   └── main.py          # FastAPI entry point
│   ├── tests/               # Pytest automated test suite
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container
├── data/
│   ├── raw/                 # Unmodified NeuraX Smart Cities CSV dataset
│   ├── processed/           # Cleaned & featured telemetry
│   └── models/              # Serialized XGBoost models (.joblib) & metrics.json
├── ml/
│   ├── preprocessing/       # Noise cleaner, stuck-sensor detector & feature engineer
│   ├── training/            # Multi-horizon XGBoost training pipeline
│   └── evaluation/          # Validation benchmarking (MAE, RMSE, R², F1)
├── src/                     # React 19 Frontend
│   ├── components/          # Header, StatusRibbon, Leaflet map, Analytics panels
│   ├── pages/               # DashboardPage, DemoPage
│   ├── services/            # REST API client
│   └── types/               # TypeScript interfaces
├── scripts/                 # CLI training, evaluation, and simulation runners
├── docs/                    # Architecture, ML pipeline, API & Demo documentation
├── docker-compose.yml       # Production container orchestration
├── .env.example             # Environment template
└── README.md
```

---

## 🏆 Hackathon Presentation Walkthrough

See the detailed judging guide in [**docs/DEMO.md**](docs/DEMO.md) or click **"Demo Mode"** directly inside the application header!
