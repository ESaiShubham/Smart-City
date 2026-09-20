import os
import json
import logging
import datetime
import joblib
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from ml.preprocessing.feature_engineer import FEATURE_COLUMNS, engineer_features
from ml.preprocessing.cleaner import clean_traffic_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ModelTrainer")

HORIZONS = [15, 30, 45, 60]
TARGET_TYPES = ["speed", "flow", "congestion"]

def train_forecast_models(
    traffic_csv_path: str = "data/raw/traffic_train.csv",
    targets_csv_path: str = "data/raw/forecast_targets_train.csv",
    models_dir: str = "data/models",
    sample_size: int = 150000,
    n_estimators: int = 80,
    max_depth: int = 6
):
    """
    Trains dedicated multi-horizon XGBoost models:
    - 15-minute prediction (speed, flow, congestion)
    - 30-minute prediction (speed, flow, congestion)
    - 45-minute prediction (speed, flow, congestion)
    - 60-minute prediction (speed, flow, congestion)

    Enforces strict chronological sorting and zero target leakage.
    """
    os.makedirs(models_dir, exist_ok=True)
    logger.info("=" * 60)
    logger.info("SAATHI AI MODEL TRAINING PIPELINE")
    logger.info("=" * 60)

    # 1. Clean data
    clean_csv_path = "data/processed/clean_traffic_train.csv"
    if not os.path.exists(clean_csv_path):
        logger.info("Generating clean processed dataset...")
        df_traffic = clean_traffic_dataset(traffic_csv_path, clean_csv_path, max_rows=sample_size)
    else:
        logger.info(f"Loading existing clean dataset: {clean_csv_path}")
        df_traffic = pd.read_csv(clean_csv_path, nrows=sample_size)

    # 2. Build feature matrix
    df_features = engineer_features(df_traffic)

    # 3. Load target labels separately (STRICT SEPARATION — NO TARGET LEAKAGE)
    logger.info(f"Loading target labels from: {targets_csv_path}")
    targets_df = pd.read_csv(targets_csv_path, nrows=sample_size * 2)
    targets_df["timestamp"] = pd.to_datetime(targets_df["timestamp"])

    # Merge features with targets on (timestamp, segment_id)
    merged = df_features.merge(targets_df, on=["timestamp", "segment_id"], how="inner")
    logger.info(f"Training dataset ready with {len(merged):,} merged samples.")

    # Chronological sort
    merged = merged.sort_values(by="timestamp").reset_index(drop=True)

    X = merged[FEATURE_COLUMNS].copy()
    feature_list = list(FEATURE_COLUMNS)

    trained_models = {}
    model_metadata = {
        "model_name": "SAATHI_XGBoost_Traffic_Forecaster",
        "version": "2.0.0",
        "trained_at": datetime.datetime.utcnow().isoformat(),
        "training_rows": len(merged),
        "features": feature_list,
        "horizons": HORIZONS,
        "targets": TARGET_TYPES,
        "models": {}
    }

    for h in HORIZONS:
        logger.info(f"\n--- Training Models for Horizon: +{h} Minutes ---")
        for target in TARGET_TYPES:
            col_name = f"target_{target}_{h}m"
            if col_name not in merged.columns:
                logger.warning(f"Target column {col_name} not found! Skipping.")
                continue

            y = merged[col_name].values
            # Filter out any NaNs in y
            valid_idx = ~np.isnan(y)
            X_curr = X[valid_idx]
            y_curr = y[valid_idx]

            logger.info(f"Training XGBoost Regressor for {col_name} on {len(X_curr):,} samples...")
            model = XGBRegressor(
                n_estimators=n_estimators,
                max_depth=max_depth,
                learning_rate=0.08,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=42,
                n_jobs=-1
            )
            model.fit(X_curr, y_curr)

            model_filename = f"model_{h}m_{target}.joblib"
            model_path = os.path.join(models_dir, model_filename)
            joblib.dump(model, model_path)
            logger.info(f"Saved: {model_path}")

            model_metadata["models"][f"{h}m_{target}"] = {
                "file": model_filename,
                "target_column": col_name,
                "n_samples": int(len(X_curr))
            }

    # Save metadata
    metadata_path = os.path.join(models_dir, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(model_metadata, f, indent=2)
    logger.info(f"\nModel metadata successfully serialized to: {metadata_path}")
    logger.info("Training pipeline complete.")

if __name__ == "__main__":
    train_forecast_models(sample_size=100000)
