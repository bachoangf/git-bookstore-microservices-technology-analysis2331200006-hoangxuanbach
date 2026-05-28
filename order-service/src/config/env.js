/**
 * Environment Configuration
 * 
 * This module centralizes all environment variable configuration for the Order Service.
 * It provides default values for development and validates numeric configurations.
 * 
 * Configuration includes:
 * - JWT secret for token verification
 * - Circuit breaker settings for Product Service resilience
 * - gRPC client settings for Product Service communication
 * - Service port configuration
 */

import dotenv from 'dotenv';

dotenv.config();

/** JWT secret key for verifying authentication tokens */
export const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

/** Maximum number of timeout failures before circuit breaker opens */
const rawTimeoutAttempts = Number(process.env.PRODUCT_TIMEOUT_ATTEMPTS);
export const MAX_TIMEOUT_ATTEMPTS = Number.isInteger(rawTimeoutAttempts) && rawTimeoutAttempts > 0
  ? rawTimeoutAttempts
  : 3;

/** Time in milliseconds to wait before attempting to close circuit breaker */
const rawResetWindow = Number(process.env.PRODUCT_CIRCUIT_RESET_MS);
export const CIRCUIT_BREAKER_RESET_MS = Number.isInteger(rawResetWindow) && rawResetWindow > 0
  ? rawResetWindow
  : 30000;

/** Timeout in milliseconds for gRPC requests to Product Service */
const rawRequestTimeout = Number(process.env.PRODUCT_GRPC_TIMEOUT_MS);
export const PRODUCT_GRPC_TIMEOUT_MS = Number.isInteger(rawRequestTimeout) && rawRequestTimeout > 0
  ? rawRequestTimeout
  : 2000;

/** gRPC URL for Product Service (host:port format) */
export const PRODUCT_GRPC_URL = process.env.PRODUCT_GRPC_URL || 'product-service:50051';

/** Base HTTP URL for Product Service REST API */
export const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:8002';

/** Port number for the Order Service HTTP server */
const rawPort = Number(process.env.PORT);
export const PORT = Number.isInteger(rawPort) && rawPort > 0 ? rawPort : 8003;

/** Host address for gRPC server (0.0.0.0 means listen on all interfaces) */
export const GRPC_HOST = process.env.GRPC_HOST || '0.0.0.0';
/** Port number for gRPC server */
export const GRPC_PORT = process.env.GRPC_PORT || '50052';

