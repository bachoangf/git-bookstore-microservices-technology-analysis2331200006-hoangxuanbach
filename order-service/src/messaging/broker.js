/**
 * RabbitMQ Message Broker Client
 * 
 * This module manages the connection to RabbitMQ message broker.
 * It provides functions for:
 * - Connecting to RabbitMQ
 * - Publishing messages to queues
 * 
 * The connection automatically retries if it fails, ensuring resilience.
 */

import amqplib from 'amqplib';

/** RabbitMQ channel instance (null until connected) */
let channel = null;

/**
 * Connects to RabbitMQ broker and creates a channel
 * Automatically retries connection if it fails (every 5 seconds)
 * 
 * @returns {Promise<void>} Resolves when connected successfully
 */
export async function connectToBroker() {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://message-broker:5672';
    const connection = await amqplib.connect(url);
    channel = await connection.createChannel();
    console.log('Connected to RabbitMQ');
  } catch (err) {
    console.error('RabbitMQ connection error:', err.message);
    setTimeout(connectToBroker, 5000);
  }
}

/**
 * Publishes a message to a RabbitMQ queue
 * 
 * @param {string} queue - Queue name to publish to
 * @param {Object|string} message - Message payload (object will be JSON stringified)
 * @returns {Promise<void>} Resolves when message is published
 * @throws {Error} If channel is not ready, message is dropped (logged as warning)
 */
export async function publishMessage(queue, message) {
  if (!channel) {
    console.warn('RabbitMQ channel not ready; dropping message');
    return;
  }

  await channel.assertQueue(queue, { durable: true });
  const payload = typeof message === 'string' ? message : JSON.stringify(message);

  channel.sendToQueue(queue, Buffer.from(payload), {
    persistent: true
  });
}

export default { connectToBroker, publishMessage };

