import numpy as np
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ModelService:
    """
    AI Model Service — trains and serves all ML models for ResQNet.
    Uses scikit-learn with synthetic training data derived from
    real emergency response patterns.
    """

    severity_model    = None
    dispatch_model    = None
    forecast_model    = None
    anomaly_model     = None
    label_encoders    = {}
    is_initialized    = False

    TYPE_WEIGHTS = {
        "FIRE":     {"FIRE": 1.0, "AMBULANCE": 0.4, "POLICE": 0.3},
        "MEDICAL":  {"AMBULANCE": 1.0, "FIRE": 0.3, "POLICE": 0.2},
        "POLICE":   {"POLICE": 1.0, "AMBULANCE": 0.3, "FIRE": 0.2},
        "DISASTER": {"FIRE": 0.9, "AMBULANCE": 0.9, "POLICE": 0.8},
    }

    CITY_BASE_RATES = {
        "mumbai":    [2,1,1,1,1,2,4,6,5,4,4,5,6,5,4,4,5,6,7,6,5,4,3,2],
        "delhi":     [1,1,1,1,1,2,3,5,4,3,3,4,5,4,3,3,4,5,6,5,4,3,2,1],
        "bangalore": [1,1,0,0,1,1,2,4,3,3,3,4,4,3,3,3,4,5,5,4,3,2,2,1],
    }

    @classmethod
    def initialize(cls):
        if cls.is_initialized:
            return
        try:
            from sklearn.ensemble          import RandomForestClassifier, GradientBoostingRegressor, IsolationForest
            from sklearn.preprocessing     import LabelEncoder
            import numpy as np

            logger.info("Training severity prediction model...")
            cls._train_severity_model(RandomForestClassifier, LabelEncoder, np)

            logger.info("Training demand forecasting model...")
            cls._train_forecast_model(GradientBoostingRegressor, np)

            logger.info("Training anomaly detection model...")
            cls._train_anomaly_model(IsolationForest, np)

            cls.is_initialized = True
            logger.info("All AI models initialized successfully")
        except Exception as e:
            logger.error(f"Model initialization error: {e}")
            cls.is_initialized = False

    @classmethod
    def _train_severity_model(cls, RFC, LE, np):
        np.random.seed(42)
        n = 2000

        types  = np.random.choice([0,1,2,3], n)
        cities = np.random.choice([0,1,2],   n)
        hours  = np.random.randint(0, 24,    n)
        days   = np.random.randint(0, 7,     n)

        # Severity influenced by type, hour, city population density
        severity = np.clip(
            2
            + (types == 0) * 1.5   # FIRE higher severity
            + (types == 3) * 2.0   # DISASTER highest
            + (hours >= 22) * 0.5  # Late night
            + (hours <= 5)  * 0.3  # Early morning
            + (cities == 0) * 0.5  # Mumbai denser
            + np.random.normal(0, 0.8, n),
            1, 5
        ).astype(int)

        X = np.column_stack([types, cities, hours, days])
        cls.severity_model = RFC(n_estimators=100, random_state=42)
        cls.severity_model.fit(X, severity)

    @classmethod
    def _train_forecast_model(cls, GBR, np):
        np.random.seed(42)
        rows = []
        for city_idx, city in enumerate(["mumbai","delhi","bangalore"]):
            base = cls.CITY_BASE_RATES[city]
            for day in range(30):
                for hour in range(24):
                    noise = np.random.normal(0, 0.5)
                    val   = max(0, base[hour] + noise + (day % 7 == 4) * 1.5)
                    rows.append([city_idx, hour, day % 7, val])
        arr = np.array(rows)
        cls.forecast_model = GBR(n_estimators=100, random_state=42)
        cls.forecast_model.fit(arr[:, :3], arr[:, 3])

    @classmethod
    def _train_anomaly_model(cls, IsoF, np):
        np.random.seed(42)
        normal_data = np.random.normal(3, 1, (500, 3))
        cls.anomaly_model = IsoF(contamination=0.1, random_state=42)
        cls.anomaly_model.fit(normal_data)

    @classmethod
    def predict_severity(cls, type_: str, city: str, hour: int, day_of_week: int) -> dict:
        if not cls.is_initialized:
            return {"predicted_severity": 3, "confidence": 0.5, "risk_level": "MEDIUM", "reasoning": "Model not ready"}

        type_map = {"FIRE": 0, "MEDICAL": 1, "POLICE": 2, "DISASTER": 3}
        city_map = {"mumbai": 0, "delhi": 1, "bangalore": 2}

        X = [[type_map.get(type_, 1), city_map.get(city, 0), hour, day_of_week]]
        pred   = cls.severity_model.predict(X)[0]
        proba  = cls.severity_model.predict_proba(X)[0]
        conf   = float(np.max(proba))

        risk = "LOW" if pred <= 2 else "MEDIUM" if pred == 3 else "HIGH" if pred == 4 else "CRITICAL"

        reasons = {
            "FIRE":     "Fire incidents have high resource demand and spread risk",
            "MEDICAL":  "Medical emergencies require immediate specialized response",
            "POLICE":   "Police incidents may escalate without quick intervention",
            "DISASTER": "Disaster scenarios require multi-unit coordinated response",
        }

        return {
            "predicted_severity": int(pred),
            "confidence":         round(conf, 3),
            "risk_level":         risk,
            "reasoning":          reasons.get(type_, "Standard emergency protocol"),
        }

    @classmethod
    def score_responders(cls, incident_type: str, incident_lat: float, incident_lng: float, responders: list) -> list:
        import math

        def haversine(lat1, lng1, lat2, lng2):
            R    = 6371
            dlat = math.radians(lat2 - lat1)
            dlng = math.radians(lng2 - lng1)
            a    = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
            return R * 2 * math.asin(math.sqrt(a))

        type_w = cls.TYPE_WEIGHTS.get(incident_type, {"AMBULANCE": 1.0, "FIRE": 1.0, "POLICE": 1.0})
        scored = []

        for r in responders:
            if r.get("status") != "AVAILABLE":
                continue
            dist    = haversine(incident_lat, incident_lng, r["latitude"], r["longitude"])
            dist_score = max(0, 1 - dist / 20)
            type_score = type_w.get(r["type"], 0.5)
            final_score = round(dist_score * 0.6 + type_score * 0.4, 4)
            scored.append({
                "responder_id":   r["id"],
                "name":           r["name"],
                "type":           r["type"],
                "distance_km":    round(dist, 2),
                "score":          final_score,
                "recommendation": "Optimal match" if final_score > 0.7 else "Good match" if final_score > 0.4 else "Available",
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        for i, r in enumerate(scored):
            r["rank"] = i + 1
        return scored

    @classmethod
    def forecast_demand(cls, city: str, hours_ahead: int = 24) -> dict:
        if not cls.is_initialized:
            return {"city": city, "forecasts": [], "peak_hour": 12, "total_predicted": 0}

        city_map  = {"mumbai": 0, "delhi": 1, "bangalore": 2}
        city_idx  = city_map.get(city, 0)
        now       = datetime.now()
        forecasts = []

        for h in range(hours_ahead):
            hour    = (now.hour + h) % 24
            day     = now.weekday()
            pred    = float(cls.forecast_model.predict([[city_idx, hour, day]])[0])
            pred    = max(0, round(pred, 2))
            base    = cls.CITY_BASE_RATES[city][hour]
            peak    = pred > base * 1.3
            conf    = min(0.95, 0.7 + (1 / (h + 1)) * 0.25)
            forecasts.append({"hour": hour, "predicted_incidents": pred, "confidence": round(conf, 2), "peak": peak})

        peak_h = max(forecasts, key=lambda x: x["predicted_incidents"])["hour"]
        total  = sum(f["predicted_incidents"] for f in forecasts)
        return {"city": city, "forecasts": forecasts, "peak_hour": peak_h, "total_predicted": round(total, 1)}

    @classmethod
    def detect_anomaly(cls, incident_count: float, avg_response_time: float, available_responders: float) -> dict:
        if not cls.is_initialized:
            return {"is_anomaly": False, "anomaly_score": 0.0, "description": "Normal", "affected_city": None, "recommendation": "No action needed"}

        import numpy as np
        X      = np.array([[incident_count, avg_response_time, available_responders]])
        score  = float(cls.anomaly_model.score_samples(X)[0])
        is_ano = cls.anomaly_model.predict(X)[0] == -1
        norm_score = min(1.0, max(0.0, (-score + 0.5) * 2))

        desc = "Normal operations" if not is_ano else (
            "High incident volume detected" if incident_count > 8
            else "Low responder availability" if available_responders < 3
            else "Unusual response time pattern"
        )
        rec = "No action needed" if not is_ano else "Consider activating reserve units"

        return {
            "is_anomaly":       is_ano,
            "anomaly_score":    round(norm_score, 3),
            "description":      desc,
            "affected_city":    None,
            "recommendation":   rec,
        }