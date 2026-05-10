package com.emergency.dispatchservice.controller;

import com.emergency.dispatchservice.ai.AiServiceClient;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.ListConsumerGroupOffsetsResult;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/monitoring")
public class KafkaMonitoringController {

    private static final Logger log = LoggerFactory.getLogger(KafkaMonitoringController.class);

    private final AdminClient    adminClient;
    private final AiServiceClient aiServiceClient;

    private static final List<String> CONSUMER_GROUPS = List.of(
            "dispatch-service-group",
            "dispatch-dlt-group"
    );

    public KafkaMonitoringController(AdminClient adminClient, AiServiceClient aiServiceClient) {
        this.adminClient     = adminClient;
        this.aiServiceClient = aiServiceClient;
    }

    @GetMapping("/kafka/lag")
    public ResponseEntity<Map<String, Object>> getConsumerLag() {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> groupStats = new ArrayList<>();

        for (String groupId : CONSUMER_GROUPS) {
            try {
                Map<String, Object> groupInfo = new HashMap<>();
                groupInfo.put("groupId", groupId);

                ListConsumerGroupOffsetsResult offsetsResult =
                        adminClient.listConsumerGroupOffsets(groupId);

                Map<TopicPartition, OffsetAndMetadata> committedOffsets =
                        offsetsResult.partitionsToOffsetAndMetadata().get();

                Map<TopicPartition, Long> endOffsets =
                        adminClient.listOffsets(
                                committedOffsets.entrySet().stream()
                                        .collect(java.util.stream.Collectors.toMap(
                                                Map.Entry::getKey,
                                                e -> org.apache.kafka.clients.admin.OffsetSpec.latest()
                                        ))
                        ).all().get().entrySet().stream()
                        .collect(java.util.stream.Collectors.toMap(
                                Map.Entry::getKey,
                                e -> e.getValue().offset()
                        ));

                List<Map<String, Object>> partitionLags = new ArrayList<>();
                long totalLag = 0;

                for (Map.Entry<TopicPartition, OffsetAndMetadata> entry : committedOffsets.entrySet()) {
                    TopicPartition tp        = entry.getKey();
                    long           committed = entry.getValue().offset();
                    long           end       = endOffsets.getOrDefault(tp, committed);
                    long           lag       = Math.max(0, end - committed);
                    totalLag += lag;

                    Map<String, Object> partitionInfo = new HashMap<>();
                    partitionInfo.put("topic",           tp.topic());
                    partitionInfo.put("partition",        tp.partition());
                    partitionInfo.put("committedOffset",  committed);
                    partitionInfo.put("endOffset",        end);
                    partitionInfo.put("lag",              lag);
                    partitionLags.add(partitionInfo);
                }

                groupInfo.put("totalLag",   totalLag);
                groupInfo.put("partitions", partitionLags);
                groupInfo.put("status",     totalLag == 0 ? "HEALTHY" : "LAGGING");
                groupStats.add(groupInfo);

            } catch (InterruptedException | ExecutionException e) {
                log.error("Error fetching lag for group {}: {}", groupId, e.getMessage());
                Map<String, Object> errorInfo = new HashMap<>();
                errorInfo.put("groupId", groupId);
                errorInfo.put("error",   e.getMessage());
                groupStats.add(errorInfo);
            }
        }

        result.put("consumerGroups", groupStats);
        result.put("timestamp",      java.time.Instant.now().toString());
        result.put("overallStatus",  groupStats.stream()
                .anyMatch(g -> "LAGGING".equals(g.get("status"))) ? "LAGGING" : "HEALTHY");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/kafka/topics")
    public ResponseEntity<Map<String, Object>> getTopics() {
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("topics",    adminClient.listTopics().names().get());
            result.put("timestamp", java.time.Instant.now().toString());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "service",   "dispatch-service",
                "kafka",     "connected",
                "status",    "UP",
                "timestamp", java.time.Instant.now().toString()
        ));
    }

    @GetMapping("/ai")
    public ResponseEntity<Map<String, Object>> aiIntegration() {
        boolean available = aiServiceClient.isAvailable();
        return ResponseEntity.ok(Map.of(
                "ai_service",  "ResQNet AI Service v1.0",
                "status",      available ? "CONNECTED" : "UNAVAILABLE",
                "url",         "http://localhost:8084",
                "models",      List.of("severity_predictor","dispatch_scorer","demand_forecaster","anomaly_detector"),
                "integration", "Java Spring Boot -> Python FastAPI"
        ));
    }
}