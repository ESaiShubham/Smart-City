import os
import json
import logging
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    accuracy_score, precision_score, recall_score, f1_score
)
from ml.preprocessing.feature_engineer import FEATURE_COLUMNS, engineer_features
from ml.preprocessing.cleaner import clean_traffic_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ModelEvaluator")

def classify_congestion(val):
    if val < 0.25:
        return 0 # Free
    elif val < 0.50:
        return 1 # Moderate
    elif val < 0.75:
        return 2 # Heavy
    else:
        return 3 # Critical

def evaluate_models(
    val_traffic_path: str = "data/raw/traffic_validation.csv",
    val_targets_path: str = "data/raw/forecast_targets_validation.csv",
    models_dir: str = "data/models",
    sample_size: int = 50000
) -> dict:
    """
    Evaluates trained multi-horizon models on unseen validation set:
    - Calculates MAE, RMSE, R² for speed, flow, congestion.
    - Calculates Accuracy, Precision, Recall, F1 for congestion classification.
    - Produces a comprehensive metrics report saved to data/models/metrics.json.
    """
    logger.info("=" * 60)
    logger.info("SAATHI MODEL VALIDATION & BENCHMARKING PIPELINE")
    logger.info("=" * 60)

    clean_val_path = "data/processed/clean_traffic_validation.csv"
    if not os.path.exists(clean_val_path):
        df_val = clean_traffic_dataset(val_traffic_path, clean_val_path, max_rows=sample_size)
    else:
        df_val = pd.read_csv(clean_val_path, nrows=sample_size)

    # Engineer features (strict chronological & no leakage)
    df_features = engineer_features(
        df_val,
        network_csv_path="data/raw/network.csv",
        context_csv_path="data/raw/context_validation.csv"
    )

    targets_df = pd.read_csv(val_targets_path, nrows=sample_size * 2)
    targets_df["timestamp"] = pd.to_datetime(targets_df["timestamp"])

    merged = df_features.merge(targets_df, on=["timestamp", "segment_id"], how="inner")
    logger.info(f"Validation evaluation set: {len(merged):,} samples.")

    X_val = merged[FEATURE_COLUMNS]

    horizons = [15, 30, 45, 60]
    metrics = {
        "evaluation_samples": int(len(merged)),
        "horizons": {}
    }

    for h in horizons:
        h_metrics = {}
        for target in ["speed", "flow", "congestion"]:
            model_path = os.path.join(models_dir, f"model_{h}m_{target}.joblib")
            if not os.path.exists(model_path):
                logger.warning(f"Model file {model_path} not found. Skipping.")
                continue

            model = joblib.load(model_path)
            y_true = merged[f"target_{target}_{h}m"].values
            valid_mask = ~np.isnan(y_true)
            X_curr = X_val[valid_mask]
            y_curr = y_true[valid_mask]

            y_pred = model.predict(X_curr)

            mae = float(mean_absolute_error(y_curr, y_pred))
            rmse = float(np.sqrt(mean_squared_error(y_curr, y_pred)))
            r2 = float(r2_score(y_curr, y_pred))

            h_metrics[target] = {
                "MAE": round(mae, 4),
                "RMSE": round(rmse, 4),
                "R2": round(r2, 4)
            }

            # Classification metrics for congestion
            if target == "congestion":
                y_true_cls = np.array([classify_congestion(v) for v in y_curr])
                y_pred_cls = np.array([classify_congestion(v) for v in y_pred])

                acc = float(accuracy_score(y_true_cls, y_pred_cls))
                prec = float(precision_score(y_true_cls, y_pred_cls, average="weighted", zero_division=0))
                rec = float(recall_score(y_true_cls, y_pred_cls, average="weighted", zero_division=0))
                f1 = float(f1_score(y_true_cls, y_pred_cls, average="weighted", zero_division=0))

                h_metrics["congestion_classification"] = {
                    "accuracy": round(acc, 4),
                    "precision": round(prec, 4),
                    "recall": round(rec, 4),
                    "f1_score": round(f1, 4)
                }

        metrics["horizons"][f"{h}m"] = h_metrics

    # Print summary table
    logger.info("\n" + "=" * 60)
    logger.info("FINAL VALIDATION EVALUATION RESULTS")
    logger.info("=" * 60)
    for h, h_data in metrics["horizons"].items():
        logger.info(f"--- Horizon: +{h} ---")
        for k, v in h_data.items():
            logger.info(f"  {k}: {v}")

    # Save metrics JSON
    metrics_path = os.path.join(models_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"\nSaved metrics to: {metrics_path}")

    return metrics

if __name__ == "__main__":
    evaluate_models(sample_size=30000)
