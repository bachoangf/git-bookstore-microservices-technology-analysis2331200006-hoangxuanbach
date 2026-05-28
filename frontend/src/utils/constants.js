/**
 * Application Constants
 * 
 * This module contains shared constants used throughout the frontend application.
 */

/**
 * Base URL for API requests
 * Can be set via window.API_BASE (useful for different environments)
 * Defaults to empty string (relative URLs) for same-origin requests
 */
export const API_BASE = window.API_BASE || '';

/**
 * Currency formatter for displaying prices
 * Formats numbers as US Dollar currency (e.g., $19.99)
 */
export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

