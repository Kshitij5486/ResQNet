from fastapi import APIRouter
from app.services.model_service import ModelService
import httpx

router = APIRouter()

DISPATCH_SERVICE_URL = "http://localhost:8083"

@router.post("/dispatch/score")
async def score_dispatch(req: dict):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{DISPATCH_SERVICE_URL}/api/responders/available",
                params={"city": req.get("city", "mumbai")}
            )
            responders = resp.json() if resp.status_code == 200 else []
    except Exception:
        responders = []

    scored = ModelService.score_responders(
        incident_type=req.get("incident_type", "MEDICAL"),
        lat=req.get("latitude", 19.0760),
        lng=req.get("longitude", 72.8777),
        responders=responders,
    )

    best = scored[0] if scored else None

    return {
        "incident_id":               req.get("incident_id", ""),
        "ranked_responders":         scored[:5],
        "best_responder_id":         best["responder_id"] if best else None,
        "estimated_arrival_minutes": best["estimated_arrival_minutes"] if best else 0,
        "ai_confidence":             round(best["score"], 3) if best else 0,
        "total_candidates":          len(scored),
    }