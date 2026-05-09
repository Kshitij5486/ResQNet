package com.emergency.dispatchservice.controller;

import com.emergency.dispatchservice.repository.ResponderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final ResponderRepository responderRepository;

    public HealthController(ResponderRepository responderRepository) {
        this.responderRepository = responderRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("service", "dispatch-service");
        health.put("version", "1.0.0");
        health.put("timestamp", Instant.now().toString());

        try {
            long total = responderRepository.count();
            health.put("status", "UP");
            health.put("database", "CONNECTED");
            health.put("totalResponders", total);
        } catch (Exception e) {
            health.put("status", "DEGRADED");
            health.put("database", "ERROR: " + e.getMessage());
        }

        return ResponseEntity.ok(health);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("service", "dispatch-service");
        stats.put("timestamp", Instant.now().toString());

        try {
            long total = responderRepository.count();
            long availableMumbai = responderRepository.findAvailableByCity("mumbai").size();
            long availableDelhi = responderRepository.findAvailableByCity("delhi").size();
            long availableBangalore = responderRepository.findAvailableByCity("bangalore").size();

            Map<String, Object> cities = new HashMap<>();
            cities.put("mumbai", Map.of("available", availableMumbai));
            cities.put("delhi", Map.of("available", availableDelhi));
            cities.put("bangalore", Map.of("available", availableBangalore));

            stats.put("totalResponders", total);
            stats.put("cities", cities);
            stats.put("status", "UP");
        } catch (Exception e) {
            stats.put("status", "DEGRADED");
            stats.put("error", e.getMessage());
        }

        return ResponseEntity.ok(stats);
    }
}