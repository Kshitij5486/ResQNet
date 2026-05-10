from fastapi import APIRouter, Query
from app.services.model_service import ModelService

router = APIRouter()

@router.post("/predict/severity")
def predict_severity(req: dict):
    return ModelService.predict_severity(
        type_=req.get("type"),
        city=req.get("city"),
        hour=req.get("hour", 12),
        day_of_week=req.get("day_of_week", 0),
    )

@router.get("/predict/anomaly")
def detect_anomaly(
    incident_count:       float = Query(default=5),
    avg_response_time:    float = Query(default=3.5),
    available_responders: float = Query(default=10),
    active_incidents:     float = Query(default=5),
):
    return ModelService.detect_anomaly(
        incident_count=incident_count,
        avg_response_time=avg_response_time,
        available_responders=available_responders,
        active_incidents=active_incidents,
    )

@router.get("/predict/severity/batch")
def batch_predict():
    scenarios = [
        {"type": "FIRE",     "city": "mumbai",    "hour": 22, "day_of_week": 1, "label": "Fire at night Mumbai"},
        {"type": "MEDICAL",  "city": "delhi",     "hour": 3,  "day_of_week": 0, "label": "Medical 3AM Delhi"},
        {"type": "POLICE",   "city": "bangalore", "hour": 14, "day_of_week": 6, "label": "Police weekend Bangalore"},
        {"type": "DISASTER", "city": "mumbai",    "hour": 18, "day_of_week": 4, "label": "Disaster rush hour Mumbai"},
        {"type": "FIRE",     "city": "delhi",     "hour": 9,  "day_of_week": 2, "label": "Fire morning Delhi"},
    ]
    return [
        {**s, **ModelService.predict_severity(s["type"], s["city"], s["hour"], s["day_of_week"])}
        for s in scenarios
    ]