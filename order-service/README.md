# Order Service

Processes orders with product validation via gRPC and implements resilience patterns.

## Overview

The Order Service handles:
- Order creation and management
- Product validation via gRPC (Product Service)
- Circuit breaker pattern for resilience
- Event publishing to RabbitMQ

## Architecture

```
Client Request
    │
    ▼
Order Service (Port 8003)
    │
    ├──► Order Creation
    │       ├──► Validate Product (gRPC → Product Service)
    │       │       └──► Circuit Breaker Protection
    │       ├──► Create Order Record (PostgreSQL)
    │       └──► Publish Order Event (RabbitMQ)
    │
    └──► Order Retrieval
            └──► Query Orders (PostgreSQL)
```

## API Endpoints

**Note:** All endpoints below are service-level routes. When accessed through the API Gateway, they are prefixed with `/api/orders` (e.g., `/api/orders`).

### `GET /`
Retrieves all orders.

**Gateway Access:** `GET /api/orders`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "product_id": 5,
    "quantity": 2,
    "status": "pending",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### `POST /`
Creates a new order. Returns HTTP status **201 Created** on success.

**Gateway Access:** `POST /api/orders`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": 5,
  "quantity": 2
}
```

**Response:**
```json
{
  "message": "Order created",
  "order": {
    "id": 1,
    "product_id": 5,
    "quantity": 2,
    "status": "pending",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failure (e.g., `productId must be a positive integer`)
- `404 Not Found`: Product not found
- `503 Service Unavailable`: Product service circuit open or unavailable
- `504 Gateway Timeout`: Product service request timed out

### `GET /:id`
Retrieves an order by ID.

**Gateway Access:** `GET /api/orders/:id`

**Response:**
```json
{
  "id": 1,
  "product_id": 5,
  "quantity": 2,
  "status": "pending",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

## Circuit Breaker Pattern

The service implements a circuit breaker when communicating with the Product Service via gRPC:

**States:**
- **Closed:** Normal operation, requests pass through
- **Open:** Too many failures, requests are rejected immediately
- **Half-Open:** Testing if service has recovered

**Configuration:**
- `PRODUCT_TIMEOUT_ATTEMPTS`: Maximum timeout attempts before opening circuit (default: 3)
- `PRODUCT_CIRCUIT_RESET_MS`: Time before attempting to close circuit (default: 30000ms)
- `PRODUCT_GRPC_TIMEOUT_MS`: gRPC request timeout (default: 2000ms)

**Benefits:**
- Prevents cascading failures
- Reduces load on failing service
- Provides fast failure responses

## gRPC Client

The service uses a gRPC client to communicate with the Product Service:

**Function:** `fetchProductById(id)`
- Validates product exists before creating order
- Handles timeouts and errors gracefully
- Integrates with circuit breaker

## Database

**Technology:** PostgreSQL

**Schema:**
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Event Publishing

When orders are created, events are published to RabbitMQ:
- `order.created` - Contains order details and product information

These events are consumed by:
- Notification Service (for real-time notifications)
- Analytics Service (for tracking)

## Configuration

**Environment Variables:**
- `PGHOST`: PostgreSQL host (default: `order-db`)
- `PGUSER`: PostgreSQL user (default: `postgres`)
- `PGPASSWORD`: PostgreSQL password (default: `postgres`)
- `PGDATABASE`: Database name (default: `orders`)
- `PGPORT`: PostgreSQL port (default: `5432`)
- `PORT`: HTTP server port (default: `8003`)
- `JWT_SECRET`: Secret for JWT verification
- `RABBITMQ_URL`: RabbitMQ connection string
- `PRODUCT_SERVICE_URL`: Product service HTTP URL (for reference)
- `PRODUCT_GRPC_URL`: Product service gRPC URL (default: `product-service:50051`)
- `PRODUCT_TIMEOUT_ATTEMPTS`: Circuit breaker timeout attempts (default: 3)
- `PRODUCT_CIRCUIT_RESET_MS`: Circuit breaker reset time (default: 30000)
- `PRODUCT_GRPC_TIMEOUT_MS`: gRPC timeout (default: 2000)

## Dependencies

- `express`: Web framework
- `@grpc/grpc-js`: gRPC client
- `@grpc/proto-loader`: Protocol buffer loader
- `pg`: PostgreSQL client
- `amqplib`: RabbitMQ client

## Error Handling

The service provides detailed error handling:
- **Validation Errors:** Invalid input parameters
- **Product Service Errors:** Handles gRPC errors (timeout, unavailable, not found)
- **Circuit Breaker Errors:** Returns 503 when circuit is open
- **Database Errors:** Handled by repository layer

## Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
export PGHOST=localhost
export PGUSER=postgres
export PGPASSWORD=postgres
export PGDATABASE=orders
export PORT=8003
export PRODUCT_GRPC_URL=localhost:50051

# Start server
node src/server.js
```

