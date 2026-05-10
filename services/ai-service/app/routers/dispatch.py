from fastapi import APIRouter, HTTPException
from app.services.model_service import ModelService
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

DISPATCH_URL = "http://localhost:8083"

@router.post("/dispatch/score")
async def score_dispatch(req: dict):
    city          = req.get("city", "mumbai")
    incident_type = req.get("incident_type", "MEDICAL")
    lat           = req.get("latitude",  19.0760)
    lng           = req.get("longitude", 72.8777)
    severity      = req.get("severity",  3)
    incident_id   = req.get("incident_id", "")

    # Fetch available responders from Dispatch Service
    responders = []
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{DISPATCH_URL}/api/responders/available",
                params={"city": city}
            )
            if resp.status_code == 200:
                responders = resp.json()
                logger.info(f"Fetched {len(responders)} available responders for {city}")
    except Exception as e:
        logger.warning(f"Could not fetch responders: {e}")

    # Score responders using AI model
    scored = ModelService.score_responders(
        incident_type=incident_type,
        lat=lat,
        lng=lng,
        responders=responders,
    )

    # Also get severity prediction
    from datetime import datetime
    now          = datetime.now()
    sev_pred     = ModelService.predict_severity(
        type_=incident_type,
        city=city,
        hour=now.hour,
        day_of_week=now.weekday(),
    )

    best     = scored[0] if scored else None
    est_time = best["estimated_arrival_minutes"] if best else 0

    return {
        "incident_id":               incident_id,
        "incident_type":             incident_type,
        "city":                      city,
        "severity":                  severity,
        "ranked_responders":         scored[:5],
        "best_responder_id":         best["responder_id"] if best else None,
        "best_responder_name":       best["name"]         if best else None,
        "best_responder_type":       best["type"]         if best else None,
        "estimated_arrival_minutes": est_time,
        "ai_confidence":             round(best["score"], 3) if best else 0,
        "total_candidates":          len(scored),
        "total_available":           len(responders),
        "severity_prediction":       sev_pred,
        "recommendation":            best["recommendation"] if best else "No available responders",
    }

@router.get("/dispatch/available/{city}")
async def get_available_with_scores(city: str, incident_type: str = "MEDICAL", lat: float = 0, lng: float = 0):
    responders = []
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{DISPATCH_URL}/api/responders/available",
                params={"city": city}
            )
            if resp.status_code == 200:
                responders = resp.json()
    except Exception as e:
        logger.warning(f"Could not fetch responders: {e}")

    # Use city center if no coords given
    city_centers = {
        "mumbai":    (19.0760, 72.8777),
        "delhi":     (28.6139, 77.2090),
        "bangalore": (12.9716, 77.5946),
    }
    if lat == 0 or lng == 0:
        lat, lng = city_centers.get(city.lower(), (19.0760, 72.8777))

    scored = ModelService.score_responders(
        incident_type=incident_type,
        lat=lat,
        lng=lng,
        responders=responders,
    )

    return {
        "city":              city,
        "incident_type":     incident_type,
        "total_available":   len(responders),
        "ranked_responders": scored,
        "reference_point":   {"latitude": lat, "longitude": lng},
    }

@router.get("/dispatch/stats")
async def dispatch_stats():
    stats = {}
    city_centers = {
        "mumbai":    (19.0760, 72.8777),
        "delhi":     (28.6139, 77.2090),
        "bangalore": (12.9716, 77.5946),
    }
    total_available = 0
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            for city, (clat, clng) in city_centers.items():
                resp = await client.get(
                    f"{DISPATCH_URL}/api/responders/available",
                    params={"city": city}
                )
                if resp.status_code == 200:
                    avail = resp.json()
                    total_available += len(avail)
                    stats[city] = {
                        "available": len(avail),
                        "types":     list(set(r.get("type","") for r in avail)),
                    }
    except Exception as e:
        logger.warning(f"Could not fetch dispatch stats: {e}")

    return {
        "total_available_responders": total_available,
        "by_city":                    stats,
        "dispatch_service_url":       DISPATCH_URL,
        "ai_scoring":                 "active",
    }