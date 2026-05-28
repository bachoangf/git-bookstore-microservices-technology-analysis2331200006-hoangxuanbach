/**
 * Analytics Dashboard Service
 * 
 * This service provides real-time analytics dashboard for user interactions:
 * - Consumes user interaction events from Kafka
 * - Aggregates analytics data (clicks by button, user, time)
 * - Serves analytics data via REST API
 * - Provides a web dashboard UI with charts and statistics
 * 
 * Analytics are stored in-memory and reset on service restart.
 * For production, consider persisting to a database.
 */

import express from 'express';
import cors from 'cors';
import { Kafka } from 'kafkajs';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8006;
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';

// In-memory storage for analytics
const analytics = {
  totalClicks: 0,
  clicksByButton: {},
  clicksByUser: {},
  clicksByTime: [],
  recentEvents: []
};

// Initialize Kafka consumer
const kafka = new Kafka({
  clientId: 'analytics-dashboard-service',
  brokers: [KAFKA_BROKER]
});

const consumer = kafka.consumer({ groupId: 'dashboard-group' });

// Start consuming events
async function startConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'user-interactions', fromBeginning: false });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log('Received event:', event);
          
          // Update analytics
          analytics.totalClicks++;
          
          // Track clicks by button
          const buttonId = event.buttonId || 'unknown';
          analytics.clicksByButton[buttonId] = (analytics.clicksByButton[buttonId] || 0) + 1;
          
          // Track clicks by user
          const userId = event.userId || 'anonymous';
          analytics.clicksByUser[userId] = (analytics.clicksByUser[userId] || 0) + 1;
          
          // Track by time (last 24 hours)
          const timestamp = new Date(event.timestamp || Date.now());
          const hour = timestamp.getHours();
          const timeKey = `${timestamp.toDateString()} ${hour}:00`;
          if (!analytics.clicksByTime.find(t => t.time === timeKey)) {
            analytics.clicksByTime.push({ time: timeKey, count: 0 });
          }
          const timeEntry = analytics.clicksByTime.find(t => t.time === timeKey);
          if (timeEntry) timeEntry.count++;
          
          // Keep recent events (last 100)
          analytics.recentEvents.unshift({
            ...event,
            timestamp: timestamp.toISOString()
          });
          if (analytics.recentEvents.length > 100) {
            analytics.recentEvents.pop();
          }
          
          // Clean up old time entries (keep last 24 hours)
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          analytics.clicksByTime = analytics.clicksByTime.filter(t => {
            const entryTime = new Date(t.time).getTime();
            return entryTime > oneDayAgo;
          });
          
        } catch (err) {
          console.error('Error processing message:', err);
        }
      }
    });
    
    console.log('Kafka consumer started and subscribed to user-interactions topic');
  } catch (err) {
    console.error('Error starting Kafka consumer:', err);
    // Retry after 5 seconds
    setTimeout(startConsumer, 5000);
  }
}

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/analytics', (req, res) => {
  // Get top buttons
  const topButtons = Object.entries(analytics.clicksByButton)
    .map(([buttonId, count]) => ({ buttonId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Get top users
  const topUsers = Object.entries(analytics.clicksByUser)
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  res.json({
    totalClicks: analytics.totalClicks,
    topButtons,
    topUsers,
    clicksByTime: analytics.clicksByTime.sort((a, b) => 
      new Date(a.time) - new Date(b.time)
    ),
    recentEvents: analytics.recentEvents.slice(0, 50)
  });
});

app.get('/api/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(analytics.recentEvents.slice(0, limit));
});

// Serve dashboard UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Interaction Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .stat-card .value {
      font-size: 2.5em;
      font-weight: bold;
      color: #667eea;
    }
    .chart-container {
      background: white;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .chart-container h2 {
      margin-bottom: 20px;
      color: #333;
    }
    .events-list {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      max-height: 500px;
      overflow-y: auto;
    }
    .event-item {
      padding: 15px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .event-item:last-child {
      border-bottom: none;
    }
    .event-info {
      flex: 1;
    }
    .event-time {
      color: #666;
      font-size: 0.9em;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
      margin-right: 8px;
    }
    .badge-button {
      background: #667eea;
      color: white;
    }
    .badge-user {
      background: #764ba2;
      color: white;
    }
    .refresh-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1em;
      margin-top: 10px;
    }
    .refresh-btn:hover {
      background: #5568d3;
    }
    .auto-refresh {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 User Interaction Dashboard</h1>
      <p>Real-time analytics of user clicks and interactions</p>
      <div class="auto-refresh">
        <input type="checkbox" id="autoRefresh" checked>
        <label for="autoRefresh">Auto-refresh every 2 seconds</label>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Clicks</h3>
        <div class="value" id="totalClicks">0</div>
      </div>
      <div class="stat-card">
        <h3>Unique Buttons</h3>
        <div class="value" id="uniqueButtons">0</div>
      </div>
      <div class="stat-card">
        <h3>Active Users</h3>
        <div class="value" id="activeUsers">0</div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div class="chart-container">
        <h2>Top Clicked Buttons</h2>
        <canvas id="buttonsChart"></canvas>
      </div>
      <div class="chart-container">
        <h2>Top Active Users</h2>
        <canvas id="usersChart"></canvas>
      </div>
    </div>
    
    <div class="chart-container">
      <h2>Clicks Over Time (Last 24 Hours)</h2>
      <canvas id="timeChart"></canvas>
    </div>
    
    <div class="events-list">
      <h2 style="margin-bottom: 20px;">Recent Events</h2>
      <div id="eventsList"></div>
    </div>
  </div>
  
  <script>
    let buttonsChart, usersChart, timeChart;
    let autoRefreshInterval;
    
    function initCharts() {
      const buttonsCtx = document.getElementById('buttonsChart').getContext('2d');
      buttonsChart = new Chart(buttonsCtx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Clicks', data: [], backgroundColor: '#667eea' }] },
        options: { responsive: true, maintainAspectRatio: true }
      });
      
      const usersCtx = document.getElementById('usersChart').getContext('2d');
      usersChart = new Chart(usersCtx, {
        type: 'doughnut',
        data: { labels: [], datasets: [{ data: [], backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'] }] },
        options: { responsive: true, maintainAspectRatio: true }
      });
      
      const timeCtx = document.getElementById('timeChart').getContext('2d');
      timeChart = new Chart(timeCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Clicks', data: [], borderColor: '#667eea', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } } }
      });
    }
    
    async function loadData() {
      try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        // Update stats
        document.getElementById('totalClicks').textContent = data.totalClicks;
        document.getElementById('uniqueButtons').textContent = data.topButtons.length;
        document.getElementById('activeUsers').textContent = data.topUsers.length;
        
        // Update buttons chart
        buttonsChart.data.labels = data.topButtons.map(b => b.buttonId);
        buttonsChart.data.datasets[0].data = data.topButtons.map(b => b.count);
        buttonsChart.update();
        
        // Update users chart
        usersChart.data.labels = data.topUsers.map(u => u.userId);
        usersChart.data.datasets[0].data = data.topUsers.map(u => u.count);
        usersChart.update();
        
        // Update time chart
        timeChart.data.labels = data.clicksByTime.map(t => t.time);
        timeChart.data.datasets[0].data = data.clicksByTime.map(t => t.count);
        timeChart.update();
        
        // Update events list
        const eventsList = document.getElementById('eventsList');
        eventsList.innerHTML = data.recentEvents.map(event => \`
          <div class="event-item">
            <div class="event-info">
              <span class="badge badge-button">\${event.buttonId || 'unknown'}</span>
              <span class="badge badge-user">\${event.userId || 'anonymous'}</span>
              <span class="event-time">\${new Date(event.timestamp).toLocaleString()}</span>
            </div>
          </div>
        \`).join('');
        
      } catch (err) {
        console.error('Error loading data:', err);
      }
    }
    
    document.getElementById('autoRefresh').addEventListener('change', (e) => {
      if (e.target.checked) {
        autoRefreshInterval = setInterval(loadData, 2000);
      } else {
        clearInterval(autoRefreshInterval);
      }
    });
    
    initCharts();
    loadData();
    autoRefreshInterval = setInterval(loadData, 2000);
  </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`Dashboard service running on port ${PORT}`);
  startConsumer();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await consumer.disconnect();
  process.exit(0);
});

