/**
 * Product Event Publisher
 * 
 * This module publishes product-related events to RabbitMQ.
 * Events are consumed by other services (analytics, notifications) for
 * real-time updates and processing.
 */

import { publishMessage } from '../messaging/broker.js';

/** RabbitMQ queue name for product created events */
const PRODUCT_CREATED_EVENT = 'products.created';
const PRODUCT_DELETED_EVENT = 'products.deleted';

/**
 * Publishes a product created event to RabbitMQ
 * 
 * This event is consumed by:
 * - Analytics Service: Tracks product creation metrics
 * - Notification Service: May send notifications about new products
 * 
 * @param {Object} product - The created product object
 * @param {Object} user - The user who created the product
 * @returns {Promise<void>} Resolves when message is published (or fails silently)
 */
export async function publishProductCreated(product, user) {
  try {
    await publishMessage(PRODUCT_CREATED_EVENT, {
      user: {
        id: user?.id,
        username: user?.username
      },
      product: {
        id: product.id,
        title: product.title,
        author: product.author,
        price: Number(product.price),
        stock: product.stock
      }
    });
  } catch (err) {
    console.warn('Failed to publish product.created event:', err.message);
  }
}

/**
 * Publishes a product deleted event to RabbitMQ
 * 
 * This event is consumed by:
 * - Notification Service: Sends real-time notifications about deleted products
 * - Analytics Service: Tracks product deletion metrics
 * 
 * @param {Object} product - The deleted product object
 * @param {Object} user - The user who deleted the product
 * @param {number} deletedOrdersCount - Number of orders that were deleted along with the product
 * @returns {Promise<void>} Resolves when message is published (or fails silently)
 */
export async function publishProductDeleted(product, user, deletedOrdersCount = 0) {
  try {
    await publishMessage(PRODUCT_DELETED_EVENT, {
      user: {
        id: user?.id,
        username: user?.username
      },
      product: {
        id: product.id,
        title: product.title,
        author: product.author,
        price: Number(product.price),
        stock: product.stock
      },
      deletedOrdersCount
    });
  } catch (err) {
    console.warn('Failed to publish product.deleted event:', err.message);
  }
}

