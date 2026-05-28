/**
 * gRPC Client for Order Service
 * 
 * This module provides a gRPC client to communicate with the Order Service.
 * It implements a circuit breaker pattern to handle service failures gracefully.
 * It is used by the Product Service to delete orders when a product is deleted.
 */

import { fileURLToPath } from 'url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { CIRCUIT_BREAKER_RESET_MS, MAX_TIMEOUT_ATTEMPTS, ORDER_GRPC_TIMEOUT_MS, ORDER_GRPC_URL } from '../config/env.js';
import { CircuitBreaker, CircuitOpenError } from './circuitBreaker.js';

// Load the Protocol Buffer definition file
// This defines the service interface and message types
const protoPath = fileURLToPath(new URL('../../proto/order.proto', import.meta.url));
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,      // Preserve field names as-is
  longs: String,       // Convert long integers to strings
  enums: String,       // Convert enums to strings
  defaults: true,      // Include default values
  oneofs: true         // Support oneof fields
});

// Load the Order service definition from the proto file
const orderProto = grpc.loadPackageDefinition(packageDefinition).order;

// Create gRPC client instance
// Uses insecure credentials (no TLS) for internal service communication
const client = new orderProto.OrderService(ORDER_GRPC_URL, grpc.credentials.createInsecure());

// Initialize circuit breaker to protect against service failures
const breaker = new CircuitBreaker({
  maxTimeoutAttempts: MAX_TIMEOUT_ATTEMPTS,  // Max timeouts before opening circuit
  resetMs: CIRCUIT_BREAKER_RESET_MS         // Time to wait before attempting to close
});

export { CircuitOpenError } from './circuitBreaker.js';

/**
 * Deletes all orders associated with a product ID via gRPC
 * 
 * This function:
 * 1. Checks circuit breaker state before making request
 * 2. Makes gRPC call with timeout
 * 3. Updates circuit breaker based on success/failure
 * 
 * @param {number} productId - Product ID whose orders should be deleted
 * @returns {Promise<Object>} Object containing count of deleted orders and the deleted orders array
 * @throws {CircuitOpenError} If circuit breaker is open
 * @throws {Error} If gRPC call fails (timeout, unavailable, etc.)
 */
export async function deleteOrdersByProduct(productId) {
  // Check circuit breaker state and throw if circuit is open
  breaker.preRequest();

  try {
    // Make gRPC call with timeout
    // Wrapped in Promise to use async/await syntax
    const response = await new Promise((resolve, reject) => {
      // Set deadline for request (timeout)
      const deadline = new Date(Date.now() + ORDER_GRPC_TIMEOUT_MS);

      // Call DeleteOrdersByProduct RPC method
      // Callback receives error or result
      client.DeleteOrdersByProduct(
        { product_id: productId },
        { deadline },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        }
      );
    });

    // Request succeeded, update circuit breaker
    breaker.handleSuccess();
    return response;
  } catch (err) {
    // Request failed, update circuit breaker
    breaker.handleFailure(err);
    
    // Map gRPC error codes to more descriptive errors
    if (err instanceof CircuitOpenError) {
      throw err;
    }
    if (err.code === grpc.status.DEADLINE_EXCEEDED) {
      throw new Error('Order service request timed out');
    }
    if (err.code === grpc.status.UNAVAILABLE) {
      throw new Error('Order service unavailable');
    }
    if (err.code === grpc.status.INVALID_ARGUMENT) {
      throw new Error(err.message || 'Invalid product ID');
    }
    throw new Error(err.message || 'Failed to delete orders');
  }
}

