# Analytics Service

Tracks user interactions and publishes events to Kafka for analytics processing.

## Overview

The Analytics Service handles:
- User interaction tracking
- Event publishing to Kafka
- Public endpoint (no authentication required)

## Architecture

```
Client Request
    │
    ▼
Analytics Service (Port 8007)
    │
    ├──► Track Endpoint
    │       └──► Event Creation
    │       └──► Kafka Producer
    │               └──► Topic: user-interactions
    │
    └──► Health Check
```

## API Endpoints

**Note:** All endpoints below are service-level routes. When accessed through the API Gateway, they are prefixed with `/api/analytics` (e.g., `/api/analytics/track`).

### `POST /track`
Tracks a user interaction event.

**Gateway Access:** `POST /api/analytics/track`

**Request Body:**
```json
{
  "buttonId": "create-order-button",
  "userId": "user123",
  "metadata": {
    "page": "orders",
    "action": "click"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event tracked"
}
```

**Event Structure:**
```json
{
  "buttonId": "create-order-button",
  "userId": "user123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "page": "orders",
    "action": "click"
  }
}
```

### `GET /healthz`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Kafka Integration

The service publishes events to a Kafka topic:

**Topic:** `user-interactions`

**Producer Configuration:**
- Client ID: `analytics-service`
- Message Key: User ID (for partitioning)
- Message Value: JSON stringified event

**Event Flow:**
1. Client sends tracking request
2. Service creates event with timestamp
3. Event published to Kafka topic
4. Analytics Dashboard Service consumes and processes

## Public Endpoint

The `/track` endpoint is **public** and does not require authentication. This allows:
- Anonymous user tracking
- Easy integration from frontend
- No authentication overhead

**Security Considerations:**
- Rate limiting should be implemented in production
- Input validation prevents abuse
- Consider adding API keys for production use

## Configuration

**Environment Variables:**
- `PORT`: HTTP server port (default: `8007`)
- `KAFKA_BROKER`: Kafka broker address (default: `localhost:9092`)

## Dependencies

- `express`: Web framework
- `kafkajs`: Kafka client library

## Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
export PORT=8007
export KAFKA_BROKER=localhost:9092

# Start server
node index.js
```

## Event Schema

**Required Fields:**
- `buttonId`: Identifier for the UI element (default: 'unknown')
- `userId`: User identifier (default: 'anonymous')
- `timestamp`: ISO 8601 timestamp (auto-generated)

**Optional Fields:**
- `metadata`: Additional event data (object)

## Use Cases

1. **Button Click Tracking:** Track which buttons users click most
2. **User Behavior Analysis:** Understand user interaction patterns
3. **A/B Testing:** Track different variants of UI elements
4. **Performance Monitoring:** Track user actions for performance analysis

## Integration Example

**Frontend Integration:**
```javascript
async function trackInteraction(buttonId, metadata = {}) {
  await fetch('http://localhost:8000/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buttonId,
      userId: currentUser?.id || 'anonymous',
      metadata
    })
  });
}

// Usage
button.addEventListener('click', () => {
  trackInteraction('create-order-button', { page: 'orders' });
});
```

## Graceful Shutdown

The service implements graceful shutdown:
- Disconnects Kafka producer on SIGTERM
- Ensures pending messages are sent before exit

