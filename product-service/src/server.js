/**
 * Product Service Server Entry Point
 * 
 * This is the main entry point for the Product Service.
 * It starts:
 * - Express HTTP server (for REST API)
 * - gRPC server (for inter-service communication with Order Service)
 * - RabbitMQ connection (for event publishing)
 */

import '../otel.js';
import app from './app.js';
import { startGrpcServer } from './grpc/server.js';
import { connectToBroker } from './messaging/broker.js';
import { PORT } from './config/env.js';

// Start HTTP server for REST API endpoints
app.listen(PORT, () => {
  console.log(`Product Service running on ${PORT}`);
});

// Start gRPC server for inter-service communication
// This allows Order Service to fetch product details via gRPC
startGrpcServer();

// Connect to RabbitMQ broker for event publishing
// Events are published when products are created
connectToBroker().catch((err) => {
  console.error('Failed to connect to RabbitMQ:', err.message);
});

