/**
 * Database Connection Module
 * 
 * This module manages the PostgreSQL database connection pool for the Product Service.
 * It:
 * - Creates a connection pool using environment variables
 * - Provides a query function for executing SQL statements
 * - Automatically initializes the books table schema on startup
 */

import pkg from 'pg';
import { DB_CONFIG } from '../config/env.js';

const { Pool } = pkg;

const pool = new Pool(DB_CONFIG);

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

/**
 * Initializes the database schema
 * Creates the books table if it doesn't exist
 * This runs automatically when the module is loaded
 */
async function init() {
  await query(`CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 100
  );`);
}

init().catch(err => console.error('Product DB init error:', err));

export default { query };

