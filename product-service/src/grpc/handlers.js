/**
 * gRPC Request Handlers
 * 
 * This module contains handlers for gRPC RPC methods.
 * Handlers process incoming gRPC requests and return appropriate responses.
 */

import grpc from '@grpc/grpc-js';
import db from '../database/db.js';

/**
 * Handles GetProduct gRPC RPC call
 * 
 * This handler:
 * 1. Validates the product ID (must be a positive integer)
 * 2. Queries the database for the product
 * 3. Returns the product or an appropriate gRPC error
 * 
 * @param {Object} call - gRPC call object with request data
 * @param {Function} callback - gRPC callback function (error, response)
 * @returns {void} Calls callback with result or error
 */
export async function handleGetProduct(call, callback) {
  const id = Number(call.request.id);
  
  if (!Number.isInteger(id) || id <= 0) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: 'id must be a positive integer'
    });
  }

  try {
    const result = await db.query('SELECT * FROM books WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Product not found'
      });
    }

    const row = result.rows[0];
    return callback(null, {
      id: row.id,
      title: row.title,
      author: row.author,
      price: Number(row.price),
      stock: row.stock
    });
  } catch (err) {
    console.error('gRPC GetProduct error:', err.message);
    return callback({
      code: grpc.status.INTERNAL,
      message: 'Failed to fetch product'
    });
  }
}

