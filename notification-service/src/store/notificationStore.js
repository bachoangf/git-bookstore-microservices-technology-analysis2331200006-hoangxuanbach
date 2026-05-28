/**
 * Notification Storage
 * 
 * This module provides in-memory storage for user notifications.
 * Notifications are stored per user and can be:
 * - Retrieved (with cloning to prevent mutation)
 * - Added (with automatic ID generation)
 * - Marked as seen
 * 
 * Note: This is in-memory storage. Notifications are lost on service restart.
 * For production, consider using Redis or a database for persistence.
 */

import { randomUUID } from 'crypto';

/** Map of userId -> Array of notification objects */
const store = new Map();

/**
 * Clones an array of notifications to prevent external mutation
 * 
 * @param {Array} notifications - Array of notification objects
 * @returns {Array} Cloned array of notifications
 */
function cloneNotifications(notifications) {
  return notifications.map((notification) => ({ ...notification }));
}

/**
 * Retrieves all notifications for a user
 * Returns a cloned array to prevent external mutation
 * 
 * @param {string} userId - User ID
 * @returns {Array} Array of notification objects (empty array if none)
 */
export function getNotifications(userId) {
  const list = store.get(userId);
  if (!list) return [];
  return cloneNotifications(list);
}

/**
 * Adds a new notification for a user
 * Notification is prepended to the list (newest first)
 * 
 * @param {string} userId - User ID
 * @param {Object} data - Notification data
 * @param {string} data.title - Notification title
 * @param {string} data.body - Notification body text
 * @param {string} [data.type] - Notification type (default: 'info')
 * @param {Object} [data.metadata] - Additional metadata object
 * @returns {Object} The created notification object (cloned)
 */
export function addNotification(userId, data) {
  const notification = {
    id: randomUUID(),
    title: data.title,
    body: data.body,
    type: data.type || 'info',
    metadata: data.metadata || {},
    seen: false,
    createdAt: new Date().toISOString()
  };

  const existing = store.get(userId) || [];
  const next = [notification, ...existing];
  store.set(userId, next);

  return { ...notification };
}

/**
 * Marks all notifications as seen for a user
 * 
 * @param {string} userId - User ID
 * @returns {Array} Updated array of notification objects (all marked as seen)
 */
export function markAllSeen(userId) {
  const existing = store.get(userId) || [];
  if (existing.length === 0) return [];

  const updated = existing.map((notification) => ({ ...notification, seen: true }));
  store.set(userId, updated);
  return cloneNotifications(updated);
}

/**
 * Checks if a user has any notifications
 * 
 * @param {string} userId - User ID
 * @returns {boolean} True if user has notifications, false otherwise
 */
export function hasNotifications(userId) {
  return store.has(userId) && store.get(userId).length > 0;
}


