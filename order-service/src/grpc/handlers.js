/**
 * gRPC Request Handlers
 * 
 * This module contains handlers for gRPC requests to the Order Service.
 * Handlers process incoming gRPC requests and return appropriate responses.
 */

import { deleteOrdersByProduct } from '../services/orderService.js';
import grpc from '@grpc/grpc-js';

/**
 * Handles DeleteOrdersByProduct gRPC request
 * 
 * Deletes all orders associated with a specific product ID.
 * 
 * @param {Object} call - gRPC call object with request data
 * @param {Function} callback - gRPC callback function to send response
 * @returns {void}
 */
export async function handleDeleteOrdersByProduct(call, callback) {
  try {
    const productId = call.request.product_id;
    
    if (!productId || productId <= 0) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'product_id must be a positive integer'
      });
    }

    const result = await deleteOrdersByProduct(productId);
    
    // Convert orders to gRPC format
    const orders = result.orders.map(order => ({
      id: order.id,
      product_id: order.product_id,
      quantity: order.quantity,
      status: order.status || 'PENDING'
    }));

    callback(null, {
      count: result.count,
      orders: orders
    });
  } catch (err) {
    console.error('Error in DeleteOrdersByProduct:', err);
    callback({
      code: grpc.status.INTERNAL,
      message: err.message || 'Failed to delete orders'
    });
  }
}

