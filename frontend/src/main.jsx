/**
 * Frontend Application Entry Point
 * 
 * This is the main entry point for the React frontend application.
 * It:
 * - Renders the root App component
 * - Wraps the app in React.StrictMode for development warnings
 * - Imports global CSS styles
 * 
 * The application is a bookstore management system with:
 * - User authentication
 * - Product management
 * - Order creation and tracking
 * - Real-time notifications
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Render the React application to the DOM
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

