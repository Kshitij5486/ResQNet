package com.emergency.dispatchservice.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AiServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(AiServiceClient.class);
    private static final String AI_BASE_URL = "http://localhost:8084";
    private static final Duration TIMEOUT    = Duration.ofSeconds(3);

    private final WebClient webClient;

    public AiServiceClient(WebClient.Builder builder) {
        this.webClient = builder.baseUrl(AI_BASE_URL).build();
    }

    public AiDispatchResponse scoreDispatch(
            UUID   incidentId,
            String incidentType,
            String city,
            double latitude,
            double longitude,
            int    severity
    ) {
        Map<String, Object> body = new HashMap<>();
        body.put("incident_id",   incidentId.toString());
        body.put("incident_type", incidentType);
        body.put("city",          city.toLowerCase());
        body.put("latitude",      latitude);
        body.put("longitude",     longitude);
        body.put("severity",      severity);

        try {
            AiDispatchResponse response = webClient.post()
                .uri("/api/ai/dispatch/score")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(AiDispatchResponse.class)
                .timeout(TIMEOUT)
                .block();

            if (response != null && response.bestResponderId() != null) {
                logger.info("AI dispatch score: best={} confidence={} eta={}min",
                    response.bestResponderName(),
                    response.aiConfidence(),
                    response.estimatedArrivalMinutes());
            }
            return response;

        } catch (WebClientResponseException e) {
            logger.warn("AI service returned error {}: {}", e.getStatusCode(), e.getMessage());
            return null;
        } catch (Exception e) {
            logger.warn("AI service unavailable, falling back to Haversine: {}", e.getMessage());
            return null;
        }
    }

    public AiSeverityResponse predictSeverity(String incidentType, String city, int hour, int dayOfWeek) {
        Map<String, Object> body = new HashMap<>();
        body.put("type",        incidentType);
        body.put("city",        city.toLowerCase());
        body.put("hour",        hour);
        body.put("day_of_week", dayOfWeek);

        try {
            return webClient.post()
                .uri("/api/ai/predict/severity")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(AiSeverityResponse.class)
                .timeout(TIMEOUT)
                .block();
        } catch (Exception e) {
            logger.warn("AI severity prediction failed: {}", e.getMessage());
            return null;
        }
    }

    public boolean isAvailable() {
        try {
            webClient.get()
                .uri("/api/ai/health")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(2))
                .block();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}