/**
 * gRPC Client for Product Service
 * 
 * This module provides a gRPC client to communicate with the Product Service.
 * It implements a circuit breaker pattern to handle service failures gracefully.
 */

import { fileURLToPath } from 'url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { CIRCUIT_BREAKER_RESET_MS, MAX_TIMEOUT_ATTEMPTS, PRODUCT_GRPC_TIMEOUT_MS, PRODUCT_GRPC_URL } from '../config/env.js';
import { CircuitBreaker, CircuitOpenError } from './circuitBreaker.js';

// Load the Protocol Buffer definition file
// This defines the service interface and message types
const protoPath = fileURLToPath(new URL('../../proto/product.proto', import.meta.url));
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,      // Preserve field names as-is
  longs: String,       // Convert long integers to strings
  enums: String,       // Convert enums to strings
  defaults: true,      // Include default values
  oneofs: true         // Support oneof fields
});

// Load the Product service definition from the proto file
const productProto = grpc.loadPackageDefinition(packageDefinition).product;

// Create gRPC client instance
// Uses insecure credentials (no TLS) for internal service communication
const client = new productProto.ProductService(PRODUCT_GRPC_URL, grpc.credentials.createInsecure());

// Initialize circuit breaker to protect against service failures
const breaker = new CircuitBreaker({
  maxTimeoutAttempts: MAX_TIMEOUT_ATTEMPTS,  // Max timeouts before opening circuit
  resetMs: CIRCUIT_BREAKER_RESET_MS         // Time to wait before attempting to close
});

export { CircuitOpenError } from './circuitBreaker.js';

/**
 * Fetches a product by ID from the Product Service via gRPC
 * 
 * This function:
 * 1. Checks circuit breaker state before making request
 * 2. Makes gRPC call with timeout
 * 3. Updates circuit breaker based on success/failure
 * 
 * @param {number} id - Product ID to fetch
 * @returns {Promise<Object>} Product object from Product Service
 * @throws {CircuitOpenError} If circuit breaker is open
 * @throws {Error} If gRPC call fails (timeout, unavailable, not found, etc.)
 */
export async function fetchProductById(id) {
  // Check circuit breaker state and throw if circuit is open
  breaker.preRequest();

  try {
    // Make gRPC call with timeout
    // Wrapped in Promise to use async/await syntax
    const response = await new Promise((resolve, reject) => {
      // Set deadline for request (timeout)
      const deadline = new Date(Date.now() + PRODUCT_GRPC_TIMEOUT_MS);

      // Call GetProduct RPC method
      // Callback receives error or result
      client.GetProduct({ id }, { deadline }, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });

    // Request succeeded, update circuit breaker
    breaker.handleSuccess();
    return response;
  } catch (err) {
    // Request failed, update circuit breaker
    breaker.handleFailure(err);
    throw err;
  }
}

