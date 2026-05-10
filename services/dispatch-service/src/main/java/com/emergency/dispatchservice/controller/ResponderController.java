package com.emergency.dispatchservice.controller;

import com.emergency.dispatchservice.dto.ResponderResponse;
import com.emergency.dispatchservice.dto.UpdateLocationRequest;
import com.emergency.dispatchservice.service.DispatchService;
import com.emergency.dispatchservice.ai.AiServiceClient;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/responders")
public class ResponderController {

    private final DispatchService dispatchService;

    public ResponderController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @GetMapping("/available")
    public ResponseEntity<List<ResponderResponse>> getAvailable(@RequestParam String city) {
        return ResponseEntity.ok(dispatchService.getAvailableResponders(city));
    }

    @GetMapping
    public ResponseEntity<List<ResponderResponse>> getAll(@RequestParam String city) {
        return ResponseEntity.ok(dispatchService.getAllResponders(city));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponderResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(dispatchService.getResponderById(id));
    }

    @PatchMapping("/{id}/location")
    public ResponseEntity<ResponderResponse> updateLocation(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLocationRequest request) {
        return ResponseEntity.ok(dispatchService.updateLocation(id, request));
    }

    @PostMapping("/{id}/ping")
    public ResponseEntity<Map<String, Object>> ping(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLocationRequest request) {
        ResponderResponse updated = dispatchService.pingLocation(id, request);
        return ResponseEntity.ok(Map.of(
                "responderId", updated.id(),
                "latitude", updated.latitude(),
                "longitude", updated.longitude(),
                "status", updated.status(),
                "message", "Location updated successfully"
        ));
    }

    @GetMapping("/ai-status")
    public ResponseEntity<Map<String, Object>> aiStatus() {
        boolean available = aiServiceClient.isAvailable();
        return ResponseEntity.ok(Map.of(
            "ai_service_available", available,
            "ai_service_url",       "http://localhost:8084",
            "integration",          "active"
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "service", "dispatch-service",
                "status", "UP",
                "version", "1.0.0"
        ));
    }
}