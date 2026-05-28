/**
 * Server-Sent Events (SSE) Management
 * 
 * This module manages SSE client connections for real-time notification delivery.
 * It:
 * - Tracks connected clients per user
 * - Sends events to specific users
 * - Handles client disconnections
 * - Provides heartbeat mechanism to keep connections alive
 */

/** Map of userId -> Set of response objects (SSE connections) */
const clients = new Map();

/**
 * Gets or creates a Set of SSE connections for a user
 * 
 * @param {string} userId - User ID
 * @returns {Set} Set of Express response objects for this user
 */
function getClientSet(userId) {
  let set = clients.get(userId);
  if (!set) {
    set = new Set();
    clients.set(userId, set);
  }
  return set;
}

/**
 * Registers a new SSE client connection for a user
 * Automatically handles cleanup when the connection closes
 * 
 * @param {string} userId - User ID
 * @param {Object} res - Express response object (SSE connection)
 */
export function registerClient(userId, res) {
  const set = getClientSet(userId);
  set.add(res);

  res.on('close', () => {
    set.delete(res);
    if (set.size === 0) {
      clients.delete(userId);
    }
  });
}

/**
 * Sends an SSE event to all connected clients for a specific user
 * 
 * @param {string} userId - User ID to send event to
 * @param {string} event - Event type name
 * @param {Object} payload - Event data payload
 */
export function sendEvent(userId, event, payload) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;

  const serialized = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    res.write(serialized);
  }
}

/**
 * Sends heartbeat messages to all connected SSE clients
 * This keeps connections alive and helps detect connection issues
 * Called periodically (every 30 seconds) from the main service
 */
export function sendHeartbeat() {
  const payload = 'event: heartbeat\ndata: {}\n\n';
  for (const set of clients.values()) {
    for (const res of set) {
      res.write(payload);
    }
  }
}

/**
 * Gets all currently connected user IDs
 * 
 * @returns {Array<string>} Array of user IDs that have active SSE connections
 */
export function getConnectedUserIds() {
  return Array.from(clients.keys());
}

/**
 * Broadcasts an SSE event to all connected clients
 * 
 * @param {string} event - Event type name
 * @param {Object} payload - Event data payload
 */
export function broadcastEvent(event, payload) {
  const serialized = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const set of clients.values()) {
    for (const res of set) {
      res.write(serialized);
    }
  }
}


