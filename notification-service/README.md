# Notification Service

Provides real-time notifications via Server-Sent Events (SSE) and RabbitMQ event consumption.

## Overview

The Notification Service handles:
- Real-time notification delivery via SSE
- RabbitMQ event consumption
- In-memory notification storage
- Notification status management (seen/unseen)

## Architecture

```
Event Sources
    │
    ├──► RabbitMQ (Order/Product Events)
    │       └──► Notification Service Consumer
    │               └──► Store Notification
    │               └──► Push to Connected Clients (SSE)
    │
    └──► Client Connections
            └──► Server-Sent Events (SSE)
                    └──► Real-time Notification Stream
```

## API Endpoints

**Note:** All endpoints below are service-level routes. When accessed through the API Gateway, they are prefixed with `/api/notifications` (e.g., `/api/notifications/events`).

### `GET /events`
Establishes a Server-Sent Events (SSE) connection for real-time notifications.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Event stream with notifications

**Event Types:**
- `connected`: Initial connection confirmation
- `notification`: New notification delivery

**Example Event:**
```
event: notification
data: {"id":"123","title":"Order Created","body":"Your order #1 has been created","type":"order","seen":false,"createdAt":"2024-01-01T00:00:00.000Z"}
```

**Gateway Access:** `GET /api/notifications/events`

### `GET /`
Retrieves all notifications for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "123",
    "title": "Order Created",
    "body": "Your order #1 has been created",
    "type": "order",
    "seen": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "metadata": "{\"orderId\":1}"
  }
]
```

**Gateway Access:** `GET /api/notifications`

### `POST /seen`
Marks all notifications as seen for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "123",
    "title": "Order Created",
    "body": "Your order #1 has been created",
    "type": "order",
    "seen": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Gateway Access:** `POST /api/notifications/seen`

## RabbitMQ Integration

The service consumes events from RabbitMQ queues:

**Consumed Events:**
- `order.created` - When an order is created
- `product.created` - When a product is created
- `product.updated` - When a product is updated

**Event Processing:**
1. Event received from RabbitMQ
2. Notification created and stored in-memory
3. Notification pushed to all connected SSE clients for that user
4. Notification persists until marked as seen

## Server-Sent Events (SSE)

SSE provides a one-way communication channel from server to client:

**Features:**
- Automatic reconnection on connection loss
- Heartbeat messages every 30 seconds to keep connection alive
- User-specific notification filtering
- Real-time delivery without polling

**Client Connection:**
```javascript
// Use Fetch streaming so we can include the Authorization header required by the gateway
const response = await fetch('/api/notifications/events', {
  headers: { Authorization: `Bearer ${token}` }
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
let currentEvent = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim();
      continue;
    }
    if (line.startsWith('data: ') && currentEvent === 'notification') {
      const { notification } = JSON.parse(line.slice(6));
      // Handle notification payload
    }
  }
}
```

## Notification Storage

Notifications are stored in-memory with the following structure:

```javascript
{
  id: String (unique identifier),
  userId: String (user ID),
  title: String (notification title),
  body: String (notification body),
  type: String (notification type: 'order', 'product', etc.),
  seen: Boolean (read status),
  createdAt: Date (creation timestamp),
  metadata: String (optional JSON metadata)
}
```

**Note:** In-memory storage means notifications are lost on service restart. For production, consider using a persistent store (Redis, database).

## Configuration

**Environment Variables:**
- `PORT`: HTTP server port (default: `8005`)
- `JWT_SECRET`: Secret for JWT verification (default: 'devsecret')
- `RABBITMQ_URL`: RabbitMQ connection string (default: `amqp://message-broker:5672`)

## Dependencies

- `express`: Web framework
- `amqplib`: RabbitMQ client
- `jsonwebtoken`: JWT verification

## Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
export PORT=8005
export JWT_SECRET=your-secret-key
export RABBITMQ_URL=amqp://localhost:5672

# Start server
node src/index.js
```

## Heartbeat Mechanism

The service sends heartbeat messages every 30 seconds to keep SSE connections alive:

```
event: heartbeat
data: {"timestamp":"2024-01-01T00:00:00.000Z"}
```

This prevents connection timeouts and allows clients to detect connection issues.

## Limitations

1. **In-Memory Storage:** Notifications are lost on service restart
2. **Single Instance:** Multiple instances won't share notification state
3. **No Persistence:** Notifications are not persisted to disk

**Production Considerations:**
- Use Redis for distributed notification storage
- Implement database persistence for notification history
- Add notification expiration/TTL
- Implement notification batching for high-volume scenarios

