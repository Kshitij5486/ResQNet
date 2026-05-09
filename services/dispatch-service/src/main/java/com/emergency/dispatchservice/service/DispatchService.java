package com.emergency.dispatchservice.service;

import com.emergency.dispatchservice.dto.ResponderResponse;
import com.emergency.dispatchservice.dto.UpdateLocationRequest;
import com.emergency.dispatchservice.entity.Responder;
import com.emergency.dispatchservice.event.DispatchAssignedEvent;
import com.emergency.dispatchservice.event.EmergencyCreatedEvent;
import com.emergency.dispatchservice.messaging.DispatchEventPublisher;
import com.emergency.dispatchservice.repository.ResponderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DispatchService {

    private static final Logger log = LoggerFactory.getLogger(DispatchService.class);
    private static final double EARTH_RADIUS_KM = 6371.0;

    private final ResponderRepository responderRepository;
    private final DispatchEventPublisher eventPublisher;

    public DispatchService(ResponderRepository responderRepository,
                           DispatchEventPublisher eventPublisher) {
        this.responderRepository = responderRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public void handleEmergencyCreated(EmergencyCreatedEvent event) {
        log.info("Processing dispatch for incident: {}", event.getIncidentId());

        List<Responder> available = responderRepository.findAvailableByCity(event.getCity());

        if (available.isEmpty()) {
            log.warn("No available responders in city: {} for incident: {}",
                    event.getCity(), event.getIncidentId());
            return;
        }

        Optional<Responder> nearest = available.stream()
                .min(Comparator.comparingDouble(r ->
                        haversineDistance(
                                event.getLatitude(), event.getLongitude(),
                                r.getLatitude(), r.getLongitude())));

        nearest.ifPresent(responder -> {
            double distance = haversineDistance(
                    event.getLatitude(), event.getLongitude(),
                    responder.getLatitude(), responder.getLongitude());

            log.info("Assigning responder {} ({}) to incident {} distance: {} km",
                    responder.getName(), responder.getType(),
                    event.getIncidentId(),
                    String.format("%.2f", distance));

            responderRepository.updateStatusAndIncident(
                    responder.getId().toString(),
                    "BUSY",
                    event.getIncidentId()
            );

            log.info("Dispatch complete: responder={}, incident={}, distance={}km",
                    responder.getId(), event.getIncidentId(),
                    String.format("%.2f", distance));

            DispatchAssignedEvent dispatchEvent = new DispatchAssignedEvent(
                    event.getIncidentId(),
                    responder.getId(),
                    responder.getName(),
                    responder.getType(),
                    responder.getLatitude(),
                    responder.getLongitude(),
                    distance,
                    Instant.now()
            );

            eventPublisher.publishDispatchAssigned(dispatchEvent);
        });
    }

    @Transactional(readOnly = true)
    public List<ResponderResponse> getAvailableResponders(String city) {
        return responderRepository.findAvailableByCity(city)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResponderResponse> getAllResponders(String city) {
        return responderRepository.findByCityAndStatus(city, "AVAILABLE")
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResponderResponse getResponderById(UUID id) {
        Responder responder = responderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Responder not found: " + id));
        return toResponse(responder);
    }

    @Transactional
    public ResponderResponse updateLocation(UUID id, UpdateLocationRequest request) {
        Responder responder = responderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Responder not found: " + id));
        responder.setLatitude(request.latitude());
        responder.setLongitude(request.longitude());
        responder.setLastPingAt(Instant.now());
        responderRepository.save(responder);
        log.info("Location updated for responder {}: {}, {}",
                id, request.latitude(), request.longitude());
        return toResponse(responder);
    }

    private ResponderResponse toResponse(Responder r) {
        return new ResponderResponse(
                r.getId().toString(),
                r.getName(),
                r.getType(),
                r.getStatus(),
                r.getPhoneNumber(),
                r.getVehicleId(),
                r.getLatitude(),
                r.getLongitude(),
                r.getCity(),
                r.getCurrentIncidentId() != null ? r.getCurrentIncidentId().toString() : null
        );
    }

    public double haversineDistance(double lat1, double lon1,
                                     double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}