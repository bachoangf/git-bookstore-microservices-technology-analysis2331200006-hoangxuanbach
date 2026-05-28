/**
 * Database Connection Module
 * 
 * This module manages the PostgreSQL database connection pool for the Order Service.
 * It:
 * - Creates a connection pool using environment variables
 * - Provides a query function for executing SQL statements
 * - Automatically initializes the orders table schema on startup
 */

import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST || 'order-db',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'orders'
});

/**
 * Executes a SQL query using the connection pool
 * 
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters (for parameterized queries)
 * @returns {Promise<Object>} Query result object with rows property
 */
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
 * Creates the orders table if it doesn't exist
 * This runs automatically when the module is loaded
 */
async function init() {
  await query(`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
}

init().catch(err => {
  console.error('Order DB init error:', err);
});

export default { query };

