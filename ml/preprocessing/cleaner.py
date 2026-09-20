import os
import json
import logging
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DataCleaner")

def clean_traffic_dataset(
    raw_csv_path: str,
    output_csv_path: str,
    quality_report_path: str = None,
    sample_segments: list = None,
    max_rows: int = None
) -> pd.DataFrame:
    """
    Robust data cleaning pipeline:
    1. Validates schemas & parses timestamps.
    2. Sorts chronologically.
    3. Removes duplicate (timestamp, segment_id) entries.
    4. Handles impossible negative values (clamping).
    5. Detects suspicious spikes (e.g. speed > 140km/h on urban roads).
    6. Detects stuck sensors (constant reading with zero variance).
    7. Imputes missing values using forward fill and segment medians.
    8. Tracks comprehensive data-quality metrics without modifying raw files.
    """
    logger.info(f"Loading raw telemetry from: {raw_csv_path}")
    if not os.path.exists(raw_csv_path):
        raise FileNotFoundError(f"Raw dataset not found at {raw_csv_path}")

    # Read CSV
    df = pd.read_csv(raw_csv_path, nrows=max_rows)
    initial_rows = len(df)
    logger.info(f"Loaded {initial_rows:,} raw observations.")

    # Optional segment filtering for targeted high-performance workflows
    if sample_segments:
        df = df[df["segment_id"].isin(sample_segments)].copy()
        logger.info(f"Filtered to {len(sample_segments)} segments: {len(df):,} rows remaining.")

    # 1. Parse timestamps & sort chronologically
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    invalid_timestamps = df["timestamp"].isna().sum()
    df = df.dropna(subset=["timestamp"])
    df = df.sort_values(by=["segment_id", "timestamp"]).reset_index(drop=True)

    # 2. Deduplication
    duplicates_count = df.duplicated(subset=["timestamp", "segment_id"]).sum()
    df = df.drop_duplicates(subset=["timestamp", "segment_id"]).reset_index(drop=True)

    # 3. Handle negative values (speed, flow, occupancy, queue cannot be negative)
    numeric_cols = ["speed_kmh", "flow_vph", "occupancy_pct", "queue_length_veh", "delay_min", "congestion_index"]
    negative_clamps = {}
    for col in numeric_cols:
        if col in df.columns:
            neg_mask = df[col] < 0
            count_neg = int(neg_mask.sum())
            negative_clamps[col] = count_neg
            if count_neg > 0:
                df.loc[neg_mask, col] = 0.0

    # 4. Spike detection (unrealistic speeds or flows)
    speed_spikes = int((df["speed_kmh"] > 140.0).sum())
    if speed_spikes > 0:
        df.loc[df["speed_kmh"] > 140.0, "speed_kmh"] = 140.0

    flow_spikes = int((df["flow_vph"] > 6000.0).sum())
    if flow_spikes > 0:
        df.loc[df["flow_vph"] > 6000.0, "flow_vph"] = 6000.0

    # 5. Stuck sensor detection (per-segment consecutive identical values)
    stuck_sensor_flags = 0
    if "sensor_quality" not in df.columns:
        df["sensor_quality"] = 1.0

    # Group by segment to detect stuck sensor runs (variance == 0 over 6 consecutive intervals)
    for seg_id, group in df.groupby("segment_id"):
        speed_diff = group["speed_kmh"].diff().abs()
        # Rolling sum of diff == 0 for 6 intervals (30 min)
        stuck_mask = (speed_diff.rolling(window=6, min_periods=6).sum() == 0) & (group["speed_kmh"] > 0)
        stuck_count = stuck_mask.sum()
        if stuck_count > 0:
            df.loc[group.index[stuck_mask], "sensor_quality"] = 0.3
            stuck_sensor_flags += int(stuck_count)

    # 6. Missing value handling
    missing_before = int(df[numeric_cols].isna().sum().sum())
    # Forward fill per segment then median fill
    df[numeric_cols] = df.groupby("segment_id")[numeric_cols].transform(lambda grp: grp.ffill().bfill())
    for col in numeric_cols:
        if df[col].isna().any():
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val if not pd.isna(median_val) else 0.0)

    missing_after = int(df[numeric_cols].isna().sum().sum())

    # 7. Quality report
    quality_report = {
        "raw_file": os.path.basename(raw_csv_path),
        "initial_rows": int(initial_rows),
        "cleaned_rows": int(len(df)),
        "invalid_timestamps_dropped": int(invalid_timestamps),
        "duplicate_rows_removed": int(duplicates_count),
        "negative_values_clamped": negative_clamps,
        "speed_spikes_capped": speed_spikes,
        "flow_spikes_capped": flow_spikes,
        "stuck_sensor_intervals_flagged": stuck_sensor_flags,
        "missing_values_imputed": missing_before - missing_after,
        "unique_segments": int(df["segment_id"].nunique()),
        "time_range_start": str(df["timestamp"].min()),
        "time_range_end": str(df["timestamp"].max())
    }

    os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
    df.to_csv(output_csv_path, index=False)
    logger.info(f"Saved cleaned data to: {output_csv_path} ({len(df):,} rows)")

    if quality_report_path:
        os.makedirs(os.path.dirname(quality_report_path), exist_ok=True)
        with open(quality_report_path, "w") as f:
            json.dump(quality_report, f, indent=2)
        logger.info(f"Saved quality report to: {quality_report_path}")

    return df

if __name__ == "__main__":
    raw_path = "data/raw/traffic_train.csv"
    out_path = "data/processed/clean_traffic_train.csv"
    rep_path = "data/processed/quality_report_train.json"
    clean_traffic_dataset(raw_path, out_path, rep_path, max_rows=100000)
