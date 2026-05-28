/**
 * API Gateway Service
 * 
 * This service acts as the single entry point for all client requests.
 * It handles authentication and request routing to backend services.
 */

import './otel.js';
import express from 'express';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import openApiDocument from './openapi.json' assert { type: 'json' };

dotenv.config();

const app = express();

// HTTP request logging middleware
// Uses 'dev' format for detailed logs in debug mode, 'tiny' for production
app.use(morgan(process.env.LOG_LEVEL === 'debug' ? 'dev' : 'tiny'));

// Gateway health endpoint (handled before auth middleware)
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

// Serve the OpenAPI specification as JSON
app.get('/openapi.json', (_req, res) => res.json(openApiDocument));

// Interactive Swagger UI powered by the OpenAPI document
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, { explorer: true })
);

// JWT secret for token verification (should be consistent across all services)
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

/**
 * Public routes that don't require authentication
 * These endpoints are accessible without a JWT token
 */
const publicRoutes = [
  { method: 'POST', path: '/api/users/login' },
  { method: 'POST', path: '/api/users/register' },
  { method: 'GET', path: '/healthz' },
  { method: 'POST', path: '/api/analytics/track' }
];

/**
 * Determines if a route is public (doesn't require authentication)
 * @param {Object} req - Express request object
 * @returns {boolean} - True if route is public
 */
const isPublicRoute = (req) => {
  // OPTIONS requests (CORS preflight) are always allowed
  if (req.method === 'OPTIONS') return true;
  
  // Non-API paths (like frontend routes) are public
  if (!req.path.startsWith('/api/')) return true;
  
  // Documentation endpoints are publicly accessible
  if (req.path === '/openapi.json') return true;
  if (req.path === '/docs' || req.path.startsWith('/docs/')) return true;

  // Check if route matches any public route definition
  return publicRoutes.some(({ method, path }) => method === req.method && req.path === path);
};

/**
 * Authentication middleware
 * Validates JWT tokens and adds user context to request headers
 */
app.use((req, res, next) => {
  // Skip authentication for public routes
  if (isPublicRoute(req)) return next();

  // Extract token from Authorization header (Bearer <token>)
  const header = req.headers.authorization || '';
  let token = header.startsWith('Bearer ') ? header.slice(7) : null;

  // Fallback: try to extract token from query parameter
  // This is useful for SSE connections that can't set headers
  if (!token && req.query?.token) {
    try {
      const url = new URL(req.originalUrl, `http://${req.headers.host || 'localhost'}`);
      token = req.query.token;
      // Remove token from URL to avoid exposing it in logs
      url.searchParams.delete('token');
      req.url = url.pathname + url.search;
      delete req.query.token;
    } catch (err) {
      console.warn('Failed to parse token from query:', err.message);
    }
  }

  // Reject request if no token provided
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  try {
    // Verify and decode JWT token
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Add user context to request headers for downstream services
    // This allows services to identify the authenticated user
    req.headers['x-user-id'] = payload.id;
    req.headers['x-user-username'] = payload.username;
    return next();
  } catch (err) {
    // Token is invalid or expired
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/**
 * API route proxying configuration
 * Routes incoming API requests to appropriate backend services
 */
const apiRoutes = {
  '/api/users': { 
    target: 'http://user-service:8001',
    pathRewrite: { '^/api/users': '' } // Remove /api/users prefix when proxying
  },
  '/api/products': { 
    target: 'http://product-service:8002',
    pathRewrite: { '^/api/products': '' } // Remove /api/products prefix when proxying
  },
  '/api/orders': { 
    target: 'http://order-service:8003',
    pathRewrite: { '^/api/orders': '' } // Remove /api/orders prefix when proxying
  },
  '/api/notifications': { 
    target: 'http://notification-service:8005',
    pathRewrite: { '^/api/notifications': '' } // Remove /api/notifications prefix when proxying
  },
  '/api/dashboard': { 
    target: 'http://analytics-dashboard-service:8006',
    pathRewrite: { '^/api/dashboard': '' } // Remove /api/dashboard prefix when proxying
  },
  '/api/analytics': { 
    target: 'http://analytics-service:8007',
    pathRewrite: { '^/api/analytics': '' } // Remove /api/analytics prefix when proxying
  }
};

// Set up proxy middleware for each API route
for (const [route, config] of Object.entries(apiRoutes)) {
  console.log('Proxy route:', route, 'to:', config.target);
  app.use(route, createProxyMiddleware({ ...config, changeOrigin: true }));
}

/**
 * Frontend proxy
 * Serves the React frontend application through the gateway
 * This allows the frontend to be accessed via the same port as the API
 */
app.use('/', createProxyMiddleware({ target: 'http://frontend:3000', changeOrigin: true }));

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`API Gateway running on ${PORT}`);
  console.log('OpenAPI documentation available at http://localhost:%d/docs', PORT);
});

/**
 * Graceful shutdown handler
 * Allows the service to clean up resources before termination
 */
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  process.exit(0);
});
