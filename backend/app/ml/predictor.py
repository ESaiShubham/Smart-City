import os
import logging
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from backend.app.config import settings
from ml.preprocessing.feature_engineer import FEATURE_COLUMNS, ROAD_CLASS_MAP

logger = logging.getLogger("TrafficPredictor")

class ForecastPredictor:
    def __init__(self, models_dir: str = None):
        self.models_dir = models_dir or settings.MODELS_DIR
        self.models: Dict[str, Any] = {}
        self.is_loaded = False
        self.load_models()

    def load_models(self):
        """Loads serialized XGBoost models into memory."""
        self.models = {}
        horizons = [15, 30, 45, 60]
        targets = ["speed", "flow", "congestion"]
        loaded_count = 0

        for h in horizons:
            for t in targets:
                path = os.path.join(self.models_dir, f"model_{h}m_{t}.joblib")
                if os.path.exists(path):
                    try:
                        self.models[f"{h}m_{t}"] = joblib.load(path)
                        loaded_count += 1
                    except Exception as e:
                        logger.error(f"Error loading model {path}: {e}")

        if loaded_count > 0:
            self.is_loaded = True
            logger.info(f"Successfully loaded {loaded_count} XGBoost forecast models from {self.models_dir}.")
        else:
            logger.warning(f"No trained model files found in {self.models_dir}. Fallback physics engine active.")

    def _level_from_congestion(self, congestion: float) -> tuple[str, str]:
        if congestion < 0.25:
            return "green", "Free / Improving"
        elif congestion < 0.50:
            return "yellow", "Moderate"
        elif congestion < 0.75:
            return "orange", "Heavy"
        else:
            return "red", "Critical"

    def predict(self, segment: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generates +15m, +30m, +45m, +60m forecasts for a road segment.
        Returns speeds, flows, congestion indices, classified levels, and confidence.
        """
        speed = float(segment.get("speed_kmh", 45.0))
        flow = float(segment.get("flow_vph", 800.0))
        congestion = float(segment.get("congestion_index", 0.15))
        capacity = float(segment.get("capacity_vph", 2000.0))
        lanes = int(segment.get("lanes", 2))
        free_flow_speed = float(segment.get("free_flow_speed_kmh", 50.0))
        road_class = segment.get("road_class", "collector")

        # Check if ML models are loaded
        if self.is_loaded and "15m_speed" in self.models:
            try:
                # Build feature row matching FEATURE_COLUMNS
                feat_dict = {
                    "speed_kmh": speed,
                    "flow_vph": flow,
                    "occupancy_pct": float(segment.get("occupancy_pct", 15.0)),
                    "queue_length_veh": float(segment.get("queue_length_veh", 0.0)),
                    "delay_min": float(segment.get("delay_min", 0.0)),
                    "congestion_index": congestion,
                    "sensor_quality": float(segment.get("sensor_quality", 1.0)),
                    "hour": 8, "minute": 30, "day_of_week": 1, "is_weekend": 0, "is_rush_hour": 1,
                    "sin_hour": 0.8, "cos_hour": -0.6, "sin_dow": 0.78, "cos_dow": 0.62,
                    "speed_lag_5m": speed, "speed_lag_10m": speed, "speed_lag_15m": speed,
                    "flow_lag_5m": flow, "congestion_lag_5m": congestion, "speed_trend": 0.0,
                    "lanes": lanes, "capacity_vph": capacity, "free_flow_speed_kmh": free_flow_speed,
                    "length_km": float(segment.get("length_km", 1.0)),
                    "structural_bottleneck": int(segment.get("structural_bottleneck", 0)),
                    "importance": float(segment.get("importance", 0.5)),
                    "road_class_encoded": ROAD_CLASS_MAP.get(road_class.lower(), 2),
                    "temperature_c": 26.0, "rain_intensity": 0.0, "event_level": 0, "holiday_flag": 0
                }
                X_df = pd.DataFrame([feat_dict])[FEATURE_COLUMNS]

                forecast_dict = {}
                conf_dict = {}
                for h in [15, 30, 45, 60]:
                    pred_speed = max(5.0, min(free_flow_speed, float(self.models[f"{h}m_speed"].predict(X_df)[0])))
                    pred_flow = max(10.0, float(self.models[f"{h}m_flow"].predict(X_df)[0]))
                    pred_cong = max(0.0, min(1.0, float(self.models[f"{h}m_congestion"].predict(X_df)[0])))

                    # Adjust for active incidents
                    if segment.get("active_incident"):
                        severity = segment.get("incident_severity", 2)
                        blocked = segment.get("lanes_blocked", 1)
                        reduction = (blocked / max(1, lanes)) * 0.45 * (severity / 2.0)
                        pred_speed = max(5.0, pred_speed * (1.0 - reduction))
                        pred_cong = min(1.0, pred_cong + reduction * 0.8)

                    color, label = self._level_from_congestion(pred_cong)
                    confidence = round(0.88 - (h * 0.002), 2)

                    forecast_dict[f"{h}m"] = {
                        "horizon_minutes": h,
                        "predicted_speed_kmh": round(pred_speed, 1),
                        "predicted_flow_vph": round(pred_flow, 1),
                        "predicted_congestion_index": round(pred_cong, 3),
                        "level": color,
                        "status_label": label,
                        "confidence": confidence
                    }
                    conf_dict[f"{h}m"] = confidence

                return {
                    "forecast": forecast_dict,
                    "confidence": conf_dict,
                    "model_type": "XGBoost Multi-Horizon Supervised Model"
                }
            except Exception as e:
                logger.error(f"Prediction inference error: {e}. Utilizing fallback physics.")

        # Physics-based / Queuing theory fallback
        forecast_dict = {}
        conf_dict = {}
        has_incident = bool(segment.get("active_incident", False))
        severity = int(segment.get("incident_severity", 2)) if has_incident else 0
        lanes_blocked = int(segment.get("lanes_blocked", 1)) if has_incident else 0

        for i, h in enumerate([15, 30, 45, 60]):
            decay_or_buildup = 1.0
            if has_incident:
                # Congestion stays high or worsens
                impact_factor = (lanes_blocked / max(lanes, 1)) * 0.5 * (severity / 2.0)
                pred_cong = min(0.98, congestion + impact_factor * (1.0 - i * 0.08))
                pred_speed = max(6.0, speed * (1.0 - impact_factor * 0.7))
                pred_flow = max(100.0, flow * (1.0 - impact_factor * 0.5))
            else:
                # Natural reversion toward capacity and free-flow speed
                pred_cong = max(0.05, congestion * (0.95 ** (i + 1)))
                pred_speed = min(free_flow_speed, speed + (free_flow_speed - speed) * 0.15 * (i + 1))
                pred_flow = flow

            color, label = self._level_from_congestion(pred_cong)
            confidence = round(0.84 - (h * 0.003), 2)

            forecast_dict[f"{h}m"] = {
                "horizon_minutes": h,
                "predicted_speed_kmh": round(pred_speed, 1),
                "predicted_flow_vph": round(pred_flow, 1),
                "predicted_congestion_index": round(pred_cong, 3),
                "level": color,
                "status_label": label,
                "confidence": confidence
            }
            conf_dict[f"{h}m"] = confidence

        return {
            "forecast": forecast_dict,
            "confidence": conf_dict,
            "model_type": "Physics-Based Flow-Density Simulation Engine"
        }

predictor = ForecastPredictor()
