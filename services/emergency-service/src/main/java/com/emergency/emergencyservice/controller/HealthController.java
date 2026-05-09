package com.emergency.emergencyservice.controller;

import com.emergency.emergencyservice.repository.IncidentRepository;
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

    private final IncidentRepository incidentRepository;

    public HealthController(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("service", "emergency-service");
        health.put("version", "1.0.0");
        health.put("timestamp", Instant.now().toString());

        try {
            long totalIncidents = incidentRepository.count();
            health.put("status", "UP");
            health.put("database", "CONNECTED");
            health.put("totalIncidents", totalIncidents);
        } catch (Exception e) {
            health.put("status", "DEGRADED");
            health.put("database", "ERROR: " + e.getMessage());
        }

        return ResponseEntity.ok(health);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("service", "emergency-service");
        stats.put("timestamp", Instant.now().toString());

        try {
            long total = incidentRepository.count();
            long reported = incidentRepository.findByStatus(
                    com.emergency.emergencyservice.entity.IncidentStatus.REPORTED).size();
            long dispatched = incidentRepository.findByStatus(
                    com.emergency.emergencyservice.entity.IncidentStatus.DISPATCHED).size();

            stats.put("totalIncidents", total);
            stats.put("reported", reported);
            stats.put("dispatched", dispatched);
            stats.put("status", "UP");
        } catch (Exception e) {
            stats.put("status", "DEGRADED");
            stats.put("error", e.getMessage());
        }

        return ResponseEntity.ok(stats);
    }
}