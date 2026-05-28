/**
 * User Service Database Connection
 * 
 * This module:
 * - Connects to MongoDB database for user storage
 * - Defines the User schema (username, password, timestamps)
 * - Exports the User model for use in other modules
 * 
 * Uses Mongoose ODM for MongoDB operations.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// MongoDB connection URL (defaults to Docker service name for containerized deployment)
const mongoUrl = process.env.MONGO_URL || 'mongodb://user-db:27017/bookstore';

// Connect to MongoDB
mongoose.connect(mongoUrl, { dbName: process.env.MONGO_DB || 'bookstore' })
  .then(() => console.log('Connected to MongoDB for user-service'))
  .catch(err => console.error('Mongo connection error:', err.message));

/**
 * User schema definition
 * - username: Unique, required string
 * - password: Required string (will be hashed before storage)
 * - timestamps: Automatically adds createdAt and updatedAt fields
 */
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
}, { timestamps: true });

// Export User model (reuse existing model if already compiled, otherwise create new one)
// This prevents model recompilation errors in development with hot reloading
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
