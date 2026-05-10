from fastapi import APIRouter
from app.schemas.schemas import DispatchRequest, DispatchResponse, ResponderScore
from app.services.model_service import ModelService
import httpx

router = APIRouter()

DISPATCH_SERVICE_URL = "http://localhost:8083"

@router.post("/dispatch/score")
async def score_dispatch(req: DispatchRequest):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{DISPATCH_SERVICE_URL}/api/responders/available",
                params={"city": req.city.value}
            )
            responders = resp.json() if resp.status_code == 200 else []
    except Exception:
        responders = []

    scored = ModelService.score_responders(
        incident_type=req.incident_type.value,
        incident_lat=req.latitude,
        incident_lng=req.longitude,
        responders=responders,
    )

    best_id  = scored[0]["responder_id"] if scored else None
    est_time = round(scored[0]["distance_km"] / 40 * 60, 1) if scored else 0

    return {
        "incident_id":               req.incident_id,
        "ranked_responders":         scored[:5],
        "best_responder_id":         best_id,
        "estimated_arrival_minutes": est_time,
        "ai_confidence":             round(scored[0]["score"], 3) if scored else 0,
        "total_candidates":          len(scored),
    }