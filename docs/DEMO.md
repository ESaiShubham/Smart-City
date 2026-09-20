# SAATHI — Hackathon Live Presentation & Judging Script

**Follow this concise 3-minute script to demonstrate all core capabilities during judging:**

---

## 🎬 Act 1: The Command Center Overview (30 Seconds)
1. Open `http://localhost:5173` on your laptop browser.
2. Point out:
   - **Hyderabad Command Center Interface**: Interactive dark-mode Leaflet map showing real Hyderabad node coordinates with color-coded traffic corridors (Green = Free, Yellow = Moderate, Orange = Heavy, Red = Critical).
   - **Top KPI Cards**: Live active incidents, critical roads, network average speed, and congestion index.
   - **Non-Authoritative Notice**: Explicitly state that SAATHI provides AI decision support and does not directly actuate physical signals.

---

## 🌊 Act 2: Incident Injection & Multi-Horizon AI (60 Seconds)
1. Click **“Inject Incident”** at top right.
2. Select the preset: **“Severe Crash on R0360”** (or custom form) and click **“Inject Active Incident”**.
3. Point out the instantaneous reactions:
   - **Map**: Corridor `R0360` immediately turns RED with a pulsing incident badge.
   - **Future Traffic Timeline**: Recharts curve updates showing XGBoost predictions for +15m, +30m, +45m, and +60m.
   - **Recovery-Time Prediction**: Deterministic queuing model shows discharge capacity vs arrival rate and computes expected recovery minutes.
   - **Downstream Ripple Spillover**: NetworkX graph engine traces downstream roads (`R0384`, `R0006`) with estimated arrival minutes (12m, 22m) and risk tiers.
   - **Automated Advisory & Diversion**: System generates a clear operator dispatch summary with alternative bypass routing that saves ~14 minutes.

---

## ⚡ Act 3: Multi-Device Sync & What-If Sandbox (60 Seconds)
1. **Multi-Device Synchronization**:
   - Open `http://localhost:5173` in a second browser window or on your smartphone.
   - Click **“Clear”** on the incident from the first window.
   - Watch the second window update immediately via WebSockets with zero manual refresh.
2. **What-If Sandbox**:
   - Click **“What-If Sandbox”**.
   - Test `-1 Lane` on `R0001` and click **“Run What-If Simulation”**.
   - Review the Baseline vs Scenario delta impact matrix (speed degradation, congestion increase, newly stressed segments).
3. Conclude with: *"See the traffic. Predict the ripple. Guide the city."*
