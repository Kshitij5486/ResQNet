from fastapi import APIRouter
from app.schemas.schemas import SeverityRequest, SeverityResponse
from app.services.model_service import ModelService

router = APIRouter()

@router.post("/predict/severity", response_model=SeverityResponse)
def predict_severity(req: SeverityRequest):
    result = ModelService.predict_severity(
        type_=req.type.value,
        city=req.city.value,
        hour=req.hour,
        day_of_week=req.day_of_week,
    )
    return SeverityResponse(**result)

@router.post("/predict/anomaly")
def detect_anomaly(incident_count: float = 5, avg_response_time: float = 3.5, available_responders: float = 10):
    return ModelService.detect_anomaly(incident_count, avg_response_time, available_responders)