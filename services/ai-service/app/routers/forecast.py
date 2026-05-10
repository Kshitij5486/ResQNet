from fastapi import APIRouter
from app.schemas.schemas import ForecastResponse
from app.services.model_service import ModelService

router = APIRouter()

@router.get("/forecast/{city}")
def forecast_demand(city: str, hours_ahead: int = 24):
    return ModelService.forecast_demand(city=city.lower(), hours_ahead=hours_ahead)

@router.get("/forecast")
def forecast_all():
    return {
        "mumbai":    ModelService.forecast_demand("mumbai",    24),
        "delhi":     ModelService.forecast_demand("delhi",     24),
        "bangalore": ModelService.forecast_demand("bangalore", 24),
    }