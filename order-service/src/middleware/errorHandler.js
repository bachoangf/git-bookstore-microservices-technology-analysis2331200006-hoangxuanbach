/**
 * Error Handling Middleware
 * 
 * This middleware handles errors that occur during request processing.
 * It distinguishes between HttpError instances (expected errors) and
 * unexpected errors, providing appropriate responses for each.
 */

import { isHttpError } from '../utils/httpError.js';

/**
 * Express error handling middleware
 * Handles errors from route handlers and other middleware
 * 
 * @param {Error} err - Error object (may be HttpError or generic Error)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} _next - Express next function (unused in error handlers)
 * @returns {void} Sends appropriate error response
 */
export function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return res.end();
  }

  if (isHttpError(err)) {
    if (err.details) {
      console.warn(`Handled error ${err.status}: ${err.message}`, err.details);
    }
    return res.status(err.status).json({ error: err.message });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}

