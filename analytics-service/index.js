/**
 * Analytics Service
 * 
 * This service tracks user interactions and events:
 * - Receives click tracking events from the frontend
 * - Publishes events to Kafka for processing
 * - Provides health check endpoint
 * 
 * Uses Kafka for event streaming to analytics consumers.
 */

import './otel.js';
import express from 'express';
import dotenv from 'dotenv';
import { Kafka } from 'kafkajs';

dotenv.config();

const app = express();
app.use(express.json());


/** Kafka broker connection string */
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';

// Initialize Kafka producer
const kafka = new Kafka({
  clientId: 'analytics-service',
  brokers: [KAFKA_BROKER]
});

const producer = kafka.producer();

// Connect Kafka producer
(async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
  } catch (err) {
    console.error('Error connecting Kafka producer:', err);
  }
})();

app.post('/track', async (req, res) => {
  try {
    const { buttonId, userId, metadata } = req.body;
    
    const event = {
      buttonId: buttonId || 'unknown',
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };
    
    // Publish to Kafka
    await producer.send({
      topic: 'user-interactions',
      messages: [
        {
          key: userId || 'anonymous',
          value: JSON.stringify(event)
        }
      ]
    });
    
    res.json({ success: true, message: 'Event tracked' });
  } catch (err) {
    console.error('Error tracking event:', err);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8007;
app.listen(PORT, () => console.log(`Analytics Service running on ${PORT}`));

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await producer.disconnect();
  process.exit(0);
});

