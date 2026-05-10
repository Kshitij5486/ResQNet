from pydantic import BaseModel
from typing import Optional, List
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
    hour:        int  # 0-23
    day_of_week: int  # 0=Monday

class SeverityResponse(BaseModel):
    predicted_severity: int
    confidence:         float
    risk_level:         str
    reasoning:          str

class ResponderScore(BaseModel):
    responder_id:   str
    name:           str
    type:           str
    distance_km:    float
    score:          float
    rank:           int
    recommendation: str

class DispatchRequest(BaseModel):
    incident_id:   str
    incident_type: IncidentType
    city:          City
    latitude:      float
    longitude:     float
    severity:      int

class DispatchResponse(BaseModel):
    incident_id:  str
    ranked_responders: List[ResponderScore]
    best_responder_id: str
    estimated_arrival_minutes: float
    ai_confidence: float

class ForecastRequest(BaseModel):
    city:         City
    hours_ahead:  int = 24

class HourlyForecast(BaseModel):
    hour:             int
    predicted_incidents: float
    confidence:       float
    peak:             bool

class ForecastResponse(BaseModel):
    city:      str
    forecasts: List[HourlyForecast]
    peak_hour: int
    total_predicted: float

class AnomalyResponse(BaseModel):
    is_anomaly:   bool
    anomaly_score: float
    description:  str
    affected_city: Optional[str]
    recommendation: str