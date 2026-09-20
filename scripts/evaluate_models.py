import sys
import os

# Add root project path to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.evaluation.evaluator import evaluate_models

def main():
    print("Starting SAATHI Offline Model Evaluation Pipeline...")
    metrics = evaluate_models(sample_size=30000)
    print("Evaluation finished! Metrics saved to data/models/metrics.json")

if __name__ == "__main__":
    main()
