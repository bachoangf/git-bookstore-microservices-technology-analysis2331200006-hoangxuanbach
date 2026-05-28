# Product Service

Manages the product catalog with REST API and gRPC server for inter-service communication.

## Overview

The Product Service handles:
- Product CRUD operations (Create, Read, Update, Delete)
- Product inventory management
- gRPC server for inter-service communication
- Event publishing to RabbitMQ

## Architecture

```
Client Request
    │
    ├──► REST API (Port 8002)
    │       └──► Product CRUD Operations
    │
    └──► gRPC Server (Port 50051)
            └──► GetProduct(id) - Used by Order Service
```

## API Endpoints

**Note:** All endpoints below are service-level routes. When accessed through the API Gateway, they are prefixed with `/api/products` (e.g., `/api/products`).

### `GET /`
Retrieves all products.

**Gateway Access:** `GET /api/products`

**Response:**
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "price": 12.99,
    "stock": 50,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### `POST /`
Creates a new product.

**Gateway Access:** `POST /api/products`

**Request Body:**
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "price": 12.99,
  "stock": 50
}
```

**Response:**
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "price": 12.99,
  "stock": 50,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### `GET /:id`
Retrieves a product by ID.

**Gateway Access:** `GET /api/products/:id`

**Response:**
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "price": 12.99,
  "stock": 50,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### `PUT /:id`
Updates an existing product.

**Gateway Access:** `PUT /api/products/:id`

**Request Body:**
```json
{
  "title": "Updated Title",
  "price": 15.99,
  "stock": 30
}
```

### `DELETE /:id`
Deletes a product.

**Gateway Access:** `DELETE /api/products/:id`

**Response:**
```json
{
  "message": "Deleted",
  "id": 1,
  "deletedOrdersCount": 0
}
```

## gRPC Interface

The service exposes a gRPC server for efficient inter-service communication.

**Proto Definition:**
```protobuf
service ProductService {
  rpc GetProduct(GetProductRequest) returns (Product);
}

message GetProductRequest {
  int32 id = 1;
}

message Product {
  int32 id = 1;
  string title = 2;
  string author = 3;
  double price = 4;
  int32 stock = 5;
}
```

**Usage:** The Order Service uses this gRPC endpoint to validate products before creating orders.

## Database

**Technology:** PostgreSQL

**Schema:**
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Event Publishing

When products are created or updated, events are published to RabbitMQ:
- `product.created` - When a new product is created
- `product.updated` - When a product is updated

These events are consumed by the Notification Service to send real-time updates.

## Configuration

**Environment Variables:**
- `PGHOST`: PostgreSQL host (default: `product-db`)
- `PGUSER`: PostgreSQL user (default: `postgres`)
- `PGPASSWORD`: PostgreSQL password (default: `postgres`)
- `PGDATABASE`: Database name (default: `products`)
- `PGPORT`: PostgreSQL port (default: `5432`)
- `PORT`: HTTP server port (default: `8002`)
- `GRPC_PORT`: gRPC server port (default: `50051`)
- `JWT_SECRET`: Secret for JWT verification (default: 'devsecret')
- `RABBITMQ_URL`: RabbitMQ connection string

## Dependencies

- `express`: Web framework
- `@grpc/grpc-js`: gRPC server implementation
- `@grpc/proto-loader`: Protocol buffer loader
- `pg`: PostgreSQL client
- `amqplib`: RabbitMQ client

## Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
export PGHOST=localhost
export PGUSER=postgres
export PGPASSWORD=postgres
export PGDATABASE=products
export PORT=8002
export GRPC_PORT=50051

# Start server
node src/server.js
```

## Authentication

All endpoints (except health checks) require JWT authentication. The service validates tokens using the shared `JWT_SECRET`.

