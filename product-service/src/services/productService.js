/**
 * Product Service Business Logic
 * 
 * This module contains the core business logic for product operations:
 * - Retrieving products
 * - Creating products with validation
 * - Updating products
 * - Deleting products
 * - Publishing product events
 */

import * as productRepository from '../repositories/productRepository.js';
import { publishProductCreated, publishProductDeleted } from '../events/productPublisher.js';
import { deleteOrdersByProduct, CircuitOpenError } from '../grpc/orderClient.js';

/**
 * Retrieves all products from the database
 * 
 * @returns {Promise<Array>} Array of all product objects
 */
export async function getAllProducts() {
  return await productRepository.findAll();
}

/**
 * Retrieves a single product by ID
 * 
 * @param {number} id - Product ID
 * @returns {Promise<Object>} Product object
 * @throws {Error} If product not found
 */
export async function getProductById(id) {
  const product = await productRepository.findById(id);
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
}

/**
 * Creates a new product
 * 
 * Process:
 * 1. Validates required fields (title and author)
 * 2. Creates product record in database
 * 3. Publishes product created event to RabbitMQ
 * 
 * @param {Object} productData - Product creation data
 * @param {string} productData.title - Product title (required)
 * @param {string} productData.author - Product author (required)
 * @param {number} [productData.price] - Product price
 * @param {number} [productData.stock] - Stock quantity
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Created product object
 * @throws {Error} If title or author is missing
 */
export async function createProduct(productData, user) {
  const { title, author, price, stock } = productData;
  
  if (!title || !author) {
    throw new Error('title and author required');
  }

  const product = await productRepository.create({
    title,
    author,
    price,
    stock,
  });

  // Publish product created event
  await publishProductCreated(product, user);

  return product;
}

/**
 * Updates an existing product
 * 
 * @param {number} id - Product ID to update
 * @param {Object} productData - Partial product data (only provided fields are updated)
 * @returns {Promise<Object>} Updated product object
 * @throws {Error} If product not found
 */
export async function updateProduct(id, productData) {
  const product = await productRepository.update(id, productData);
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
}

/**
 * Deletes a product with compensating transaction pattern
 * 
 * Process:
 * 1. Fetch product data (for potential restoration)
 * 2. Delete product from database
 * 3. Delete associated orders from Order Service
 * 4. If order deletion fails, restore the product (compensating transaction)
 * 5. Publish product deleted event if deletion succeeds
 * 
 * @param {number} id - Product ID to delete
 * @param {Object} user - The user who is deleting the product
 * @returns {Promise<Object>} Object containing the deleted product ID and deleted orders count
 * @throws {Error} If product not found or if deletion fails
 */
export async function deleteProduct(id, user) {
  // Step 1: Fetch product data before deletion (for potential restoration)
  const product = await productRepository.findById(id);
  if (!product) {
    throw new Error('Product not found');
  }

  // Step 2: Delete product from database
  const deleteResult = await productRepository.remove(id);
  if (!deleteResult) {
    throw new Error('Product not found');
  }

  let deletedOrdersCount = 0;
  let orderDeletionError = null;

  try {
    // Step 3: Delete associated orders from Order Service via gRPC
    const orderDeletionResult = await deleteOrdersByProduct(id);
    deletedOrdersCount = orderDeletionResult.count || 0;
  } catch (err) {
    // Step 4: Compensating transaction - restore the product if order deletion fails
    orderDeletionError = err;
    
    // Handle circuit breaker open error specifically
    if (err instanceof CircuitOpenError) {
      console.error(`Order service circuit is open for product ${id}. Restoring product...`);
    } else {
      console.error(`Failed to delete orders for product ${id}:`, err.message);
    }
    
    console.log(`Restoring product ${id} due to order deletion failure...`);
    
    try {
      await productRepository.restore(product);
      console.log(`Product ${id} restored successfully`);
    } catch (restoreErr) {
      console.error(`Failed to restore product ${id}:`, restoreErr.message);
      // This is a critical error - product is deleted but couldn't be restored
      throw new Error(`Product deletion failed and restoration failed: ${restoreErr.message}`);
    }
    
    // Throw appropriate error message based on error type
    if (err instanceof CircuitOpenError) {
      throw new Error(`Order service circuit is open, try later. Product has been restored.`);
    }
    throw new Error(`Failed to delete associated orders: ${err.message}. Product has been restored.`);
  }

  // Step 5: Publish product deleted event (only if deletion succeeded)
  await publishProductDeleted(product, user, deletedOrdersCount);

  return { 
    id: deleteResult.id,
    deletedOrdersCount 
  };
}

