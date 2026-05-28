/**
 * RabbitMQ Message Broker Integration
 * 
 * This module handles consuming events from RabbitMQ and converting them
 * into notifications that are delivered to users via Server-Sent Events (SSE).
 */

import amqplib from 'amqplib';
import { addNotification } from '../store/notificationStore.js';
import { sendEvent, getConnectedUserIds } from '../push/sse.js';

// Queue names for different event types
const ORDER_CREATED_QUEUE = 'orders.created';
const PRODUCT_CREATED_QUEUE = 'products.created';
const PRODUCT_DELETED_QUEUE = 'products.deleted';

// Global channel reference (set after connection)
let channel = null;

/**
 * Sets up a queue consumer for a specific queue
 * 
 * @param {string} queue - Queue name to consume from
 * @param {Function} handler - Function to process each message
 */
async function consumeQueue(queue, handler) {
  // Assert queue exists (create if it doesn't)
  // durable: true means queue survives broker restarts
  await channel.assertQueue(queue, { durable: true });
  
  // Start consuming messages from the queue
  await channel.consume(queue, async (message) => {
    if (!message) return; // No message available
    
    try {
      // Parse message content (expected to be JSON)
      const payload = JSON.parse(message.content.toString() || '{}');
      
      // Process the message using the provided handler
      await handler(payload);
    } catch (err) {
      console.error(`Failed to process message from ${queue}:`, err.message);
      // Note: Message is still acknowledged even on error
      // In production, consider implementing dead letter queue
    } finally {
      // Acknowledge message processing (removes from queue)
      channel.ack(message);
    }
  });
}

/**
 * Handles order created events from RabbitMQ
 * Creates a notification and sends it to the user via SSE
 * 
 * @param {Object} message - Event message containing user, order, and product data
 */
function handleOrderCreated(message) {
  const { user, order, product } = message;
  
  // Skip if no user ID (can't send notification without user)
  if (!user?.id) return;

  // Build notification title and body
  const title = 'Order placed';
  const bodyParts = [];
  
  // Include username if available
  if (user.username) {
    bodyParts.push(`${user.username} placed an order`);
  } else {
    bodyParts.push('An order was placed');
  }
  
  // Include product title if available
  if (product?.title) {
    bodyParts.push(`for "${product.title}"`);
  }
  
  // Include quantity if available
  if (order?.quantity) {
    bodyParts.push(`(x${order.quantity})`);
  }

  const body = bodyParts.join(' ');

  // Create and store notification
  const notification = addNotification(user.id, {
    type: 'orders.created',
    title,
    body,
    metadata: {
      orderId: order?.id,
      productId: product?.id,
      quantity: order?.quantity || null
    }
  });

  // Send notification to user via SSE (if connected)
  sendEvent(user.id, 'notification', { notification });
}

/**
 * Handles product created events from RabbitMQ
 * Creates a notification and sends it to the user via SSE
 * 
 * @param {Object} message - Event message containing user and product data
 */
function handleProductCreated(message) {
  const { user, product } = message;
  
  // Skip if no user ID
  if (!user?.id) return;

  // Build notification
  const title = 'Product created';
  const name = product?.title ? `"${product.title}"` : 'a new product';
  const body = user.username ? `${user.username} added ${name}` : `A user added ${name}`;

  // Create and store notification
  const notification = addNotification(user.id, {
    type: 'products.created',
    title,
    body,
    metadata: {
      productId: product?.id,
      author: product?.author || null
    }
  });

  // Send notification to user via SSE (if connected)
  sendEvent(user.id, 'notification', { notification });
}

/**
 * Handles product deleted events from RabbitMQ
 * Creates a notification and sends it to all connected users via SSE
 * 
 * @param {Object} message - Event message containing user, product, and deletedOrdersCount data
 */
function handleProductDeleted(message) {
  const { user, product, deletedOrdersCount } = message;
  
  // Skip if no product
  if (!product) return;

  // Build notification message
  const title = 'Product deleted';
  const productName = product?.title ? `"${product.title}"` : 'a product';
  const bodyParts = [];
  
  // Include username if available
  if (user?.username) {
    bodyParts.push(`${user.username} deleted ${productName}`);
  } else {
    bodyParts.push(`${productName} was deleted`);
  }
  
  // Include order deletion info if orders were deleted
  if (deletedOrdersCount > 0) {
    const orderText = deletedOrdersCount === 1 ? 'order' : 'orders';
    bodyParts.push(`(${deletedOrdersCount} ${orderText} were also removed)`);
  }

  const body = bodyParts.join(' ');

  // Get all connected user IDs and create notifications for each
  const connectedUserIds = getConnectedUserIds();
  
  // Create and send notifications to all connected users
  for (const userId of connectedUserIds) {
    const notification = addNotification(userId, {
      type: 'products.deleted',
      title,
      body,
      metadata: {
        productId: product?.id,
        deletedOrdersCount: deletedOrdersCount || 0
      }
    });

    // Send notification to user via SSE
    sendEvent(userId, 'notification', { notification });
  }
}

/**
 * Connects to RabbitMQ and sets up queue consumers
 * Implements automatic reconnection on connection loss
 */
export async function connectToBroker() {
  const url = process.env.RABBITMQ_URL || 'amqp://message-broker:5672';

  try {
    // Establish connection to RabbitMQ
    const connection = await amqplib.connect(url);
    
    // Handle connection errors
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
    });
    
    // Handle connection close (attempts to reconnect)
    connection.on('close', () => {
      console.error('RabbitMQ connection closed. Attempting to reconnect...');
      setTimeout(() => {
        connectToBroker().catch((err) => {
          console.error('Failed to reconnect to RabbitMQ:', err.message);
        });
      }, 5000); // Retry after 5 seconds
    });

    // Create channel for message operations
    channel = await connection.createChannel();
    console.log('Notification service connected to RabbitMQ');

    // Set up consumers for each event type
    await consumeQueue(ORDER_CREATED_QUEUE, handleOrderCreated);
    await consumeQueue(PRODUCT_CREATED_QUEUE, handleProductCreated);
    await consumeQueue(PRODUCT_DELETED_QUEUE, handleProductDeleted);
  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err.message);
    
    // Retry connection after 5 seconds
    setTimeout(() => {
      connectToBroker().catch((error) => {
        console.error('Reconnection attempt failed:', error.message);
      });
    }, 5000);
  }
}

/**
 * Checks if RabbitMQ broker is ready (connected)
 * 
 * @returns {boolean} True if channel is available
 */
export function isBrokerReady() {
  return Boolean(channel);
}


