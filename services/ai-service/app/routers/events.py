from fastapi import APIRouter
from app.services.kafka_consumer import kafka_consumer, event_store
from datetime import datetime

router = APIRouter()

@router.get("/events/status")
def kafka_status():
    status  = kafka_consumer.get_status()
    stats   = event_store.get_stats()
    return {
        "kafka_consumer":  status,
        "event_processing": stats,
        "service":         "ai-service",
        "generated_at":    datetime.utcnow().isoformat() + "Z",
    }

@router.get("/events/recent")
def recent_events(n: int = 10):
    events = event_store.get_recent(n)
    return {
        "events":      events,
        "count":       len(events),
        "total_processed": event_store.get_stats()["total_events_processed"],
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }

@router.get("/events/stats")
def event_stats():
    stats = event_store.get_stats()
    consumer_status = kafka_consumer.get_status()
    return {
        **stats,
        "consumer_mode":    consumer_status["mode"],
        "consumer_running": consumer_status["running"],
        "generated_at":     datetime.utcnow().isoformat() + "Z",
    }

@router.post("/events/simulate")
def simulate_event(
    incident_type: str = "FIRE",
    city:          str = "mumbai",
    severity:      int = 4,
    latitude:      float = 19.0760,
    longitude:     float = 72.8777,
):
    """Simulate an emergency event for testing when Kafka is not available"""
    from app.services.model_service import ModelService
    from datetime import datetime

    now        = datetime.now()
    prediction = ModelService.predict_severity(
        type_=incident_type.upper(),
        city=city.lower(),
        hour=now.hour,
        day_of_week=now.weekday(),
    )

    event = {
        "incident_id": f"sim-{int(now.timestamp())}",
        "type":        incident_type.upper(),
        "city":        city.lower(),
        "latitude":    latitude,
        "longitude":   longitude,
        "severity":    severity,
        "kafka_offset":    -1,
        "kafka_partition": -1,
        "simulated":   True,
    }

    event_store.add_event(event, prediction)

    return {
        "message":     "Event simulated and processed",
        "event":       event,
        "ai_result":   prediction,
        "stored":      True,
        "generated_at": now.isoformat() + "Z",
    }