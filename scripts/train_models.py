import sys
import os

# Add root project path to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.training.trainer import train_forecast_models

def main():
    print("Starting SAATHI Offline ML Training Pipeline...")
    train_forecast_models(sample_size=60000, n_estimators=60, max_depth=5)
    print("Training finished successfully! Models saved to data/models/")

if __name__ == "__main__":
    main()
