# ResQNet — AI-Powered Distributed Emergency Response Platform

<div align="center">

![ResQNet Dashboard](https://img.shields.io/badge/Status-Production_Ready-22c55e?style=for-the-badge)
![Java](https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Apache Kafka](https://img.shields.io/badge/Apache_Kafka_3.7-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**A production-grade, event-driven microservices platform for real-time emergency dispatch**

*Built with Java Spring Boot · Apache Kafka · React · PostgreSQL · Redis · Docker*

</div>

---

## Overview

ResQNet is a distributed emergency response coordination system that demonstrates advanced backend engineering through a complete microservices architecture. When a citizen reports an emergency, the system automatically dispatches the nearest available responder in under 3 seconds using Kafka event streaming and the Haversine formula for geospatial proximity calculation.

---

## Architecture
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│         (Vite + TailwindCSS + React Query)               │
└─────────────────────┬───────────────────────────────────┘
│ HTTP/REST
┌─────────────────────▼───────────────────────────────────┐
│                   API Gateway :8080                      │
│              JWT Validation · Rate Limiting              │
└──────┬──────────────┬──────────────────────┬────────────┘
│              │                      │
┌──────▼─────┐ ┌──────▼──────┐      ┌───────▼──────┐
│User Service│ │  Emergency  │      │   Dispatch   │
│   :8081    │ │  Service    │      │   Service    │
│            │ │   :8082     │      │    :8083     │
│ JWT · Auth │ │ Incidents · │      │ Responders · │
│ PostgreSQL │ │ Kafka Prod  │      │ Haversine    │
└────────────┘ └──────┬──────┘      └──────▲───────┘
│                     │
┌───────▼─────────────────────┴──────┐
│           Apache Kafka              │
│   emergency-events (6 partitions)   │
│   dispatch-updates (3 partitions)   │
│   Dead Letter Queues (DLT)          │
└────────────────────────────────────┘
│
┌───────▼────────────────────────────┐
│      Infrastructure (Docker)        │
│  PostgreSQL 16 · Redis 7 ·          │
│  Zookeeper · Kafka Broker           │
└────────────────────────────────────┘
---

## Key Features

### Backend (Sprints 1 & 2)
- **Event-Driven Architecture** — Apache Kafka with 5 topics, 6 partitions, Dead Letter Queues, exactly-once semantics
- **Haversine Dispatch** — Geospatial algorithm finds nearest available responder in real-time
- **JWT Security** — RS256 token validation across all microservices via API Gateway
- **Database per Service** — Each microservice owns its schema (Flyway migrations)
- **Resilience** — DLT error handling, retry logic, circuit-breaker patterns
- **Kafka Monitoring** — Consumer group lag tracking, partition offset monitoring

### Frontend (Sprint 3)
- **Real-time Dashboard** — Live stat cards, Kafka health, service status, auto-refresh
- **Incident Management** — Create SOS, search, sort, filter, CSV export, detail modal with timeline
- **Responder Tracking** — 21 responders across 3 cities, BUSY/AVAILABLE, detail modal with capabilities
- **Live Map** — Leaflet dark map, individual pins per responder, city jump, rich popups
- **Kafka Monitor** — Consumer lag charts, partition offsets, topic registry
- **Service Health** — 4 microservices + 4 infrastructure components monitored live

---

## Tech Stack

| Layer          | Technology                                    |
|----------------|-----------------------------------------------|
| Language       | Java 21, JavaScript (ES2024)                  |
| Backend        | Spring Boot 3.3.2, Spring Security, Spring Data JPA |
| Messaging      | Apache Kafka 3.7.1 (Zookeeper mode)           |
| Database       | PostgreSQL 16.3 (3 schemas), Redis 7.4        |
| Frontend       | React 18, Vite, TailwindCSS, React Query      |
| Mapping        | Leaflet.js (CARTO dark tiles)                 |
| Charts         | Recharts                                      |
| Auth           | JWT (RS256), BCrypt                           |
| Infrastructure | Docker Compose                                |
| Build          | Maven 3.9, npm                                |

---

## Services

| Service           | Port | Responsibility                                      |
|-------------------|------|-----------------------------------------------------|
| API Gateway       | 8080 | JWT validation, request routing, CORS               |
| User Service      | 8081 | Registration, login, JWT issuance                   |
| Emergency Service | 8082 | Incident CRUD, Kafka producer, status lifecycle     |
| Dispatch Service  | 8083 | Haversine dispatch, responder management, GPS ping  |

---

## Kafka Topics

| Topic                  | Partitions | Purpose                              |
|------------------------|------------|--------------------------------------|
| `emergency-events`     | 6          | SOS incidents from Emergency Service |
| `dispatch-updates`     | 3          | Responder assignments from Dispatch  |
| `emergency-events-dlt` | 3          | Dead letter queue for failed events  |
| `dispatch-updates-dlt` | 3          | Dead letter queue for failed updates |
| `notifications`        | 3          | Push/SMS notification events         |

---

## Quick Start

### Prerequisites
- Docker Desktop
- Java 21+
- Node.js 18+
- Maven 3.9+

### 1. Start Infrastructure
```bash
docker compose up -d postgres redis zookeeper kafka
```

### 2. Start Microservices (4 terminals)
```bash
# Terminal 1
cd services/user-service && mvn spring-boot:run

# Terminal 2
cd services/emergency-service && mvn spring-boot:run

# Terminal 3
cd services/dispatch-service && mvn spring-boot:run

# Terminal 4
cd services/api-gateway && mvn spring-boot:run
```

### 3. Start Frontend
```bash
cd frontend && npm install && npm run dev
```

### 4. Access
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080
- **Login**: kshitij@test.com / password123

---

## API Endpoints

### Auth
POST /api/auth/register    — Register new user
POST /api/auth/login       — Login, returns JWT

### Incidents
POST   /api/incidents         — Create SOS (triggers Kafka)
GET    /api/incidents/my      — Get my incidents
GET    /api/incidents/:id     — Get incident by ID
PATCH  /api/incidents/:id/status — Update status

### Responders
GET  /api/responders?city=X           — All responders in city
GET  /api/responders/available?city=X — Available only
GET  /api/responders/:id              — Get by ID

### Monitoring
GET  /api/monitoring/kafka/lag    — Consumer group lag
GET  /api/monitoring/kafka/topics — Topic list
GET  /api/health                  — Emergency service health
GET  /api/health/stats            — Dispatch service stats

---

## Data

- **21 Responders** — Mumbai (5), Delhi (8), Bangalore (8)
- **3 Types** — Ambulance, Fire Unit, Police
- **13+ Incidents** — Seeded across all cities
- **Dispatch Time** — REPORTED → DISPATCHED in ~3 seconds via Kafka

---

## Project Roadmap

| Sprint | Status | Focus                                      |
|--------|--------|--------------------------------------------|
| 1      | ✅ Done | Core microservices, Kafka pipeline, DB setup |
| 2      | ✅ Done | Haversine dispatch, monitoring, resilience  |
| 3      | ✅ Done | React frontend, all 6 pages, live data     |
| 4      | 🔄 Next | AI/ML — Priority scoring, demand prediction |
| 5      | 📋 Plan | Kubernetes deployment, Helm charts         |

---

## Author

**Kshitij** — Backend & Full-Stack Engineer

> Built to demonstrate production-grade distributed systems engineering: event-driven architecture, geospatial algorithms, microservices patterns, and modern React frontend development.

---

<div align="center">

**ResQNet** · Emergency Response Platform · Sprint 3 Complete

*13 incidents · 21 responders · 0 Kafka lag · 4/4 services UP*

</div>