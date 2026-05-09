package com.emergency.emergencyservice.consumer;

import com.emergency.emergencyservice.entity.IncidentStatus;
import com.emergency.emergencyservice.event.DispatchAssignedEvent;
import com.emergency.emergencyservice.repository.IncidentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DispatchUpdateConsumer {

    private static final Logger log = LoggerFactory.getLogger(DispatchUpdateConsumer.class);

    private final IncidentRepository incidentRepository;

    public DispatchUpdateConsumer(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    @KafkaListener(
        topics = "dispatch-updates",
        groupId = "emergency-service-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional
    public void consumeDispatchAssigned(
            @Payload DispatchAssignedEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Received dispatch update: incidentId={}, responder={}, partition={}, offset={}",
                event.getIncidentId(), event.getResponderName(), partition, offset);

        incidentRepository.findById(event.getIncidentId()).ifPresent(incident -> {
            incident.setStatus(IncidentStatus.DISPATCHED);
            incident.setAssignedResponderId(event.getResponderId());
            incidentRepository.save(incident);

            log.info("Incident {} status updated to DISPATCHED, assigned to responder {}",
                    event.getIncidentId(), event.getResponderName());
        });
    }
}