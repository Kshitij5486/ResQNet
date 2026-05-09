package com.emergency.emergencyservice.consumer;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class DispatchDltConsumer {

    private static final Logger log = LoggerFactory.getLogger(DispatchDltConsumer.class);

    @KafkaListener(
        topics = "dispatch-updates-dlt",
        groupId = "emergency-dlt-group"
    )
    public void consumeDeadLetter(ConsumerRecord<String, String> record) {
        log.error("DEAD LETTER on dispatch-updates-dlt: topic={}, partition={}, offset={}, key={}",
                record.topic(),
                record.partition(),
                record.offset(),
                record.key());
    }
}