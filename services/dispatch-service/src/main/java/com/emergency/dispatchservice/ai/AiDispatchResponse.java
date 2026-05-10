package com.emergency.dispatchservice.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiDispatchResponse(
    @JsonProperty("incident_id")               String incidentId,
    @JsonProperty("incident_type")             String incidentType,
    @JsonProperty("city")                      String city,
    @JsonProperty("severity")                  Integer severity,
    @JsonProperty("ranked_responders")         List<RankedResponder> rankedResponders,
    @JsonProperty("best_responder_id")         String bestResponderId,
    @JsonProperty("best_responder_name")       String bestResponderName,
    @JsonProperty("best_responder_type")       String bestResponderType,
    @JsonProperty("estimated_arrival_minutes") Double estimatedArrivalMinutes,
    @JsonProperty("ai_confidence")             Double aiConfidence,
    @JsonProperty("total_candidates")          Integer totalCandidates,
    @JsonProperty("recommendation")            String recommendation,
    @JsonProperty("severity_prediction")       Map<String, Object> severityPrediction
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RankedResponder(
        @JsonProperty("responder_id")              String responderId,
        @JsonProperty("name")                      String name,
        @JsonProperty("type")                      String type,
        @JsonProperty("distance_km")               Double distanceKm,
        @JsonProperty("score")                     Double score,
        @JsonProperty("rank")                      Integer rank,
        @JsonProperty("estimated_arrival_minutes") Double estimatedArrivalMinutes,
        @JsonProperty("recommendation")            String recommendation
    ) {}
}