# Analytics Dashboard Service

Consumes Kafka events and provides a real-time analytics dashboard with visualizations.

## Overview

The Analytics Dashboard Service handles:
- Kafka event consumption
- Real-time analytics aggregation
- Interactive dashboard UI
- Analytics API endpoints

## Architecture

```
Kafka Topic (user-interactions)
    │
    ▼
Analytics Dashboard Service (Port 8006)
    │
    ├──► Kafka Consumer
    │       └──► Event Processing
    │       └──► In-Memory Aggregation
    │
    ├──► Dashboard UI (/)
    │       └──► Charts & Visualizations
    │
    └──► Analytics API (/api/analytics)
            └──► Aggregated Statistics
```

## Features

### Real-time Analytics
- Total clicks tracking
- Clicks by button ID
- Clicks by user ID
- Time-based click distribution (last 24 hours)
- Recent events log

### Visualizations
- **Bar Chart:** Top clicked buttons
- **Doughnut Chart:** Top active users
- **Line Chart:** Clicks over time
- **Event List:** Recent interactions

### Auto-refresh
- Dashboard auto-refreshes every 2 seconds
- Can be toggled on/off
- Real-time updates without page reload

## API Endpoints

**Note:** All endpoints below are service-level routes. When accessed through the API Gateway, they are prefixed with `/api/dashboard` (e.g., `/api/dashboard/api/analytics`).

### `GET /`
Serves the analytics dashboard UI.

**Response:** HTML page with interactive dashboard

**Gateway Access:** `GET /api/dashboard`

### `GET /api/analytics`
Retrieves aggregated analytics data.

**Gateway Access:** `GET /api/dashboard/api/analytics`

**Response:**
```json
{
  "totalClicks": 1250,
  "topButtons": [
    { "buttonId": "create-order-button", "count": 450 },
    { "buttonId": "add-product-button", "count": 320 }
  ],
  "topUsers": [
    { "userId": "user123", "count": 150 },
    { "userId": "user456", "count": 120 }
  ],
  "clicksByTime": [
    { "time": "2024-01-01 10:00", "count": 45 },
    { "time": "2024-01-01 11:00", "count": 67 }
  ],
  "recentEvents": [
    {
      "buttonId": "create-order-button",
      "userId": "user123",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "metadata": {}
    }
  ]
}
```

### `GET /api/events`
Retrieves recent events.

**Query Parameters:**
- `limit`: Maximum number of events (default: 50)

**Response:**
```json
[
  {
    "buttonId": "create-order-button",
    "userId": "user123",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "metadata": {}
  }
]
```

**Gateway Access:** `GET /api/dashboard/api/events`

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Kafka Consumer

**Configuration:**
- Consumer Group: `dashboard-group`
- Topic: `user-interactions`
- From Beginning: `false` (only new messages)

**Event Processing:**
1. Consume event from Kafka
2. Parse JSON event data
3. Update analytics aggregations:
   - Increment total clicks
   - Update button click counts
   - Update user click counts
   - Add to time-based distribution
   - Add to recent events (max 100)
4. Clean up old time entries (keep last 24 hours)

## Analytics Aggregation

**In-Memory Storage:**
```javascript
{
  totalClicks: Number,
  clicksByButton: { [buttonId]: count },
  clicksByUser: { [userId]: count },
  clicksByTime: [{ time: String, count: Number }],
  recentEvents: [Event] // Max 100 events
}
```

**Data Retention:**
- Recent events: Last 100 events
- Time distribution: Last 24 hours
- Button/User counts: All-time (resets on restart)

## Dashboard UI

The dashboard provides:
- **Statistics Cards:** Total clicks, unique buttons, active users
- **Interactive Charts:** Using Chart.js library
- **Real-time Updates:** Auto-refresh every 2 seconds
- **Responsive Design:** Works on desktop and mobile

**Chart Types:**
1. **Bar Chart:** Top 10 clicked buttons
2. **Doughnut Chart:** Top 10 active users
3. **Line Chart:** Clicks over time (last 24 hours)

## Configuration

**Environment Variables:**
- `PORT`: HTTP server port (default: `8006`)
- `KAFKA_BROKER`: Kafka broker address (default: `localhost:9092`)

## Dependencies

- `express`: Web framework
- `cors`: CORS middleware
- `kafkajs`: Kafka client library

## Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
export PORT=8006
export KAFKA_BROKER=localhost:9092

# Start server
node src/index.js
```

## Data Flow

1. **Event Production:** Analytics Service publishes events to Kafka
2. **Event Consumption:** Dashboard Service consumes events
3. **Aggregation:** Events are aggregated in-memory
4. **Visualization:** Dashboard UI fetches aggregated data via API
5. **Display:** Charts and statistics are rendered and auto-refreshed

## Limitations

1. **In-Memory Storage:** Analytics data is lost on service restart
2. **Single Instance:** Multiple instances won't share analytics state
3. **No Persistence:** Historical data is not persisted

**Production Considerations:**
- Use Redis or database for persistent storage
- Implement distributed aggregation (e.g., Apache Spark)
- Add data retention policies
- Implement time-windowed aggregations
- Add export functionality for historical data

## Access

The dashboard is accessible at:
- **Direct Access:** http://localhost:8006
- **Via Gateway:** http://localhost:8000/api/dashboard
- **Analytics API (Direct):** http://localhost:8006/api/analytics
- **Analytics API (Via Gateway):** http://localhost:8000/api/dashboard/api/analytics

