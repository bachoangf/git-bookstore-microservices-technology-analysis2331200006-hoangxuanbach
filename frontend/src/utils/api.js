/**
 * API Utility Functions
 * 
 * This module provides helper functions for making HTTP requests to the backend API.
 * It handles:
 * - Adding authentication headers automatically
 * - JSON request/response parsing
 * - Error handling and response validation
 * - Analytics tracking for user interactions
 */

import { API_BASE } from './constants.js';

/**
 * Generic fetch wrapper with authentication headers
 * 
 * Makes HTTP requests to the API with proper JSON headers and authentication.
 * Automatically parses JSON responses and throws errors for non-OK responses.
 * 
 * @param {string} path - API endpoint path (e.g., '/api/products')
 * @param {Object} options - Fetch options (method, body, etc.)
 * @param {Object} authHeaders - Authentication headers (typically { Authorization: 'Bearer <token>' })
 * @returns {Promise<Object>} Parsed JSON response data
 * @throws {Error} If request fails or response is not OK
 */
export const fetchJSON = async (path, options = {}, authHeaders = {}) => {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...authHeaders
    }
  });
  
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    if (res.status !== 204) {
      data = { message: 'Unable to parse response' };
    }
  }
  
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Request failed');
  }
  
  return data;
};


/**
 * Track user interactions for analytics
 * 
 * Sends click/interaction events to the Analytics Service for tracking.
 * This is used to monitor user behavior and button usage throughout the application.
 * 
 * Fails silently - analytics tracking should not interrupt user experience.
 * 
 * @param {string} buttonId - Identifier for the button/element clicked
 * @param {Object} metadata - Additional metadata about the interaction
 * @param {string|null} userId - User ID (if authenticated) or null for anonymous
 * @returns {Promise<void>} Resolves when tracking request completes (or fails silently)
 */
export const trackClick = async (buttonId, metadata = {}, userId = null) => {
  try {
    await fetch(API_BASE + '/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        buttonId,
        userId: userId || 'anonymous',
        metadata
      })
    });
  } catch (err) {
    // Silently fail - don't interrupt user experience
    console.debug('Failed to track click:', err);
  }
};

