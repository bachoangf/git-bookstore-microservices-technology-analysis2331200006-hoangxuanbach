/**
 * Notifications Hook
 * 
 * This hook manages real-time notifications via Server-Sent Events (SSE).
 * It:
 * - Loads notifications from the API
 * - Establishes SSE connection for real-time updates
 * - Tracks unseen notification count
 * - Handles marking notifications as seen
 * 
 * @param {string} token - JWT authentication token
 * @param {Function} fetchWithAuth - Authenticated fetch function
 * @returns {Object} Notification state and handlers:
 *   - notifications: Array of notification objects
 *   - isNotificationOpen: Whether notification panel is open
 *   - setNotificationOpen: Function to toggle notification panel
 *   - unseenCount: Number of unseen notifications
 *   - loadNotifications: Function to reload notifications from API
 *   - markNotificationsAsSeen: Function to mark all notifications as seen
 */
import { useState, useCallback, useEffect } from 'react';
import { API_BASE } from '../utils/constants.js';
import { fetchJSON } from '../utils/api.js';

export function useNotifications(token, fetchWithAuth) {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    
    try {
      const notifications = await fetchWithAuth('/api/notifications');
      const notificationsArray = Array.isArray(notifications) ? notifications : [];
      setNotifications(notificationsArray);
      const unseen = notificationsArray.filter(n => !n.seen).length;
      setUnseenCount(unseen);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [token, fetchWithAuth]);

  const markNotificationsAsSeen = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
        setUnseenCount(0);
      }
    } catch (err) {
      console.error('Failed to mark notifications as seen:', err);
    }
  }, [token]);

  // Close notification panel when clicking outside
  useEffect(() => {
    if (!isNotificationOpen) return;
    
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest('.notification-container')) {
        setNotificationOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isNotificationOpen]);

  // Setup SSE connection for real-time notifications
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    let currentEvent = '';
    
    fetch(`${API_BASE}/api/notifications/events`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: controller.signal
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function readChunk() {
          reader.read().then(({ done, value }) => {
            if (done) {
              setTimeout(() => {
                if (token) {
                  // Reconnect logic would go here if needed
                }
              }, 5000);
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7).trim();
                continue;
              }
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (currentEvent === 'notification' && data.notification) {
                    setNotifications(prev => {
                      const exists = prev.find(n => n.id === data.notification.id);
                      if (exists) return prev;
                      const updated = [data.notification, ...prev];
                      const unseen = updated.filter(n => !n.seen).length;
                      setUnseenCount(unseen);
                      return updated;
                    });
                  }
                } catch (err) {
                  console.error('Failed to parse SSE data:', err);
                }
                currentEvent = '';
              }
            }

            readChunk();
          }).catch(err => {
            if (err.name !== 'AbortError') {
              console.error('SSE read error:', err);
            }
          });
        }

        readChunk();
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('SSE connection error:', err);
        }
      });

    return () => {
      controller.abort();
    };
  }, [token]);

  return {
    notifications,
    isNotificationOpen,
    setNotificationOpen,
    unseenCount,
    loadNotifications,
    markNotificationsAsSeen
  };
}

