/**
 * Product Repository
 * 
 * This module provides data access layer functions for product operations.
 * It handles all database interactions related to products (books), abstracting
 * SQL queries from the business logic layer.
 */

import db from '../database/db.js';

/**
 * Retrieves all products from the database
 * Products are returned in ascending order by ID
 * 
 * @returns {Promise<Array>} Array of all product objects
 */
export async function findAll() {
  const result = await db.query('SELECT * FROM books ORDER BY id ASC');
  return result.rows;
}

/**
 * Finds a single product by its ID
 * 
 * @param {number} id - Product ID to search for
 * @returns {Promise<Object|null>} Product object if found, null otherwise
 */
export async function findById(id) {
  const result = await db.query('SELECT * FROM books WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Creates a new product record in the database
 * 
 * @param {Object} productData - Product data
 * @param {string} productData.title - Product title
 * @param {string} productData.author - Product author
 * @param {number} productData.price - Product price (defaults to 0 if not provided)
 * @param {number} productData.stock - Stock quantity (defaults to 100 if not provided)
 * @returns {Promise<Object>} The created product object with all fields
 */
export async function create({ title, author, price, stock }) {
  const result = await db.query(
    'INSERT INTO books (title, author, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, author, price ?? 0, stock ?? 100]
  );
  return result.rows[0];
}

/**
 * Updates an existing product record
 * Only provided fields are updated (COALESCE allows partial updates)
 * 
 * @param {number} id - Product ID to update
 * @param {Object} productData - Partial product data (only provided fields are updated)
 * @param {string} [productData.title] - New product title
 * @param {string} [productData.author] - New product author
 * @param {number} [productData.price] - New product price
 * @param {number} [productData.stock] - New stock quantity
 * @returns {Promise<Object|null>} Updated product object if found, null otherwise
 */
export async function update(id, { title, author, price, stock }) {
  const result = await db.query(
    'UPDATE books SET title = COALESCE($1, title), author = COALESCE($2, author), price = COALESCE($3, price), stock = COALESCE($4, stock) WHERE id = $5 RETURNING *',
    [title ?? null, author ?? null, price ?? null, stock ?? null, id]
  );
  return result.rows[0] || null;
}

/**
 * Deletes a product from the database
 * 
 * @param {number} id - Product ID to delete
 * @returns {Promise<Object|null>} Deleted product ID if found, null otherwise
 */
export async function remove(id) {
  const result = await db.query('DELETE FROM books WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

/**
 * Restores a product to the database (for compensating transactions)
 * 
 * @param {Object} productData - Product data to restore
 * @param {number} productData.id - Product ID
 * @param {string} productData.title - Product title
 * @param {string} productData.author - Product author
 * @param {number} productData.price - Product price
 * @param {number} productData.stock - Stock quantity
 * @returns {Promise<Object>} The restored product object
 */
export async function restore(productData) {
  const { id, title, author, price, stock } = productData;
  const result = await db.query(
    'INSERT INTO books (id, title, author, price, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [id, title, author, price, stock]
  );
  return result.rows[0];
}

