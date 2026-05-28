/**
 * Order Event Publisher
 * 
 * This module publishes order-related events to RabbitMQ.
 * Events are consumed by other services (notifications, analytics) for
 * real-time updates and processing.
 */

import { publishMessage } from '../messaging/broker.js';

/** RabbitMQ queue name for order created events */
const ORDER_CREATED_EVENT = 'orders.created';

/**
 * Publishes an order created event to RabbitMQ
 * 
 * This event is consumed by:
 * - Notification Service: Sends real-time notifications to users
 * - Analytics Service: Tracks order metrics and statistics
 * 
 * @param {Object} order - The created order object
 * @param {Object} product - The product associated with the order
 * @param {Object} user - The user who created the order
 * @returns {Promise<void>} Resolves when message is published (or fails silently)
 */
export async function publishOrderCreated(order, product, user) {
  try {
    await publishMessage(ORDER_CREATED_EVENT, {
      user: {
        id: user?.id,
        username: user?.username
      },
      order: {
        id: order.id,
        productId: order.product_id,
        quantity: order.quantity,
        price: Number(product.price)
      },
      product: {
        id: product.id,
        title: product.title,
        author: product.author,
        price: Number(product.price)
      }
    });
  } catch (err) {
    console.warn('Failed to publish order.created event:', err.message);
  }
}

