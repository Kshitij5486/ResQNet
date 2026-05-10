from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.routers import health, predict, dispatch, forecast, analytics
from app.services.model_service import ModelService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ResQNet AI Service...")
    ModelService.initialize()
    logger.info("AI models loaded successfully")
    yield
    logger.info("Shutting down AI Service")

app = FastAPI(
    title="ResQNet AI Service",
    description="AI/ML intelligence layer for emergency response optimization",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,    prefix="/api/ai",       tags=["Health"])
app.include_router(predict.router,   prefix="/api/ai",       tags=["Prediction"])
app.include_router(dispatch.router,  prefix="/api/ai",       tags=["Dispatch"])
app.include_router(forecast.router,  prefix="/api/ai",       tags=["Forecast"])
app.include_router(analytics.router, prefix="/api/ai",       tags=["Analytics"])

@app.get("/")
def root():
    return {
        "service": "ResQNet AI Service",
        "version": "1.0.0",
        "status":  "operational",
        "models":  ["severity_predictor", "dispatch_scorer", "demand_forecaster", "anomaly_detector"],
    }