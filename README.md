# ResQNet — AI-Powered Distributed Emergency Response Platform

[![Java](https://img.shields.io/badge/Java-21-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.2-green)](https://spring.io/projects/spring-boot)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-3.7.1-black)](https://kafka.apache.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.3-blue)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.4-red)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://www.docker.com/)

A production-grade distributed emergency response platform built with microservices architecture. Features real-time incident dispatch using Haversine algorithm, event-driven communication via Apache Kafka, JWT authentication, and multi-city responder management.

---

## Architecture
Citizen SOS → API Gateway (8080) [JWT Auth]
→ Emergency Service (8082) → Kafka [emergency-events]
→ Dispatch Service (8083) [Haversine nearest-responder]
→ Kafka [dispatch-updates]
→ Emergency Service [DISPATCHED status update]
### Microservices

| Service | Port | Responsibility |
|---|---|---|
| API Gateway | 8080 | JWT validation, request routing |
| User Service | 8081 | Registration, login, JWT issuance |
| Emergency Service | 8082 | Incident creation, Kafka producer, status lifecycle |
| Dispatch Service | 8083 | Haversine dispatch, responder management, GPS ping |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.3.2 |
| Message Broker | Apache Kafka 3.7.1 |
| Database | PostgreSQL 16.3 |
| Cache | Redis 7.4 |
| Gateway | Spring Cloud Gateway |
| Auth | JWT (JJWT) |
| DB Migrations | Flyway |
| Documentation | SpringDoc OpenAPI 2.5.0 |
| Containerization | Docker Compose |

---

## Key Features

- **Real-time Dispatch**: Haversine algorithm finds nearest available responder across Mumbai, Delhi, Bangalore
- **Event-Driven Architecture**: Full Kafka round-trip — incident created → dispatched in ~3 seconds
- **Resilience**: Dead Letter Queue with FixedBackOff retry (3 attempts, 2s delay)
- **JWT Security**: API Gateway validates all requests before forwarding to downstream services
- **GPS Tracking**: Real-time responder location ping endpoint
- **Multi-City**: Simultaneous dispatch across 3 cities with 21 responders
- **Observability**: Kafka consumer lag monitoring, health dashboards, Spring Actuator
- **API Docs**: Swagger UI on all 3 services with JWT bearer auth

---

## Getting Started

### Prerequisites
- Java 21+
- Docker Desktop
- Maven 3.9+

### Run Locally

```bash
# 1. Start infrastructure
docker compose up -d postgres redis zookeeper kafka

# 2. Start services (each in separate terminal)
cd services/user-service && mvn spring-boot:run
cd services/emergency-service && mvn spring-boot:run
cd services/dispatch-service && mvn spring-boot:run
cd services/api-gateway && mvn spring-boot:run
```

### Test the Pipeline

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@test.com","password":"password123","phoneNumber":"+919876543210"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Create incident (use token from login)
curl -X POST http://localhost:8080/api/incidents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"MEDICAL","severity":5,"latitude":19.0760,"longitude":72.8777,"city":"mumbai","description":"Emergency"}'
```

---

## API Documentation

Swagger UI available at:
- User Service: http://localhost:8081/swagger-ui.html
- Emergency Service: http://localhost:8082/swagger-ui.html
- Dispatch Service: http://localhost:8083/swagger-ui.html

---

## Kafka Topics

| Topic | Partitions | Purpose |
|---|---|---|
| emergency-events | 6 | Incident created events |
| dispatch-updates | 3 | Responder assigned events |
| notifications | 3 | SMS/push notifications |
| emergency-events-dlt | 3 | Dead letter queue |
| dispatch-updates-dlt | 3 | Dead letter queue |

---

## Database Schema
users schema:     users, roles, refresh_tokens
incidents schema: incidents
dispatch schema:  responders

---

## Monitoring

```bash
# Kafka consumer lag
GET http://localhost:8083/api/monitoring/kafka/lag

# Service health
GET http://localhost:8082/api/health/stats
GET http://localhost:8083/api/health/stats

# Spring Actuator
GET http://localhost:8082/actuator/health
```

---

## Project Roadmap

- [x] Sprint 1: Core microservices, JWT auth, incident management
- [x] Sprint 2: Kafka pipeline, API Gateway, multi-city dispatch, observability
- [ ] Sprint 3: React frontend, real-time map, live tracking
- [ ] Sprint 4: AI/ML incident prediction, route optimization
- [ ] Sprint 5: Kubernetes deployment, CI/CD pipeline

---

## Author

**Kshitij Srivastava**
- GitHub: [@Kshitij5486](https://github.com/Kshitij5486)