import json
import logging
import threading
from datetime import datetime
from typing import Dict, List, Optional
from collections import deque

logger = logging.getLogger(__name__)

class EventStore:
    """In-memory store for processed Kafka events"""
    
    def __init__(self, maxlen: int = 100):
        self.events:       deque = deque(maxlen=maxlen)
        self.predictions:  deque = deque(maxlen=100)
        self.stats: Dict = {
            "total_events_processed":  0,
            "total_predictions_made":  0,
            "avg_predicted_severity":  0.0,
            "last_event_at":           None,
            "events_per_type":         {"FIRE":0,"MEDICAL":0,"POLICE":0,"DISASTER":0},
            "events_per_city":         {"mumbai":0,"delhi":0,"bangalore":0},
            "high_severity_count":     0,
        }
        self._lock = threading.Lock()

    def add_event(self, event: dict, prediction: dict):
        with self._lock:
            enriched = {
                **event,
                "ai_prediction":  prediction,
                "processed_at":   datetime.utcnow().isoformat() + "Z",
            }
            self.events.append(enriched)
            self.predictions.append(prediction)

            self.stats["total_events_processed"] += 1
            self.stats["total_predictions_made"] += 1
            self.stats["last_event_at"] = datetime.utcnow().isoformat() + "Z"

            t = event.get("type", "MEDICAL")
            c = event.get("city", "mumbai").lower()
            if t in self.stats["events_per_type"]:
                self.stats["events_per_type"][t] += 1
            if c in self.stats["events_per_city"]:
                self.stats["events_per_city"][c] += 1

            sev = prediction.get("predicted_severity", 3)
            if sev >= 4:
                self.stats["high_severity_count"] += 1

            all_sevs = [p.get("predicted_severity", 3) for p in self.predictions]
            self.stats["avg_predicted_severity"] = round(sum(all_sevs) / len(all_sevs), 2)

    def get_recent(self, n: int = 10) -> List[dict]:
        with self._lock:
            return list(self.events)[-n:]

    def get_stats(self) -> dict:
        with self._lock:
            return dict(self.stats)

# Global event store
event_store = EventStore(maxlen=200)


class KafkaConsumerService:
    """
    Python Kafka consumer that processes emergency events in real-time,
    runs AI predictions on each event, and stores enriched results.
    """

    def __init__(self):
        self.consumer      = None
        self.running       = False
        self.thread        = None
        self.connected     = False
        self.error_message = None
        self.messages_consumed = 0

    def start(self):
        """Start consumer in background thread"""
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        logger.info("Kafka consumer thread started")

    def _run(self):
        try:
            from kafka import KafkaConsumer
            from kafka.errors import NoBrokersAvailable

            logger.info("Connecting to Kafka at localhost:9092...")
            self.consumer = KafkaConsumer(
                'emergency-events',
                bootstrap_servers=['localhost:9092'],
                group_id='ai-service-group',
                auto_offset_reset='latest',
                enable_auto_commit=True,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                consumer_timeout_ms=1000,
                session_timeout_ms=30000,
                request_timeout_ms=40000,
            )
            self.connected     = True
            self.error_message = None
            self.running       = True
            logger.info("Kafka consumer connected successfully")

            while self.running:
                try:
                    for message in self.consumer:
                        if not self.running:
                            break
                        self._process_message(message)
                except Exception as e:
                    if self.running:
                        logger.warning(f"Consumer poll error: {e}")

        except Exception as e:
            self.connected     = False
            self.error_message = str(e)
            logger.warning(f"Kafka consumer could not connect: {e}")
            logger.info("AI service running in standalone mode (no Kafka)")

    def _process_message(self, message):
        try:
            from app.services.model_service import ModelService

            data    = message.value
            now     = datetime.now()

            # Extract incident fields
            inc_type = data.get("type", data.get("incidentType", "MEDICAL"))
            city     = data.get("city", "mumbai").lower()
            lat      = data.get("latitude",  19.0760)
            lng      = data.get("longitude", 72.8777)
            severity = data.get("severity",  3)

            # Run AI prediction
            prediction = ModelService.predict_severity(
                type_=inc_type,
                city=city,
                hour=now.hour,
                day_of_week=now.weekday(),
            )

            event = {
                "incident_id":  data.get("id", data.get("incidentId", "unknown")),
                "type":         inc_type,
                "city":         city,
                "latitude":     lat,
                "longitude":    lng,
                "severity":     severity,
                "kafka_offset": message.offset,
                "kafka_partition": message.partition,
            }

            event_store.add_event(event, prediction)
            self.messages_consumed += 1

            logger.info(
                f"Processed: {inc_type} in {city} → "
                f"AI severity {prediction['predicted_severity']} ({prediction['risk_level']})"
            )

        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def stop(self):
        self.running = False
        if self.consumer:
            self.consumer.close()
        logger.info("Kafka consumer stopped")

    def get_status(self) -> dict:
        return {
            "connected":          self.connected,
            "running":            self.running,
            "messages_consumed":  self.messages_consumed,
            "error":              self.error_message,
            "mode":               "kafka" if self.connected else "standalone",
        }


# Global consumer instance
kafka_consumer = KafkaConsumerService()