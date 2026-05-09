package com.emergency.emergencyservice.service;

import com.emergency.emergencyservice.dto.CreateIncidentRequest;
import com.emergency.emergencyservice.dto.IncidentResponse;
import com.emergency.emergencyservice.dto.UpdateStatusRequest;
import com.emergency.emergencyservice.entity.Incident;
import com.emergency.emergencyservice.entity.IncidentStatus;
import com.emergency.emergencyservice.entity.IncidentType;
import com.emergency.emergencyservice.event.EmergencyCreatedEvent;
import com.emergency.emergencyservice.messaging.EmergencyEventPublisher;
import com.emergency.emergencyservice.repository.IncidentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);

    private final IncidentRepository incidentRepository;
    private final EmergencyEventPublisher eventPublisher;

    public IncidentService(IncidentRepository incidentRepository,
                           EmergencyEventPublisher eventPublisher) {
        this.incidentRepository = incidentRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public IncidentResponse createIncident(CreateIncidentRequest request, UUID reporterId) {
        Incident incident = new Incident();
        incident.setType(IncidentType.valueOf(request.type()));
        incident.setStatus(IncidentStatus.REPORTED);
        incident.setSeverity(request.severity());
        incident.setDescription(request.description());
        incident.setLatitude(request.latitude());
        incident.setLongitude(request.longitude());
        incident.setAddress(request.address());
        incident.setCity(request.city() != null ? request.city() : "default");
        incident.setReporterId(reporterId);

        Incident saved = incidentRepository.save(incident);
        log.info("Incident created: {}", saved.getId());

        EmergencyCreatedEvent event = new EmergencyCreatedEvent(
                saved.getId(),
                saved.getType().name(),
                saved.getSeverity(),
                saved.getLatitude(),
                saved.getLongitude(),
                saved.getCity(),
                saved.getReporterId(),
                saved.getSeverity(),
                saved.getReportedAt()
        );

        eventPublisher.publishEmergencyCreated(event);
        return toResponse(saved);
    }

    @Transactional
    public IncidentResponse updateStatus(UUID incidentId, UpdateStatusRequest request, UUID changedBy) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found: " + incidentId));
        incident.setStatus(IncidentStatus.valueOf(request.status()));
        Incident saved = incidentRepository.save(incident);
        log.info("Incident {} status updated to {}", incidentId, request.status());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public IncidentResponse getById(UUID incidentId) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found: " + incidentId));
        return toResponse(incident);
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> getMyIncidents(UUID reporterId) {
        return incidentRepository.findByReporterId(reporterId.toString())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> getActiveIncidents(String city) {
        return incidentRepository.findByCityAndStatus(city, IncidentStatus.REPORTED)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private IncidentResponse toResponse(Incident incident) {
        return new IncidentResponse(
                incident.getId(),
                incident.getType(),
                incident.getStatus(),
                incident.getSeverity(),
                incident.getDescription(),
                incident.getReporterId(),
                incident.getLatitude(),
                incident.getLongitude(),
                incident.getAddress(),
                incident.getCity(),
                incident.getPriorityScore(),
                incident.getReportedAt()
        );
    }
}