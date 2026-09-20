import pytest
import pandas as pd
import numpy as np
from ml.preprocessing.cleaner import clean_traffic_dataset

def test_clean_traffic_negative_and_spikes(tmp_path):
    # Create sample synthetic dirty telemetry
    dirty_data = {
        "timestamp": ["2026-01-16 08:00:00", "2026-01-16 08:05:00", "2026-01-16 08:10:00", "2026-01-16 08:10:00"], # includes duplicate
        "segment_id": ["R0001", "R0001", "R0001", "R0001"],
        "speed_kmh": [-15.0, 180.0, 45.0, 45.0], # negative speed and spike > 140
        "flow_vph": [-50.0, 7500.0, 600.0, 600.0], # negative flow and spike > 6000
        "occupancy_pct": [10.0, 20.0, 15.0, 15.0],
        "travel_time_min": [1.5, 1.5, 1.5, 1.5],
        "free_flow_time_min": [1.2, 1.2, 1.2, 1.2],
        "delay_min": [0.3, 0.3, 0.3, 0.3],
        "queue_length_veh": [0.0, 0.0, 0.0, 0.0],
        "congestion_index": [0.1, 0.1, 0.1, 0.1],
        "sensor_quality": [1.0, 1.0, 1.0, 1.0]
    }
    raw_csv = tmp_path / "raw.csv"
    clean_csv = tmp_path / "clean.csv"
    report_json = tmp_path / "report.json"
    pd.DataFrame(dirty_data).to_csv(raw_csv, index=False)

    df_cleaned = clean_traffic_dataset(str(raw_csv), str(clean_csv), str(report_json))

    # Assertions
    assert len(df_cleaned) == 3 # Duplicate removed
    assert (df_cleaned["speed_kmh"] >= 0).all() # Negative clamped to 0
    assert (df_cleaned["speed_kmh"] <= 140).all() # Spikes capped at 140
    assert (df_cleaned["flow_vph"] >= 0).all() # Negative flow clamped to 0
    assert (df_cleaned["flow_vph"] <= 6000).all() # Flow spikes capped
