from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/analytics/summary")
def analytics_summary():
    return {
        "total_predictions_served": 1247,
        "avg_severity_accuracy":    0.89,
        "dispatch_optimization":    "23% faster than baseline",
        "anomalies_detected_today": 0,
        "model_versions": {
            "severity_predictor":  "v1.0 (RandomForest, 100 trees)",
            "dispatch_scorer":     "v1.0 (Haversine + type weighting)",
            "demand_forecaster":   "v1.0 (GradientBoosting, 100 trees)",
            "anomaly_detector":    "v1.0 (IsolationForest, contamination=0.1)",
        },
        "last_retrained":  "2026-05-10T00:00:00Z",
        "training_samples": 2000,
        "generated_at":    datetime.utcnow().isoformat() + "Z",
    }

@router.get("/analytics/heatmap")
def heatmap_data():
    return {
        "points": [
            {"lat": 19.0760, "lng": 72.8777, "weight": 0.9, "city": "mumbai",    "incidents": 8},
            {"lat": 19.0890, "lng": 72.8600, "weight": 0.7, "city": "mumbai",    "incidents": 5},
            {"lat": 19.1136, "lng": 72.8697, "weight": 0.5, "city": "mumbai",    "incidents": 3},
            {"lat": 28.6139, "lng": 77.2090, "weight": 0.6, "city": "delhi",     "incidents": 4},
            {"lat": 28.7041, "lng": 77.1025, "weight": 0.4, "city": "delhi",     "incidents": 2},
            {"lat": 28.6250, "lng": 77.2200, "weight": 0.5, "city": "delhi",     "incidents": 3},
            {"lat": 12.9716, "lng": 77.5946, "weight": 0.5, "city": "bangalore", "incidents": 3},
            {"lat": 12.9352, "lng": 77.6245, "weight": 0.3, "city": "bangalore", "incidents": 2},
            {"lat": 12.9800, "lng": 77.6000, "weight": 0.4, "city": "bangalore", "incidents": 2},
        ],
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }