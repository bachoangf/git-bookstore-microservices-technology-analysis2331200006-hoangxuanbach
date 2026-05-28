/**
 * HTTP Error Utilities
 * 
 * This module provides a custom error class for handling HTTP errors
 * with status codes, making error handling more structured and consistent.
 */

/**
 * Custom error class for HTTP errors
 * Extends the native Error class to include HTTP status codes
 * 
 * @class HttpError
 * @extends Error
 */
export class HttpError extends Error {
  constructor(status, message, options = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = options.details;
  }
}

/**
 * Type guard to check if an error is an HttpError instance
 * 
 * @param {any} err - Error object to check
 * @returns {boolean} True if error is an HttpError instance
 */
export function isHttpError(err) {
  return err instanceof HttpError;
}

