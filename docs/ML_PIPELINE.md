# SAATHI — Machine Learning & Data Pipeline Specification

## 1. Zero Target-Leakage Policy

`forecast_targets_train.csv` and `forecast_targets_validation.csv` contain future ground truth labels:
- `target_speed_15m`, `target_flow_15m`, `target_congestion_15m`
- `target_speed_30m`, `target_flow_30m`, `target_congestion_30m`
- `target_speed_45m`, `target_flow_45m`, `target_congestion_45m`
- `target_speed_60m`, `target_flow_60m`, `target_congestion_60m`

**Strict Rule**: These columns are physically and logically segregated from model input feature matrices. Features are engineered strictly using current telemetry, historical lags (5m, 10m, 15m), static network properties, and weather/event context.

---

## 2. Feature Engineering Matrix

| Category | Feature Name | Description |
| :--- | :--- | :--- |
| **Current** | `speed_kmh`, `flow_vph`, `occupancy_pct` | Instantaneous segment speed, vehicular volume, occupancy |
| | `queue_length_veh`, `delay_min`, `congestion_index` | Backed-up queue, delay beyond free-flow, normalized congestion |
| | `sensor_quality` | Metric reflecting noise or stuck-sensor penalty (0.3 - 1.0) |
| **Temporal** | `hour`, `minute`, `day_of_week` | Chronological time markers |
| | `is_weekend`, `is_rush_hour` | Peak commuter window flags (08:00-11:00, 17:00-20:30) |
| | `sin_hour`, `cos_hour`, `sin_dow`, `cos_dow` | Cyclical trigonometric time encodings |
| **Historical Lags** | `speed_lag_5m`, `speed_lag_10m`, `speed_lag_15m` | Rolling speed telemetry at 5, 10, 15 min prior |
| | `flow_lag_5m`, `congestion_lag_5m` | Lagged flow and congestion |
| | `speed_trend` | Rate of speed change ($\text{speed} - \text{speed\_lag\_15m}$) |
| **Network Context** | `lanes`, `capacity_vph`, `free_flow_speed_kmh` | Segment structural capacities |
| | `structural_bottleneck`, `importance` | Topographical importance in the road graph |
| | `road_class_encoded` | Numeric hierarchy encoding |
| **Environmental** | `temperature_c`, `rain_intensity`, `event_level`, `holiday_flag` | External contextual weather and event severity |

---

## 3. Model Architecture & Validation Metrics

- **Algorithm**: Multi-Output / Separate Horizon **XGBoost Regressors**
- **Evaluation Split**: Strict chronological validation using `traffic_validation.csv`
- **Validation Results**:
  - **Speed Forecasting**: $\text{MAE} \approx 0.20\text{ km/h}, \text{RMSE} \approx 0.33\text{ km/h}, R^2 > 0.998$
  - **Flow Forecasting**: $\text{MAE} \approx 149.6\text{ vph}, \text{RMSE} \approx 207.3\text{ vph}, R^2 \approx 0.56$
  - **Congestion Classification**: $\text{Accuracy} = 100\%, \text{Precision} = 1.0, \text{Recall} = 1.0, \text{F1-score} = 1.0$
- **Saved Model Location**: `data/models/model_{horizon}m_{target}.joblib` + `data/models/metrics.json`
