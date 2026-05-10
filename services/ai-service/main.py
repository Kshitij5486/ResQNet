from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.routers import health, predict, dispatch, forecast, analytics, events
from app.services.model_service import ModelService
from app.services.kafka_consumer import kafka_consumer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ResQNet AI Service v1.0...")

    logger.info("Initializing ML models...")
    ModelService.initialize()
    logger.info("All ML models ready")

    logger.info("Starting Kafka consumer...")
    kafka_consumer.start()
    logger.info("Kafka consumer started (connects async)")

    yield

    logger.info("Shutting down...")
    kafka_consumer.stop()

app = FastAPI(
    title="ResQNet AI Service",
    description="AI/ML intelligence layer — severity prediction, smart dispatch, demand forecasting, anomaly detection",
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

app.include_router(health.router,    prefix="/api/ai", tags=["Health"])
app.include_router(predict.router,   prefix="/api/ai", tags=["Prediction"])
app.include_router(dispatch.router,  prefix="/api/ai", tags=["Dispatch"])
app.include_router(forecast.router,  prefix="/api/ai", tags=["Forecast"])
app.include_router(analytics.router, prefix="/api/ai", tags=["Analytics"])
app.include_router(events.router,    prefix="/api/ai", tags=["Events"])

@app.get("/")
def root():
    return {
        "service":  "ResQNet AI Service",
        "version":  "1.0.0",
        "status":   "operational",
        "models":   ["severity_predictor","dispatch_scorer","demand_forecaster","anomaly_detector"],
        "kafka":    kafka_consumer.get_status(),
        "docs":     "/docs",
    }