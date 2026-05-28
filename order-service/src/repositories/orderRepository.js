/**
 * Order Repository
 * 
 * This module provides data access layer functions for order operations.
 * It handles all database interactions related to orders, abstracting
 * SQL queries from the business logic layer.
 */

import db from '../database/db.js';

/**
 * Creates a new order record in the database
 * 
 * @param {number} productId - ID of the product being ordered
 * @param {number} quantity - Quantity of products to order
 * @returns {Promise<Object>} The created order object with all fields
 */
export async function createOrderRecord(productId, quantity) {
  const result = await db.query(
    'INSERT INTO orders (product_id, quantity, status) VALUES ($1,$2,$3) RETURNING *',
    [productId, quantity, 'PENDING']
  );

  return result.rows[0];
}

/**
 * Retrieves all orders from the database
 * Orders are returned in descending order by ID (newest first)
 * 
 * @returns {Promise<Array>} Array of all order objects
 */
export async function listOrderRecords() {
  const result = await db.query('SELECT * FROM orders ORDER BY id DESC');
  return result.rows;
}

/**
 * Finds a single order by its ID
 * 
 * @param {number} id - Order ID to search for
 * @returns {Promise<Object|null>} Order object if found, null otherwise
 */
export async function findOrderRecordById(id) {
  const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Finds all orders for a specific product
 * 
 * @param {number} productId - Product ID to search for
 * @returns {Promise<Array>} Array of order objects for the product
 */
export async function findOrdersByProductId(productId) {
  const result = await db.query('SELECT * FROM orders WHERE product_id = $1', [productId]);
  return result.rows;
}

/**
 * Deletes all orders for a specific product
 * 
 * @param {number} productId - Product ID whose orders should be deleted
 * @returns {Promise<Array>} Array of deleted order objects
 */
export async function deleteOrdersByProductId(productId) {
  const result = await db.query(
    'DELETE FROM orders WHERE product_id = $1 RETURNING *',
    [productId]
  );
  return result.rows;
}

