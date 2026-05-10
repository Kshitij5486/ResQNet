import numpy as np
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ModelService:
    severity_model    = None
    forecast_model    = None
    anomaly_model     = None
    is_initialized    = False

    TYPE_WEIGHTS = {
        "FIRE":     {"FIRE": 1.0, "AMBULANCE": 0.5, "POLICE": 0.3},
        "MEDICAL":  {"AMBULANCE": 1.0, "FIRE": 0.3, "POLICE": 0.2},
        "POLICE":   {"POLICE": 1.0, "AMBULANCE": 0.3, "FIRE": 0.2},
        "DISASTER": {"FIRE": 0.95, "AMBULANCE": 0.9, "POLICE": 0.85},
    }

    CITY_BASE_RATES = {
        "mumbai":    [2,1,1,1,1,2,4,6,5,4,4,5,6,5,4,4,5,6,7,6,5,4,3,2],
        "delhi":     [1,1,1,1,1,2,3,5,4,3,3,4,5,4,3,3,4,5,6,5,4,3,2,1],
        "bangalore": [1,1,0,0,1,1,2,4,3,3,3,4,4,3,3,3,4,5,5,4,3,2,2,1],
    }

    CITY_DENSITY = {"mumbai": 1.3, "delhi": 1.1, "bangalore": 1.0}

    TYPE_BASE_SEVERITY = {
        "FIRE":     3.8,
        "MEDICAL":  3.2,
        "POLICE":   2.8,
        "DISASTER": 4.5,
    }

    RISK_HOURS = {
        "FIRE":     [11,12,13,14,21,22,23],
        "MEDICAL":  [0,1,2,3,4,22,23],
        "POLICE":   [22,23,0,1,2,3],
        "DISASTER": list(range(24)),
    }

    @classmethod
    def initialize(cls):
        if cls.is_initialized:
            return
        try:
            from sklearn.ensemble      import RandomForestClassifier, GradientBoostingRegressor, IsolationForest
            from sklearn.preprocessing import StandardScaler

            logger.info("Training enhanced severity prediction model...")
            cls._train_severity_model(RandomForestClassifier, np)

            logger.info("Training demand forecasting model...")
            cls._train_forecast_model(GradientBoostingRegressor, np)

            logger.info("Training anomaly detection model...")
            cls._train_anomaly_model(IsolationForest, StandardScaler, np)

            cls.is_initialized = True
            logger.info("All AI models initialized successfully")
        except Exception as e:
            logger.error(f"Model initialization error: {e}")
            raise

    @classmethod
    def _train_severity_model(cls, RFC, np):
        np.random.seed(42)
        n = 5000

        types  = np.random.choice([0,1,2,3], n, p=[0.3,0.4,0.2,0.1])
        cities = np.random.choice([0,1,2],   n, p=[0.4,0.35,0.25])
        hours  = np.random.randint(0, 24, n)
        days   = np.random.randint(0, 7,  n)
        is_weekend   = (days >= 5).astype(int)
        is_night     = ((hours >= 22) | (hours <= 5)).astype(int)
        is_rush_hour = ((hours >= 8) & (hours <= 10) | (hours >= 17) & (hours <= 20)).astype(int)
        city_density = np.array([1.3,1.1,1.0])[cities]

        base = np.array([3.8,3.2,2.8,4.5])[types]
        severity = np.clip(
            base
            + is_night     * 0.6
            + is_weekend   * 0.3
            + is_rush_hour * 0.4
            + (city_density - 1.0) * 0.8
            + np.random.normal(0, 0.7, n),
            1, 5
        ).astype(int)

        X = np.column_stack([types, cities, hours, days, is_weekend, is_night, is_rush_hour, city_density])
        cls.severity_model = RFC(
            n_estimators=200,
            max_depth=8,
            min_samples_split=5,
            random_state=42,
            class_weight='balanced',
        )
        cls.severity_model.fit(X, severity)
        logger.info(f"Severity model trained on {n} samples with {cls.severity_model.n_estimators} trees")

    @classmethod
    def _train_forecast_model(cls, GBR, np):
        np.random.seed(42)
        rows = []
        for city_idx, city in enumerate(["mumbai","delhi","bangalore"]):
            base = cls.CITY_BASE_RATES[city]
            density = cls.CITY_DENSITY[city]
            for day in range(60):
                for hour in range(24):
                    is_weekend   = 1 if day % 7 >= 5 else 0
                    is_rush_hour = 1 if (8 <= hour <= 10) or (17 <= hour <= 20) else 0
                    noise        = np.random.normal(0, 0.4)
                    weekend_mult = 1.3 if is_weekend else 1.0
                    val          = max(0, base[hour] * density * weekend_mult + is_rush_hour * 1.5 + noise)
                    rows.append([city_idx, hour, day % 7, is_weekend, is_rush_hour, density, val])
        arr = np.array(rows)
        cls.forecast_model = GBR(n_estimators=150, max_depth=4, random_state=42)
        cls.forecast_model.fit(arr[:, :6], arr[:, 6])
        logger.info("Demand forecast model trained on 60-day simulation")

    @classmethod
    def _train_anomaly_model(cls, IsoF, Scaler, np):
        np.random.seed(42)
        n = 1000
        # Normal operations: 1-8 incidents, 2-6 min response, 5-15 responders, 1-8 active
        normal = np.column_stack([
            np.random.uniform(1, 8,  n),
            np.random.uniform(2, 6,  n),
            np.random.uniform(5, 15, n),
            np.random.uniform(1, 8,  n),
        ])
        cls.anomaly_scaler = Scaler()
        normal_scaled = cls.anomaly_scaler.fit_transform(normal)
        cls.anomaly_model = IsoF(n_estimators=150, contamination=0.05, random_state=42)
        cls.anomaly_model.fit(normal_scaled)
        logger.info("Anomaly detection model trained on 1000 normal-operation samples")

    @classmethod
    def predict_severity(cls, type_: str, city: str, hour: int, day_of_week: int) -> dict:
        if not cls.is_initialized:
            return {"predicted_severity": 3, "confidence": 0.5, "risk_level": "MEDIUM", "reasoning": "Model initializing"}

        type_map = {"FIRE": 0, "MEDICAL": 1, "POLICE": 2, "DISASTER": 3}
        city_map = {"mumbai": 0, "delhi": 1, "bangalore": 2}
        t_idx    = type_map.get(type_, 1)
        c_idx    = city_map.get(city, 0)

        is_weekend   = 1 if day_of_week >= 5 else 0
        is_night     = 1 if hour >= 22 or hour <= 5 else 0
        is_rush_hour = 1 if (8 <= hour <= 10) or (17 <= hour <= 20) else 0
        density      = cls.CITY_DENSITY.get(city, 1.0)

        X    = [[t_idx, c_idx, hour, day_of_week, is_weekend, is_night, is_rush_hour, density]]
        pred = cls.severity_model.predict(X)[0]
        prob = cls.severity_model.predict_proba(X)[0]
        conf = float(np.max(prob))

        risk = (
            "LOW"      if pred <= 2 else
            "MEDIUM"   if pred == 3 else
            "HIGH"     if pred == 4 else
            "CRITICAL"
        )

        factors = []
        if is_night:     factors.append("late-night hours increase response complexity")
        if is_weekend:   factors.append("weekend patterns show elevated incident rates")
        if is_rush_hour: factors.append("rush hour traffic delays response time")
        if density > 1.1: factors.append(f"{city} high population density amplifies impact")

        base_reasons = {
            "FIRE":     "Fire incidents require immediate multi-unit response",
            "MEDICAL":  "Medical emergencies need specialized ambulance dispatch",
            "POLICE":   "Police incidents may escalate without rapid intervention",
            "DISASTER": "Disaster scenarios demand coordinated multi-agency response",
        }
        reasoning = base_reasons.get(type_, "Standard protocol") + (". " + "; ".join(factors).capitalize() + "." if factors else ".")

        classes    = cls.severity_model.classes_
        class_conf = {int(c): round(float(p), 3) for c, p in zip(classes, prob)}

        return {
            "predicted_severity": int(pred),
            "confidence":         round(conf, 3),
            "risk_level":         risk,
            "reasoning":          reasoning,
            "class_probabilities": class_conf,
            "factors": {
                "is_night":     bool(is_night),
                "is_weekend":   bool(is_weekend),
                "is_rush_hour": bool(is_rush_hour),
                "city_density": density,
            }
        }

    @classmethod
    def score_responders(cls, incident_type: str, lat: float, lng: float, responders: list) -> list:
        import math

        def haversine(la1, lo1, la2, lo2):
            R    = 6371
            dlat = math.radians(la2 - la1)
            dlng = math.radians(lo2 - lo1)
            a    = math.sin(dlat/2)**2 + math.cos(math.radians(la1)) * math.cos(math.radians(la2)) * math.sin(dlng/2)**2
            return R * 2 * math.asin(math.sqrt(max(0, a)))

        type_w   = cls.TYPE_WEIGHTS.get(incident_type, {})
        available = [r for r in responders if r.get("status") == "AVAILABLE"]
        scored   = []

        for r in available:
            dist         = haversine(lat, lng, r["latitude"], r["longitude"])
            dist_score   = max(0, 1 - dist / 25)
            type_score   = type_w.get(r.get("type",""), 0.5)
            speed_kmh    = 40
            est_minutes  = round((dist / speed_kmh) * 60, 1)
            final        = round(dist_score * 0.55 + type_score * 0.45, 4)

            scored.append({
                "responder_id":              r["id"],
                "name":                      r["name"],
                "type":                      r.get("type",""),
                "distance_km":               round(dist, 2),
                "score":                     final,
                "type_compatibility":        round(type_score, 3),
                "distance_score":            round(dist_score, 3),
                "estimated_arrival_minutes": est_minutes,
                "recommendation": (
                    "Optimal — best type + proximity match" if final > 0.75
                    else "Recommended — good match"         if final > 0.5
                    else "Available — acceptable match"
                ),
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        for i, r in enumerate(scored):
            r["rank"] = i + 1
        return scored

    @classmethod
    def forecast_demand(cls, city: str, hours_ahead: int = 24) -> dict:
        if not cls.is_initialized:
            return {"city": city, "forecasts": [], "peak_hour": 12, "total_predicted": 0}

        city_map = {"mumbai": 0, "delhi": 1, "bangalore": 2}
        c_idx    = city_map.get(city, 0)
        density  = cls.CITY_DENSITY.get(city, 1.0)
        now      = datetime.now()
        forecasts = []

        for h in range(hours_ahead):
            hour         = (now.hour + h) % 24
            day          = (now.weekday() + h // 24) % 7
            is_weekend   = 1 if day >= 5 else 0
            is_rush_hour = 1 if (8 <= hour <= 10) or (17 <= hour <= 20) else 0
            X            = [[c_idx, hour, day, is_weekend, is_rush_hour, density]]
            pred         = float(cls.forecast_model.predict(X)[0])
            pred         = max(0, round(pred, 2))
            base         = cls.CITY_BASE_RATES[city][hour]
            peak         = pred > base * 1.25
            conf         = round(min(0.95, 0.75 + 0.20 / (h * 0.15 + 1)), 3)
            forecasts.append({
                "hour":                hour,
                "hour_label":          f"{hour:02d}:00",
                "predicted_incidents": pred,
                "confidence":          conf,
                "peak":                peak,
                "is_rush_hour":        bool(is_rush_hour),
                "is_weekend_hour":     bool(is_weekend),
            })

        peak_h = max(forecasts, key=lambda x: x["predicted_incidents"])["hour"]
        total  = round(sum(f["predicted_incidents"] for f in forecasts), 1)
        avg    = round(total / len(forecasts), 2) if forecasts else 0

        return {
            "city":              city,
            "forecasts":         forecasts,
            "peak_hour":         peak_h,
            "peak_hour_label":   f"{peak_h:02d}:00",
            "total_predicted":   total,
            "avg_per_hour":      avg,
            "high_risk_hours":   [f["hour"] for f in forecasts if f["peak"]],
        }

    @classmethod
    def detect_anomaly(cls, incident_count: float, avg_response_time: float,
                       available_responders: float, active_incidents: float = 5.0) -> dict:
        if not cls.is_initialized:
            return {"is_anomaly": False, "anomaly_score": 0.0, "description": "Normal", "recommendation": "No action needed"}

        X      = np.array([[incident_count, avg_response_time, available_responders, active_incidents]])
        Xs     = cls.anomaly_scaler.transform(X)
        score  = float(cls.anomaly_model.score_samples(Xs)[0])
        is_ano = cls.anomaly_model.predict(Xs)[0] == -1
        norm   = round(min(1.0, max(0.0, (-score - 0.05) * 1.2)), 3)

        severity = "NORMAL" if norm < 0.3 else "ELEVATED" if norm < 0.6 else "HIGH" if norm < 0.8 else "CRITICAL"

        desc = "All systems operating within normal parameters"
        if is_ano:
            if incident_count > 10:
                desc = f"Unusually high incident volume detected ({incident_count:.0f} incidents)"
            elif available_responders < 3:
                desc = f"Critical responder shortage — only {available_responders:.0f} units available"
            elif avg_response_time > 8:
                desc = f"Response times elevated ({avg_response_time:.1f} min avg)"
            else:
                desc = "Anomalous operational pattern detected"

        rec = (
            "No action needed - continue normal operations" if not is_ano
            else "Monitor closely — situation developing"    if norm < 0.5
            else "Activate reserve units immediately"        if norm < 0.8
            else "ALERT: Declare major incident - mobilize all resources"
        )

        return {
            "is_anomaly":       bool(is_ano),
            "anomaly_score":    norm,
            "severity":         severity,
            "description":      desc,
            "recommendation":   rec,
            "metrics_analyzed": {
                "incident_count":       incident_count,
                "avg_response_time":    avg_response_time,
                "available_responders": available_responders,
                "active_incidents":     active_incidents,
            }
        }