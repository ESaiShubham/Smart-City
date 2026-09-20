import os
import numpy as np
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("FeatureEngineer")

# Mapping of road class to numeric encoding
ROAD_CLASS_MAP = {
    "motorway": 5,
    "trunk": 4,
    "primary": 3,
    "secondary": 2,
    "tertiary": 1,
    "residential": 0,
    "collector": 2,
    "arterial": 4
}

FEATURE_COLUMNS = [
    # Current telemetry
    "speed_kmh", "flow_vph", "occupancy_pct", "queue_length_veh",
    "delay_min", "congestion_index", "sensor_quality",
    # Temporal & Cyclical
    "hour", "minute", "day_of_week", "is_weekend", "is_rush_hour",
    "sin_hour", "cos_hour", "sin_dow", "cos_dow",
    # Historical Lags & Rolling
    "speed_lag_5m", "speed_lag_10m", "speed_lag_15m",
    "flow_lag_5m", "congestion_lag_5m", "speed_trend",
    # Network static attributes
    "lanes", "capacity_vph", "free_flow_speed_kmh", "length_km",
    "structural_bottleneck", "importance", "road_class_encoded",
    # Context
    "temperature_c", "rain_intensity", "event_level", "holiday_flag"
]

def engineer_features(
    traffic_df: pd.DataFrame,
    network_csv_path: str = "data/raw/network.csv",
    context_csv_path: str = "data/raw/context_train.csv"
) -> pd.DataFrame:
    """
    Constructs rich feature matrix for training/inference without any target leakage.
    Ensures input features depend strictly on present and past data.
    """
    logger.info("Starting feature engineering...")
    df = traffic_df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by=["segment_id", "timestamp"]).reset_index(drop=True)

    # 1. Temporal features
    df["hour"] = df["timestamp"].dt.hour
    df["minute"] = df["timestamp"].dt.minute
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    # Rush hours: 08:00 to 11:00 and 17:00 to 20:30
    df["is_rush_hour"] = (
        ((df["hour"] >= 8) & (df["hour"] <= 11)) |
        ((df["hour"] >= 17) & (df["hour"] <= 20))
    ).astype(int)

    # Cyclical encodings
    hour_float = df["hour"] + df["minute"] / 60.0
    df["sin_hour"] = np.sin(2 * np.pi * hour_float / 24.0)
    df["cos_hour"] = np.cos(2 * np.pi * hour_float / 24.0)
    df["sin_dow"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0)
    df["cos_dow"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0)

    # 2. Historical lags & rolling trends per segment
    logger.info("Computing historical rolling lags...")
    grouped = df.groupby("segment_id")
    df["speed_lag_5m"] = grouped["speed_kmh"].shift(1)
    df["speed_lag_10m"] = grouped["speed_kmh"].shift(2)
    df["speed_lag_15m"] = grouped["speed_kmh"].shift(3)
    df["flow_lag_5m"] = grouped["flow_vph"].shift(1)
    df["congestion_lag_5m"] = grouped["congestion_index"].shift(1)

    # Fill NaN lags (for first observations) with current value
    df["speed_lag_5m"] = df["speed_lag_5m"].fillna(df["speed_kmh"])
    df["speed_lag_10m"] = df["speed_lag_10m"].fillna(df["speed_lag_5m"])
    df["speed_lag_15m"] = df["speed_lag_15m"].fillna(df["speed_lag_10m"])
    df["flow_lag_5m"] = df["flow_lag_5m"].fillna(df["flow_vph"])
    df["congestion_lag_5m"] = df["congestion_lag_5m"].fillna(df["congestion_index"])

    # Trend: difference between current speed and 15m ago
    df["speed_trend"] = df["speed_kmh"] - df["speed_lag_15m"]

    # 3. Merge static network attributes
    if os.path.exists(network_csv_path):
        logger.info(f"Merging static network features from {network_csv_path}...")
        net_df = pd.read_csv(network_csv_path)
        net_df["road_class_encoded"] = net_df["road_class"].str.lower().map(ROAD_CLASS_MAP).fillna(1).astype(int)
        cols_to_merge = [
            "segment_id", "lanes", "free_flow_speed_kmh", "capacity_vph",
            "length_km", "structural_bottleneck", "importance", "road_class_encoded"
        ]
        # Keep only existing columns in net_df
        available_cols = [c for c in cols_to_merge if c in net_df.columns]
        df = df.merge(net_df[available_cols], on="segment_id", how="left")
    else:
        logger.warning(f"Network file {network_csv_path} not found. Generating default static attributes.")
        df["lanes"] = 2
        df["capacity_vph"] = 2000.0
        df["free_flow_speed_kmh"] = 50.0
        df["length_km"] = 1.0
        df["structural_bottleneck"] = 0
        df["importance"] = 0.5
        df["road_class_encoded"] = 2

    # 4. Merge context data (weather, events, holiday)
    if os.path.exists(context_csv_path):
        logger.info(f"Merging context from {context_csv_path}...")
        ctx_df = pd.read_csv(context_csv_path)
        ctx_df["timestamp"] = pd.to_datetime(ctx_df["timestamp"])
        ctx_cols = ["timestamp", "temperature_c", "rain_intensity", "event_level", "holiday_flag"]
        available_ctx = [c for c in ctx_cols if c in ctx_df.columns]
        df = df.merge(ctx_df[available_ctx], on="timestamp", how="left")
    else:
        df["temperature_c"] = 25.0
        df["rain_intensity"] = 0.0
        df["event_level"] = 0
        df["holiday_flag"] = 0

    # Fill any remaining NaNs in features with column medians or zeros
    for col in FEATURE_COLUMNS:
        if col in df.columns and df[col].isna().any():
            df[col] = df[col].fillna(0.0)

    logger.info(f"Feature engineering complete. Matrix shape: {df.shape}")
    return df
