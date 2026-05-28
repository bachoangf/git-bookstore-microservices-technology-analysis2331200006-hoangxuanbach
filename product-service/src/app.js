/**
 * Express Application Setup
 * 
 * This module configures the Express application for the Product Service.
 * It sets up:
 * - JSON body parsing
 * - Authentication guard (GET requests are public, others require auth)
 * - Product routes
 */

import express from 'express';
import productRoutes from './routes/productRoutes.js';
import { authGuard } from './middleware/auth.js';
import { PORT } from './config/env.js';

const app = express();

app.use(express.json());
app.use(authGuard);
app.use('/', productRoutes);

export default app;

