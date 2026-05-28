/**
 * Frontend Static File Server
 * 
 * This is a simple Express server that serves the built React frontend application.
 * It:
 * - Serves static files (JS, CSS, images) from the 'dist' directory
 * - Handles client-side routing by serving index.html for all non-API routes
 * - Provides a health check endpoint at /healthz
 * 
 * This server runs inside a Docker container and is proxied through the API Gateway.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ES modules don't have __dirname by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Directory containing built frontend files (created by Vite build process)
const distDir = path.join(__dirname, 'dist');

// Serve static files (JS bundles, CSS, images, etc.)
app.use(express.static(distDir));

// Health check endpoint for container orchestration
app.get('/healthz', (_req, res) => res.send('ok'));

// Catch-all route: serve index.html for all routes
// This enables client-side routing (React Router) - all routes are handled by the React app
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

const PORT = 3000;
app.listen(PORT, () => console.log(`Frontend running on ${PORT}`));
