# Lab 6 Work Process and Basic Knowledge

## Student Information

- GitHub username: `bachoangf`
- Student name: `hoangxuanbach`
- Student ID: `2331200006`
- Repository: `git-bookstore-microservices-technology-analysis2331200006-hoangxuanbach`

## Overall Process

1. Read `Lab6.pdf` and identify the required deliverable: one PDF report with Part 1, Part 2.1 through Part 2.8, visuals, screenshots, and captions.
2. Inspect the source code instead of relying only on README files:
   - Gateway routing: `api-gateway/index.js`
   - User endpoints: `user-service/index.js`
   - Product routes and logic: `product-service/src/routes/productRoutes.js`, `product-service/src/services/productService.js`
   - Order routes and logic: `order-service/src/routes/orderRoutes.js`, `order-service/src/services/orderService.js`
   - gRPC and circuit breaker: `order-service/src/grpc/productClient.js`, `order-service/src/grpc/circuitBreaker.js`
   - RabbitMQ publishers and consumers: `product-service/src/events/productPublisher.js`, `order-service/src/events/orderPublisher.js`, `notification-service/src/messaging/rabbit.js`
   - Kafka producer and consumer: `analytics-service/index.js`, `analytics-dashboard-service/src/index.js`
   - SSE implementation: `notification-service/src/index.js`, `notification-service/src/push/sse.js`
3. Start infrastructure with Docker Compose:
   - `docker compose up -d --build`
   - `docker compose up -d --no-build`
4. Test the main application flow through the API Gateway:
   - Register/login user.
   - Create product.
   - Create orders.
   - Send analytics tracking events.
   - Check service logs and metrics.
5. Record the gRPC and REST timing experiment:
   - Run five order creation attempts with normal gRPC.
   - Temporarily switch product lookup in `orderService.js` to REST fallback.
   - Run five order creation attempts with REST fallback.
   - Restore source code back to gRPC.
6. Capture a Grafana panel showing per-service execution time from Mimir/OpenTelemetry metrics.
7. Write `report/lab6_report.html`, export it to `report/lab6_report.pdf`, then verify that the PDF contains all required sections.
8. Commit and push to GitHub.

## Part 1: Backend API Inventory Table

### What Was Done

- Selected 10 publicly exposed backend API endpoints as required by the lab.
- For each endpoint, filled in:
  - HTTP method and route.
  - Owning microservice.
  - Downstream inter-service communication.
  - Main datastore.
  - Messaging queue or topic.
  - One-sentence purpose.

### Basic Knowledge

- An API Gateway is a single entry point that forwards requests to internal services.
- A route such as `POST /api/orders` is public at the gateway, but internally it may be rewritten to `/` in Order Service.
- A datastore is the database or in-memory store touched during a request.
- Messaging is asynchronous communication through RabbitMQ or Kafka.
- Inter-service communication can be REST, gRPC, messaging, or N/A if the request stays inside one service.

## Part 2.1: Server-Sent Events

### What Was Done

- Identified Notification Service as the service implementing SSE.
- Used endpoint `GET /api/notifications/events`.
- Described the event payloads:
  - `connected`
  - `notification`
  - `heartbeat`

### Basic Knowledge

- Server-Sent Events are one-way real-time messages from server to browser.
- SSE uses `Content-Type: text/event-stream`.
- The browser keeps the HTTP connection open and receives event frames.
- In this project, RabbitMQ events become notifications, then Notification Service pushes them to users through SSE.

## Part 2.2: JWT Authentication

### What Was Done

- Created a sequence diagram with the required actors:
  - User
  - API Gateway
  - User Service
  - Product Service
  - Product Database
- Showed login, JWT issuance, and product creation with `Authorization: Bearer <token>`.

### Basic Knowledge

- JWT is a signed token that proves a user has authenticated.
- User Service creates the token after successful login or registration.
- API Gateway validates the JWT before forwarding protected requests.
- Product Service receives the request after gateway authentication and writes product data to PostgreSQL.

## Part 2.3: Circuit Breaker

### What Was Done

- Inspected the actual implementation in `order-service/src/grpc/circuitBreaker.js`.
- Used the real function and class names in the flowchart:
  - `fetchProductById`
  - `preRequest`
  - `handleSuccess`
  - `handleFailure`
  - `open`
  - `CircuitOpenError`
- Explained the state transitions:
  - `CLOSED`
  - `OPEN`
  - `HALF_OPEN`

### Basic Knowledge

- A circuit breaker protects a service from repeatedly calling a slow or failing dependency.
- `CLOSED` means calls are allowed normally.
- `OPEN` means calls are rejected quickly.
- `HALF_OPEN` means the service allows a test call after the reset time.
- In this project, Order Service uses the circuit breaker when calling Product Service through gRPC.

## Part 2.4: Compensating Transaction

### What Was Done

- Identified route `DELETE /api/products/:id`.
- Described the compensating action:
  - Product Service deletes the product.
  - Product Service asks Order Service to delete related orders through gRPC.
  - If order deletion fails, Product Service restores the deleted product.

### Basic Knowledge

- A compensating transaction is used when a distributed operation cannot be rolled back automatically by one database transaction.
- Instead of database rollback across services, the system performs another action to undo the previous step.
- In this project, restoring the product is the compensation for failed order deletion.

## Part 2.5: gRPC vs REST Performance Comparison

### What Was Done

- Used the timing log in `order-service/src/services/orderService.js`.
- Recorded five gRPC product lookup times:
  - `67.27 ms`
  - `4.94 ms`
  - `5.19 ms`
  - `5.19 ms`
  - `5.06 ms`
- Temporarily switched to REST fallback using `fetchProductByIdRest`.
- Recorded five REST product lookup times:
  - `47.95 ms`
  - `6.10 ms`
  - `5.65 ms`
  - `5.70 ms`
  - `5.90 ms`
- Created a bar graph comparing both datasets.
- Restored the code to normal gRPC after the experiment.

### Basic Knowledge

- gRPC is a high-performance RPC protocol commonly used for internal service-to-service calls.
- REST uses HTTP endpoints and JSON payloads.
- Timing should be measured on the same operation so the comparison is fair.
- The first request may be slower because of warmup, connection setup, or service startup effects.

## Part 2.6: RabbitMQ

### What Was Done

- Listed all RabbitMQ queues used in the implementation:
  - `orders.created`
  - `products.created`
  - `products.deleted`
- Identified producers:
  - Order Service publishes `orders.created`.
  - Product Service publishes `products.created` and `products.deleted`.
- Identified consumer:
  - Notification Service consumes all three queues.

### Basic Knowledge

- RabbitMQ is a message broker used for asynchronous event delivery.
- A producer sends a message to a queue.
- A consumer receives and processes messages from a queue.
- In this project, RabbitMQ decouples product/order actions from notification delivery.

## Part 2.7: Kafka

### What Was Done

- Identified Kafka topic:
  - `user-interactions`
- Identified producer:
  - Analytics Service publishes frontend interaction events.
- Identified consumer:
  - Analytics Dashboard Service consumes events with group ID `dashboard-group`.
- Compared RabbitMQ and Kafka in this project.

### Basic Knowledge

- Kafka is an event streaming platform.
- Kafka topics store ordered streams of events.
- Producers write events to topics.
- Consumers read events from topics.
- RabbitMQ in this project is used for notification-oriented queues, while Kafka is used for analytics event streaming.

## Part 2.8: Grafana Observability

### What Was Done

- Started the observability stack:
  - Grafana
  - Mimir
  - Tempo
  - Loki
  - OpenTelemetry Collector
  - Promtail
- Used Mimir metrics exported by OpenTelemetry.
- Created and captured a Grafana panel for average HTTP server execution time by service.
- Included the screenshot and interpretation in the report.

### Basic Knowledge

- Observability helps inspect logs, metrics, and traces.
- Grafana is the UI for visualizing observability data.
- Mimir stores Prometheus-style metrics.
- Tempo stores traces.
- Loki stores logs.
- OpenTelemetry instruments services and exports telemetry to the collector.
- Per-service execution time can reveal slow services or request paths.

## Generated Report Files

- `report/lab6_report.html`: source HTML report.
- `report/lab6_report.pdf`: final PDF report for submission.
- `report/assets/grafana_execution_times.png`: Grafana screenshot used in the report.

## Test URLs

- Main app through gateway: `http://localhost:8000`
- Swagger API docs: `http://localhost:8000/docs`
- Grafana: `http://localhost:3001` with `admin/admin`
- RabbitMQ Management UI: `http://localhost:15672` with `guest/guest`
- Analytics dashboard through gateway: `http://localhost:8000/api/dashboard`
- Analytics dashboard direct: `http://localhost:8006`
