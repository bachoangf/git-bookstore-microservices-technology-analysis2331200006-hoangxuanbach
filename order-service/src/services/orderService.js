/**
 * Order Service Business Logic
 * 
 * This module contains the core business logic for order operations:
 * - Creating orders with product validation
 * - Listing orders
 * - Retrieving order details
 */

import grpc from '@grpc/grpc-js';
import { CircuitOpenError, fetchProductById } from '../grpc/productClient.js';
import { createOrderRecord, findOrderRecordById, listOrderRecords, deleteOrdersByProductId } from '../repositories/orderRepository.js';
import { publishOrderCreated } from '../events/orderPublisher.js';
import { HttpError } from '../utils/httpError.js';

/**
 * Validates and converts a value to a positive integer
 * Used for validating productId and quantity inputs
 * 
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {number} Positive integer value
 * @throws {HttpError} If value is not a positive integer
 */
function toPositiveInteger(value, fieldName) {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`);
  }
  return numericValue;
}

/**
 * Creates a new order
 * 
 * Process:
 * 1. Validates productId and quantity
 * 2. Fetches product from Product Service via gRPC (with circuit breaker)
 * 3. Creates order record in database
 * 4. Publishes order created event to RabbitMQ
 * 
 * @param {Object} payload - Order creation payload
 * @param {number} payload.productId - ID of the product to order
 * @param {number} payload.quantity - Quantity to order (default: 1)
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Created order object
 * @throws {HttpError} If validation fails or product service errors
 */
export async function createOrder(payload, user) {
  // Validate and convert inputs
  const productId = toPositiveInteger(payload.productId, 'productId');
  const quantity = toPositiveInteger(payload.quantity ?? 1, 'quantity');

  // Fetch product from Product Service via gRPC
  // This validates that the product exists before creating the order
  let product;
  const grpcStart = process.hrtime.bigint();
  try {
    // TODO: After implementing REST, remove this and use REST instead
    product = await fetchProductById(productId);

    // TODO: Implement fetching product from REST

    const durationMs = Number(process.hrtime.bigint() - grpcStart) / 1e6;
    console.info(
      `[OrderService] Fetched product ${productId} via gRPC in ${durationMs.toFixed(2)} ms`
    );
  } catch (err) {
    const durationMs = Number(process.hrtime.bigint() - grpcStart) / 1e6;
    console.error(
      `[OrderService] Failed to fetch product ${productId} via gRPC after ${durationMs.toFixed(2)} ms: ${err.message}`
    );
    // Handle various error types from Product Service
    handleProductServiceError(err);
  }

  // Create order record in database
  const order = await createOrderRecord(productId, quantity);
  
  // Publish order created event to RabbitMQ
  // This triggers notifications and analytics tracking
  await publishOrderCreated(order, product, user);

  return order;
}

/**
 * Lists all orders
 * 
 * @returns {Promise<Array>} Array of order objects
 */
export async function listOrders() {
  return listOrderRecords();
}

/**
 * Retrieves an order by ID
 * 
 * @param {string|number} idParam - Order ID (will be validated)
 * @returns {Promise<Object>} Order object
 * @throws {HttpError} If order not found or invalid ID
 */
export async function getOrderById(idParam) {
  const id = toPositiveInteger(idParam, 'id');
  const order = await findOrderRecordById(id);

  if (!order) {
    throw new HttpError(404, 'Order not found');
  }

  return order;
}

/**
 * Deletes all orders associated with a specific product
 * 
 * This is used when a product is deleted to maintain data consistency.
 * 
 * @param {number} productId - Product ID whose orders should be deleted
 * @returns {Promise<Object>} Object containing count of deleted orders and the deleted orders array
 * @throws {HttpError} If productId is invalid
 */
export async function deleteOrdersByProduct(productId) {
  const id = toPositiveInteger(productId, 'productId');
  const deletedOrders = await deleteOrdersByProductId(id);
  return {
    count: deletedOrders.length,
    orders: deletedOrders
  };
}

/**
 * Handles errors from Product Service gRPC calls
 * Converts gRPC errors to appropriate HTTP errors
 * 
 * @param {Error} err - Error from gRPC call
 * @throws {HttpError} Appropriate HTTP error based on error type
 */
function handleProductServiceError(err) {
  // If already an HttpError, re-throw it
  if (err instanceof HttpError) {
    throw err;
  }

  // Circuit breaker is open - service is protecting itself
  if (err instanceof CircuitOpenError) {
    throw new HttpError(503, 'Product service circuit open, try later');
  }

  // Map gRPC error codes to HTTP status codes
  switch (err.code) {
    case grpc.status.DEADLINE_EXCEEDED:
      // Request timed out
      throw new HttpError(504, 'Product service request timed out');
    case grpc.status.NOT_FOUND:
      // Product doesn't exist
      throw new HttpError(404, 'Product not found');
    case grpc.status.UNAVAILABLE:
      // Service is unavailable
      throw new HttpError(503, 'Product service unavailable, try later');
    default:
      // Unknown error
      console.error('Failed to fetch product via gRPC:', err.message);
      throw new HttpError(500, 'Failed to fetch product');
  }
}

