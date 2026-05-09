package com.emergency.dispatchservice.messaging;

import com.emergency.dispatchservice.event.DispatchAssignedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
public class DispatchEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(DispatchEventPublisher.class);
    private static final String TOPIC = "dispatch-updates";

    private final KafkaTemplate<String, DispatchAssignedEvent> kafkaTemplate;

    public DispatchEventPublisher(KafkaTemplate<String, DispatchAssignedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishDispatchAssigned(DispatchAssignedEvent event) {
        String key = event.getIncidentId().toString();

        CompletableFuture<SendResult<String, DispatchAssignedEvent>> future =
                kafkaTemplate.send(TOPIC, key, event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish dispatch event for incident {}: {}",
                        event.getIncidentId(), ex.getMessage());
            } else {
                log.info("Published dispatch event: incidentId={}, responder={}, partition={}, offset={}",
                        event.getIncidentId(),
                        event.getResponderName(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}