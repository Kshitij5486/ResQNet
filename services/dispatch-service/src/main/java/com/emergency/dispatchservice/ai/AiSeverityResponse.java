package com.emergency.dispatchservice.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiSeverityResponse(
    @JsonProperty("predicted_severity") Integer predictedSeverity,
    @JsonProperty("confidence")         Double confidence,
    @JsonProperty("risk_level")         String riskLevel,
    @JsonProperty("reasoning")          String reasoning
) {}