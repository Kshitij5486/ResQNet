package com.emergency.emergencyservice.event;

import java.time.Instant;
import java.util.UUID;

public class DispatchAssignedEvent {

    private UUID incidentId;
    private UUID responderId;
    private String responderName;
    private String responderType;
    private double responderLat;
    private double responderLon;
    private double distanceKm;
    private Instant assignedAt;

    public DispatchAssignedEvent() {}

    public UUID getIncidentId() { return incidentId; }
    public void setIncidentId(UUID incidentId) { this.incidentId = incidentId; }
    public UUID getResponderId() { return responderId; }
    public void setResponderId(UUID responderId) { this.responderId = responderId; }
    public String getResponderName() { return responderName; }
    public void setResponderName(String responderName) { this.responderName = responderName; }
    public String getResponderType() { return responderType; }
    public void setResponderType(String responderType) { this.responderType = responderType; }
    public double getResponderLat() { return responderLat; }
    public void setResponderLat(double responderLat) { this.responderLat = responderLat; }
    public double getResponderLon() { return responderLon; }
    public void setResponderLon(double responderLon) { this.responderLon = responderLon; }
    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }
    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }
}