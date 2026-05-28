/**
 * Express Application Setup
 * 
 * This module configures the Express application with middleware and routes.
 * It sets up:
 * - JSON body parsing
 * - Authentication guard (protects all routes)
 * - Order routes
 * - Error handling middleware
 */

import express from 'express';
import { authGuard } from './middleware/auth.js';
import orderRoutes from './routes/orderRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { PORT } from './config/env.js';


/**
 * Creates and configures the Express application
 * 
 * @returns {express.Application} Configured Express app instance
 */
export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(authGuard);
  app.use('/', orderRoutes);
  app.use(errorHandler);

  return app;
}

export default createApp;

