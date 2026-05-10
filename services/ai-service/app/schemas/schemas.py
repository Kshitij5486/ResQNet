from pydantic import BaseModel
from typing import Optional, List, Dict
from enum import Enum

class IncidentType(str, Enum):
    FIRE     = "FIRE"
    MEDICAL  = "MEDICAL"
    POLICE   = "POLICE"
    DISASTER = "DISASTER"

class City(str, Enum):
    MUMBAI    = "mumbai"
    DELHI     = "delhi"
    BANGALORE = "bangalore"

class SeverityRequest(BaseModel):
    type:        IncidentType
    city:        City
    hour:        int
    day_of_week: int

class SeverityResponse(BaseModel):
    predicted_severity:   int
    confidence:           float
    risk_level:           str
    reasoning:            str
    class_probabilities:  Optional[Dict[int, float]] = None
    factors:              Optional[Dict]              = None

class ResponderScore(BaseModel):
    responder_id:              str
    name:                      str
    type:                      str
    distance_km:               float
    score:                     float
    rank:                      int
    type_compatibility:        Optional[float] = None
    distance_score:            Optional[float] = None
    estimated_arrival_minutes: Optional[float] = None
    recommendation:            str

class DispatchRequest(BaseModel):
    incident_id:   str
    incident_type: IncidentType
    city:          City
    latitude:      float
    longitude:     float
    severity:      int

class HourlyForecast(BaseModel):
    hour:                int
    hour_label:          Optional[str] = None
    predicted_incidents: float
    confidence:          float
    peak:                bool
    is_rush_hour:        Optional[bool] = None
    is_weekend_hour:     Optional[bool] = None

class ForecastResponse(BaseModel):
    city:             str
    forecasts:        List[HourlyForecast]
    peak_hour:        int
    peak_hour_label:  Optional[str] = None
    total_predicted:  float
    avg_per_hour:     Optional[float] = None
    high_risk_hours:  Optional[List[int]] = None