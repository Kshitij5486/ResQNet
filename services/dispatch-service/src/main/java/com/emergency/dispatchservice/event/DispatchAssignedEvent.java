package com.emergency.dispatchservice.event;

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

    public DispatchAssignedEvent(UUID incidentId, UUID responderId,
                                  String responderName, String responderType,
                                  double responderLat, double responderLon,
                                  double distanceKm, Instant assignedAt) {
        this.incidentId = incidentId;
        this.responderId = responderId;
        this.responderName = responderName;
        this.responderType = responderType;
        this.responderLat = responderLat;
        this.responderLon = responderLon;
        this.distanceKm = distanceKm;
        this.assignedAt = assignedAt;
    }

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

    @Override
    public String toString() {
        return "DispatchAssignedEvent{incidentId=" + incidentId +
               ", responderId=" + responderId +
               ", responderName=" + responderName + "}";
    }
}