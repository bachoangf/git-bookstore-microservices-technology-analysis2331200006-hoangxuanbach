/**
 * Authentication Middleware
 * 
 * This module provides middleware functions for JWT token authentication.
 * It validates Bearer tokens from the Authorization header and attaches
 * user information to the request object.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

/**
 * Middleware that requires authentication for a route
 * Validates JWT token from Authorization header
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Calls next() if authenticated, sends 401 error otherwise
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Authentication guard middleware
 * Allows GET and OPTIONS requests (read operations and CORS preflight) to pass through without authentication
 * All other requests (POST, PUT, DELETE) require authentication via requireAuth
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Calls next() or requireAuth() based on request method
 */
export function authGuard(req, res, next) {
  if (req.method === 'GET' || req.method === 'OPTIONS') {
    return next();
  }
  return requireAuth(req, res, next);
}

