/**
 * Notification Service
 * 
 * This service handles real-time notifications for users:
 * - Server-Sent Events (SSE) for real-time notification delivery
 * - Notification storage and retrieval
 * - Consumes order and product events from RabbitMQ
 * - Sends notifications to connected clients via SSE
 * 
 * All endpoints require authentication except the health check.
 */

import '../otel.js';
import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectToBroker } from './messaging/rabbit.js';
import { registerClient, sendHeartbeat } from './push/sse.js';
import { getNotifications, markAllSeen } from './store/notificationStore.js';

dotenv.config();

/** JWT secret for token verification */
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
/** Port number for the HTTP server */
const PORT = process.env.PORT || 8005;

const app = express();
app.use(express.json());


function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/events', requireAuth, (req, res) => {
  const userId = req.user.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial connection message
  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

  // Register this client
  registerClient(userId, res);
});

app.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;
  const notifications = getNotifications(userId);
  res.json(notifications);
});

app.post('/seen', requireAuth, (req, res) => {
  const userId = req.user.id;
  const notifications = markAllSeen(userId);
  res.json(notifications);
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start heartbeat to keep SSE connections alive
// Sends a ping every 30 seconds to prevent connection timeouts
setInterval(sendHeartbeat, 30000);

// Connect to RabbitMQ broker
// Listens for order and product events to generate notifications
connectToBroker().catch((err) => {
  console.error('Failed to connect to RabbitMQ:', err.message);
});

app.listen(PORT, () => {
  console.log(`Notification Service running on ${PORT}`);
});

