/**
 * Environment Configuration
 * 
 * This module centralizes all environment variable configuration for the Product Service.
 * It provides default values for development and validates numeric configurations.
 * 
 * Configuration includes:
 * - JWT secret for token verification
 * - HTTP server port
 * - gRPC server host and port
 * - RabbitMQ connection URL
 * - PostgreSQL database connection settings
 */

import dotenv from 'dotenv';

dotenv.config();

/** JWT secret key for verifying authentication tokens */
export const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

const rawPort = Number(process.env.PORT);
export const PORT = Number.isInteger(rawPort) && rawPort > 0 ? rawPort : 8002;

/** Host address for gRPC server (0.0.0.0 means listen on all interfaces) */
export const GRPC_HOST = process.env.GRPC_HOST || '0.0.0.0';
/** Port number for gRPC server */
export const GRPC_PORT = process.env.GRPC_PORT || '50051';

/** RabbitMQ connection URL for message broker */
export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://message-broker:5672';

/**
 * PostgreSQL database connection configuration
 * Used to create the connection pool
 */
export const DB_CONFIG = {
  host: process.env.PGHOST || 'product-db',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'products',
};

/** gRPC URL for Order Service (host:port format) */
export const ORDER_GRPC_URL = process.env.ORDER_GRPC_URL || 'order-service:50052';

/** Maximum number of timeout failures before circuit breaker opens */
const rawTimeoutAttempts = Number(process.env.ORDER_TIMEOUT_ATTEMPTS);
export const MAX_TIMEOUT_ATTEMPTS = Number.isInteger(rawTimeoutAttempts) && rawTimeoutAttempts > 0
  ? rawTimeoutAttempts
  : 3;

/** Time in milliseconds to wait before attempting to close circuit breaker */
const rawResetWindow = Number(process.env.ORDER_CIRCUIT_RESET_MS);
export const CIRCUIT_BREAKER_RESET_MS = Number.isInteger(rawResetWindow) && rawResetWindow > 0
  ? rawResetWindow
  : 30000;

/** Timeout in milliseconds for gRPC requests to Order Service */
const rawRequestTimeout = Number(process.env.ORDER_GRPC_TIMEOUT_MS);
export const ORDER_GRPC_TIMEOUT_MS = Number.isInteger(rawRequestTimeout) && rawRequestTimeout > 0
  ? rawRequestTimeout
  : 5000;

