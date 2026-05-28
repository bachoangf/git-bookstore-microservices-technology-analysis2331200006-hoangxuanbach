/**
 * Order Service Server Entry Point
 * 
 * This is the main entry point for the Order Service.
 * It:
 * - Creates and starts the Express HTTP server
 * - Starts the gRPC server for inter-service communication
 * - Connects to RabbitMQ message broker for event publishing
 * - Listens on the configured PORT
 */

import '../otel.js';
import { PORT } from './config/env.js';
import { connectToBroker } from './messaging/broker.js';
import { createApp } from './app.js';
import { startGrpcServer } from './grpc/server.js';

// Create Express application
const app = createApp();

// Connect to RabbitMQ broker (non-blocking)
// If connection fails, it will retry automatically
connectToBroker().catch(err => console.error('Broker init error', err));

// Start gRPC server for inter-service communication
startGrpcServer();

// Start HTTP server
app.listen(PORT, () => {
  console.log(`Order Service running on ${PORT}`);
});

