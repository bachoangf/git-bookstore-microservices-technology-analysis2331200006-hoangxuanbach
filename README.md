# Bookstore Microservices Application

A comprehensive microservices-based bookstore application demonstrating modern distributed system patterns including API Gateway, gRPC communication, message queuing, real-time notifications, and analytics.

## 🏗️ Architecture Overview

This application consists of 8 microservices working together to provide a complete bookstore experience:

```
┌─────────────┐
│   Frontend  │ (React + Vite)
└──────┬──────┘
       │
┌──────▼──────────────────────────────────────┐
│         API Gateway (Port 8000)              │
│  - Request Routing & Authentication          │
│  - Reverse Proxy for Backend Services        │
└───┬──────────────────────────────────────────┘
    │
    ├──► User Service (8001) ──► MongoDB
    ├──► Product Service (8002) ──► PostgreSQL + gRPC
    ├──► Order Service (8003) ──► PostgreSQL + gRPC Client
    ├──► Notification Service (8005) ──► RabbitMQ + SSE
    ├──► Analytics Service (8007) ──► Kafka Producer
    └──► Analytics Dashboard (8006) ──► Kafka Consumer
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB of available RAM

### Running the Application

1. **Build all services:**
   ```bash
   docker compose build
   ```

2. **Start all services:**
   ```bash
   docker compose up -d
   ```

3. **Access the application:**
   - **Frontend/Application:** http://localhost:8000
   - **RabbitMQ Management UI:** http://localhost:15672 (guest/guest)
   - **Analytics Dashboard:** http://localhost:8006
   - **Grafana Observability UI:** http://localhost:3001 (admin/admin)

4. **Stop all services:**
   ```bash
   docker compose down
   ```

## 📦 Services

### 1. API Gateway (`api-gateway`)
- **Port:** 8000
- **Purpose:** Single entry point for all client requests
- **Features:**
  - JWT-based authentication
  - Request routing to backend services
  - REST reverse proxy with JWT guard
  - Request proxying with middleware

### 2. Frontend (`frontend`)
- **Port:** 3000 (proxied through gateway at 8000)
- **Technology:** React + Vite + TailwindCSS
- **Features:**
  - Product management (CRUD operations)
  - Order creation and tracking
  - Real-time notifications via SSE
  - User authentication

### 3. User Service (`user-service`)
- **Port:** 8001
- **Database:** MongoDB
- **Purpose:** User authentication and management
- **Endpoints:**
  - `POST /api/users/register` - Create new user
  - `POST /api/users/login` - Authenticate user
  - `GET /api/users/me` - Get current user (requires auth)

### 4. Product Service (`product-service`)
- **Port:** 8002 (HTTP), 50051 (gRPC)
- **Database:** PostgreSQL
- **Purpose:** Product catalog management
- **Features:**
  - RESTful API for product CRUD operations
  - gRPC server for inter-service communication
  - RabbitMQ integration for event publishing
- **Endpoints:**
  - `GET /api/products` - List all products
  - `POST /api/products` - Create product
  - `GET /api/products/:id` - Get product by ID
  - `PUT /api/products/:id` - Update product
  - `DELETE /api/products/:id` - Delete product

### 5. Order Service (`order-service`)
- **Port:** 8003
- **Database:** PostgreSQL
- **Purpose:** Order processing and management
- **Features:**
  - gRPC client for product validation
  - Circuit breaker pattern for resilience
  - RabbitMQ integration for order events
- **Endpoints:**
  - `GET /api/orders` - List all orders
  - `POST /api/orders` - Create new order
  - `GET /api/orders/:id` - Get order by ID

### 6. Notification Service (`notification-service`)
- **Port:** 8005
- **Purpose:** Real-time notifications
- **Features:**
  - Server-Sent Events (SSE) for real-time updates
  - RabbitMQ consumer for order/product events
  - In-memory notification store
- **Endpoints:**
  - `GET /api/notifications/events` - SSE stream
  - `GET /api/notifications` - Get all notifications
  - `POST /api/notifications/seen` - Mark notifications as seen

### 7. Analytics Service (`analytics-service`)
- **Port:** 8007
- **Purpose:** User interaction tracking
- **Features:**
  - Kafka producer for event streaming
  - Public endpoint (no authentication required)
- **Endpoints:**
  - `POST /api/analytics/track` - Track user interaction

### 8. Analytics Dashboard Service (`analytics-dashboard-service`)
- **Port:** 8006
- **Purpose:** Analytics visualization
- **Features:**
  - Kafka consumer for real-time event processing
  - Interactive dashboard with charts
  - In-memory analytics aggregation
- **Endpoints:**
  - `GET /api/analytics` - Get analytics data (via gateway: `GET /api/dashboard/api/analytics`)
  - `GET /api/events` - Get recent events (via gateway: `GET /api/dashboard/api/events`)
  - `GET /` - Dashboard UI (via gateway: `GET /api/dashboard`)

## 🔧 Technology Stack

### Backend
- **Node.js** with Express.js
- **Databases:**
  - MongoDB (User Service)
  - PostgreSQL (Product & Order Services)
- **Message Brokers:**
  - RabbitMQ (Event-driven communication)
  - Apache Kafka (Analytics streaming)
- **Communication:**
  - gRPC (Inter-service communication)
  - REST APIs (External interfaces)
  - REST APIs (Unified through gateway)
- **Real-time:**
  - Server-Sent Events (SSE)

### Frontend
- **React 18** with Hooks
- **Vite** (Build tool)
- **TailwindCSS** (Styling)
- **REST API via Gateway** (Data fetching)

## 👀 Observability (LGTM Stack)

This project now ships with a full Grafana LGTM stack (Loki, Grafana, Tempo, Mimir) wired into every backend service through OpenTelemetry.

- **Grafana (`grafana`)** – Dashboards & Explore UI at http://localhost:3001 (default credentials `admin/admin`). Datasources for Loki, Tempo, and Mimir are auto-provisioned.
- **Loki (`loki`)** – Stores container logs collected by Promtail. All service stdout/stderr logs are forwarded automatically.
- **Tempo (`tempo`)** – Receives distributed traces over OTLP. The default retention is 24h and is persisted on a local volume.
- **Mimir (`mimir`)** – Stores metrics sent via Prometheus remote write from the OpenTelemetry Collector.
- **OpenTelemetry Collector (`otel-collector`)** – Single ingress point for OTLP traces/metrics that fans out to Tempo and Mimir.
- **Promtail (`promtail`)** – Scrapes Docker container logs and pushes them to Loki. Ensure Docker socket access is available (default Docker Desktop/WSL2 setups work out of the box).

### Telemetry from services

All Node.js services are auto-instrumented on startup:

- The bootstrap file `otel.js` in each service configures the OpenTelemetry Node SDK with auto-instrumentations.
- By default telemetry is sent to `http://otel-collector:4318`. Override with `OTEL_EXPORTER_OTLP_ENDPOINT` if needed.
- Customize resource metadata via environment variables:
  - `OTEL_SERVICE_NAME` (already set per service in `docker-compose.yml`)
  - `OTEL_SERVICE_NAMESPACE` (defaults to `bookstore`)
  - `OTEL_METRIC_EXPORT_INTERVAL_MS` (default `60000`)
  - `OTEL_DIAG_LOG_LEVEL` (`debug|info|warn|error`) to inspect SDK behaviour

### Working with the LGTM stack

- **Logs:** Grafana → Explore → `Loki` datasource → query `{job="container-logs"}`.
- **Traces:** Grafana → Explore → `Tempo` → search by service name (e.g. `api-gateway`).
- **Metrics:** Grafana → Explore → `Mimir` → PromQL such as `http_server_duration_sum`.
- Configuration files live under `observability/` and can be tuned (e.g. retention, endpoints).
- Volumes `loki-data`, `tempo-data`, `mimir-data`, and `grafana-data` persist state between restarts.

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. Users register/login through the User Service
2. JWT tokens are issued with 2-hour expiration
3. All protected endpoints require `Authorization: Bearer <token>` header
4. The API Gateway validates tokens and forwards user context to services

## 📡 Communication Patterns

### Synchronous Communication
- **REST APIs:** Client-to-service communication
- **gRPC:** Order Service → Product Service (for product validation)

### Asynchronous Communication
- **RabbitMQ:** Event-driven messaging for:
  - Order creation events
  - Product update events
  - Notification delivery
- **Kafka:** Analytics event streaming:
  - User interaction tracking
  - Real-time analytics processing

### Real-time Communication
- **Server-Sent Events (SSE):** Notification Service → Frontend

## 🛡️ Resilience Patterns

### Circuit Breaker
The Order Service implements a circuit breaker pattern when communicating with the Product Service:
- Opens after multiple timeout failures
- Prevents cascading failures
- Automatically resets after a configured period

### Error Handling
- Centralized error handling middleware
- Consistent error response format
- Graceful degradation

## 📊 Data Flow Examples

### Creating an Order
1. Frontend sends order request to API Gateway
2. Gateway validates JWT and routes to Order Service
3. Order Service validates product via gRPC (Product Service)
4. Order is saved to PostgreSQL
5. Order event is published to RabbitMQ
6. Notification Service consumes event and sends SSE notification
7. Analytics Service tracks the interaction

### Real-time Notifications
1. Service publishes event to RabbitMQ
2. Notification Service consumes event
3. Notification stored in-memory
4. SSE connection delivers notification to connected clients
5. Frontend updates UI in real-time

## 🧪 Development

### Project Structure
```
bookstore-microservices/
├── api-gateway/                 # API Gateway service
├── frontend/                    # React frontend application
├── user-service/                # User authentication service
├── product-service/             # Product catalog service
├── order-service/               # Order processing service
├── notification-service/        # Real-time notifications
├── analytics-service/           # Analytics tracking
├── analytics-dashboard-service/ # Analytics dashboard
└── docker-compose.yml           # Service orchestration
```

### Environment Variables
Each service has its own environment configuration. Key variables:
- `JWT_SECRET`: Shared secret for JWT signing (default: 'devsecret')
- `RABBITMQ_URL`: RabbitMQ connection string
- `KAFKA_BROKER`: Kafka broker address
- Database connection strings (MongoDB, PostgreSQL)
- Observability variables (per service): `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_METRIC_EXPORT_INTERVAL_MS`, `OTEL_DIAG_LOG_LEVEL`

### Adding a New Service
1. Create service directory with Dockerfile
2. Add service definition to `docker-compose.yml`
3. Configure networking in `bookstore-net`
4. Add routing in API Gateway if needed

## 📝 API Documentation

### Gateway REST Routes
All HTTP APIs are accessed through the gateway at `http://localhost:8000`. Common routes include:

- `POST /api/users/register` – Create a new user account.
- `POST /api/users/login` – Authenticate and receive a JWT.
- `GET /api/products` – Retrieve the product catalog.
- `POST /api/products` – Create a product (requires JWT).
- `GET /api/orders` – Retrieve orders for authenticated users.
- `POST /api/orders` – Create an order with product validation.
- `GET /api/notifications/events` – Server-Sent Events stream (requires JWT, use header-based auth).
- `POST /api/analytics/track` – Submit analytics events (public endpoint).

## 🐛 Troubleshooting

### Services not starting
- Check Docker logs: `docker compose logs <service-name>`
- Verify ports are not in use
- Ensure sufficient system resources

### Database connection issues
- Wait for databases to fully initialize (may take 10-30 seconds)
- Check database service logs

### Authentication failures
- Verify JWT_SECRET is consistent across services
- Check token expiration
- Ensure Authorization header format is correct

## 📄 License

This is an educational project for demonstrating microservices architecture patterns.

## 🤝 Contributing

This is a teaching/learning project. Feel free to explore, modify, and experiment with the codebase.
