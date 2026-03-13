/**
 * Database Connection Management
 * Handles SQLite database connections using better-sqlite3
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database instance (singleton pattern)
let dbInstance = null;

// Database configuration
const DB_CONFIG = {
  // Development: SQLite file in project directory
  // Production: Can be configured via environment variables for PostgreSQL
  sqlitePath: process.env.DB_PATH || join(__dirname, '../../data/openclaw.db'),
  options: {
    verbose: process.env.DB_VERBOSE === 'true' ? console.log : null
  }
};

/**
 * Ensure database directory exists
 */
function ensureDbDirectory() {
  const dbDir = dirname(DB_CONFIG.sqlitePath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
}

/**
 * Get database connection (singleton)
 * @param {boolean} forceNew - Force new connection (for testing)
 * @returns {Database} Database instance
 */
export function getDatabase(forceNew = false) {
  if (forceNew || !dbInstance) {
    // Close existing connection if forcing new
    if (dbInstance && forceNew) {
      try {
        dbInstance.close();
      } catch (e) {
        // Ignore close errors
      }
      dbInstance = null;
    }
    
    ensureDbDirectory();
    dbInstance = new Database(DB_CONFIG.sqlitePath, DB_CONFIG.options);
    
    // Enable foreign keys
    dbInstance.pragma('foreign_keys = ON');
    
    // Set journal mode for better performance (use MEMORY for tests)
    if (process.env.NODE_ENV === 'test') {
      dbInstance.pragma('journal_mode = MEMORY');
    } else {
      dbInstance.pragma('journal_mode = WAL');
    }
    
    console.log('[Database] Connected to SQLite database');
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[Database] Connection closed');
  }
}

/**
 * Reset database connection (for testing)
 */
export function resetDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      // Ignore close errors
    }
    dbInstance = null;
  }
  // Update config to use current env var
  DB_CONFIG.sqlitePath = process.env.DB_PATH || join(__dirname, '../../data/openclaw.db');
}

/**
 * Initialize database with schema
 * @param {boolean} force - If true, drop existing tables
 */
export function initializeDatabase(force = false) {
  const db = getDatabase();
  
  if (force) {
    // Drop all tables in reverse order (respecting foreign keys)
    const tables = ['sessions', 'audit_logs', 'configs', 'users'];
    tables.forEach(table => {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    });
    console.log('[Database] Existing tables dropped');
  }
  
  // Import schema and create tables
  import('./schema.js').then(({ getCreateTableStatements }) => {
    const statements = getCreateTableStatements();
    statements.forEach(sql => {
      db.exec(sql);
    });
    console.log('[Database] Schema initialized');
  });
  
  return db;
}

/**
 * Run database migrations
 * @param {Database} db - Database instance
 */
export async function runMigrations(db) {
  const { migrate } = await import('./migrations.js');
  return migrate(db);
}

/**
 * Execute a transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {any} Result of callback
 */
export function transaction(callback) {
  const db = getDatabase();
  return db.transaction(callback)();
}

/**
 * Prepare a statement (cached)
 * @param {string} sql - SQL statement
 * @returns {Statement} Prepared statement
 */
export function prepare(sql) {
  const db = getDatabase();
  return db.prepare(sql);
}

export default {
  getDatabase,
  closeDatabase,
  initializeDatabase,
  runMigrations,
  transaction,
  prepare
};
