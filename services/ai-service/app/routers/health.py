from fastapi import APIRouter
from app.services.model_service import ModelService

router = APIRouter()

@router.get("/health")
def health():
    return {
        "service":      "ai-service",
        "status":       "UP",
        "version":      "1.0.0",
        "port":         8084,
        "models_ready": ModelService.is_initialized,
        "models": [
            {"name": "severity_predictor",  "status": "ready" if ModelService.is_initialized else "loading"},
            {"name": "dispatch_scorer",     "status": "ready" if ModelService.is_initialized else "loading"},
            {"name": "demand_forecaster",   "status": "ready" if ModelService.is_initialized else "loading"},
            {"name": "anomaly_detector",    "status": "ready" if ModelService.is_initialized else "loading"},
        ]
    }