/**
 * Database Connection Management
 * Handles SQLite database connections using better-sqlite3
 * With optional PostgreSQL support for production deployments
 * 
 * Features:
 * - Singleton connection pattern
 * - Connection pooling for PostgreSQL
 * - WAL mode for better SQLite performance
 * - Automatic migration support
 * - Transaction support
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database instance (singleton pattern)
let dbInstance = null;
let connectionPool = null;

// Database configuration
const DB_CONFIG = {
  // Database type: 'sqlite' or 'postgresql'
  type: process.env.DB_TYPE || 'sqlite',
  
  // SQLite configuration
  sqlite: {
    path: process.env.DB_PATH || join(__dirname, '../../data/openclaw.db'),
    options: {
      verbose: process.env.DB_VERBOSE === 'true' ? console.log : null
    }
  },
  
  // PostgreSQL configuration (for production)
  postgresql: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: process.env.PG_DATABASE || 'openclaw_dashboard',
    user: process.env.PG_USER || 'openclaw',
    password: process.env.PG_PASSWORD || '',
    max: parseInt(process.env.PG_POOL_MAX || '10'),
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '2000')
  }
};

/**
 * Ensure database directory exists (for SQLite)
 */
function ensureDbDirectory() {
  const dbDir = dirname(DB_CONFIG.sqlite.path);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
}

/**
 * Initialize SQLite database
 * @returns {Database} SQLite database instance
 */
function initSQLite() {
  ensureDbDirectory();
  
  const db = new Database(DB_CONFIG.sqlite.path, DB_CONFIG.sqlite.options);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Set journal mode for better performance
  if (process.env.NODE_ENV === 'test') {
    db.pragma('journal_mode = MEMORY');
    db.pragma('synchronous = OFF');
  } else {
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 10000');
    db.pragma('temp_store = MEMORY');
    db.pragma('mmap_size = 268435456'); // 256MB
  }
  
  console.log(`[Database] Connected to SQLite database: ${DB_CONFIG.sqlite.path}`);
  return db;
}

/**
 * Initialize PostgreSQL connection pool
 * @returns {Object} Connection pool
 */
async function initPostgreSQL() {
  try {
    const { Pool } = await import('pg');
    
    connectionPool = new Pool({
      host: DB_CONFIG.postgresql.host,
      port: DB_CONFIG.postgresql.port,
      database: DB_CONFIG.postgresql.database,
      user: DB_CONFIG.postgresql.user,
      password: DB_CONFIG.postgresql.password,
      max: DB_CONFIG.postgresql.max,
      idleTimeoutMillis: DB_CONFIG.postgresql.idleTimeoutMillis,
      connectionTimeoutMillis: DB_CONFIG.postgresql.connectionTimeoutMillis
    });
    
    // Test connection
    const client = await connectionPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log(`[Database] Connected to PostgreSQL database: ${DB_CONFIG.postgresql.database}@${DB_CONFIG.postgresql.host}`);
    return connectionPool;
  } catch (error) {
    console.error('[Database] Failed to connect to PostgreSQL:', error.message);
    throw error;
  }
}

/**
 * Get database connection (singleton)
 * @param {boolean} forceNew - Force new connection (for testing)
 * @returns {Promise<Database|Pool>} Database instance or connection pool
 */
export async function getDatabase(forceNew = false) {
  if (forceNew) {
    // Close existing connections
    await closeDatabase();
  }
  
  if (DB_CONFIG.type === 'postgresql') {
    if (!connectionPool || forceNew) {
      await initPostgreSQL();
    }
    return connectionPool;
  } else {
    // SQLite
    if (!dbInstance || forceNew) {
      dbInstance = initSQLite();
    }
    return dbInstance;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      // Ignore close errors
    }
    dbInstance = null;
    console.log('[Database] SQLite connection closed');
  }
  
  if (connectionPool) {
    try {
      await connectionPool.end();
    } catch (e) {
      // Ignore close errors
    }
    connectionPool = null;
    console.log('[Database] PostgreSQL connection pool closed');
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
  connectionPool = null;
  
  // Update config to use current env var
  DB_CONFIG.sqlite.path = process.env.DB_PATH || join(__dirname, '../../data/openclaw.db');
}

/**
 * Initialize database with schema
 * @param {boolean} force - If true, drop existing tables
 * @returns {Promise<Database>} Database instance
 */
export async function initializeDatabase(force = false) {
  const db = await getDatabase();
  
  if (force && DB_CONFIG.type === 'sqlite') {
    // Drop all tables in reverse order (respecting foreign keys)
    const tables = [
      'agent_skills', 'task_logs', 'agent_tools',
      'system_logs', 'audit_logs', 'sessions',
      'skills', 'tasks', 'agents', 'configs', 'users', '_migrations'
    ];
    tables.forEach(table => {
      try {
        db.exec(`DROP TABLE IF EXISTS ${table}`);
      } catch (e) {
        // Ignore if table doesn't exist
      }
    });
    console.log('[Database] Existing tables dropped');
  }
  
  // Run migrations
  await runMigrations(db);
  
  return db;
}

/**
 * Run database migrations
 * @param {Database} db - Database instance
 * @returns {Promise<Object>} Migration result
 */
export async function runMigrations(db) {
  const { migrate } = await import('./migrations.js');
  return migrate(db);
}

/**
 * Execute a transaction (SQLite only)
 * @param {Function} callback - Function to execute within transaction
 * @returns {any} Result of callback
 */
export function transaction(callback) {
  if (DB_CONFIG.type !== 'sqlite') {
    throw new Error('Transactions are only supported for SQLite in this implementation');
  }
  
  const db = dbInstance || getDatabase();
  return db.transaction(callback)();
}

/**
 * Prepare a statement (SQLite only)
 * @param {string} sql - SQL statement
 * @returns {Statement} Prepared statement
 */
export function prepare(sql) {
  if (DB_CONFIG.type !== 'sqlite') {
    throw new Error('prepare() is only supported for SQLite. Use pool.query() for PostgreSQL.');
  }
  
  const db = dbInstance || getDatabase();
  return db.prepare(sql);
}

/**
 * Execute a query (PostgreSQL)
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export async function query(sql, params = []) {
  if (DB_CONFIG.type !== 'postgresql') {
    throw new Error('query() is only supported for PostgreSQL. Use prepare() for SQLite.');
  }
  
  const pool = await getDatabase();
  return pool.query(sql, params);
}

/**
 * Get a client from pool (PostgreSQL)
 * @returns {Promise<Object>} Database client
 */
export async function getClient() {
  if (DB_CONFIG.type !== 'postgresql') {
    throw new Error('getClient() is only supported for PostgreSQL.');
  }
  
  const pool = await getDatabase();
  return pool.connect();
}

/**
 * Database health check
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
  try {
    const db = await getDatabase();
    const startTime = Date.now();
    
    if (DB_CONFIG.type === 'sqlite') {
      db.prepare('SELECT 1').get();
    } else {
      await db.query('SELECT 1');
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      type: DB_CONFIG.type,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      type: DB_CONFIG.type,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get database statistics (SQLite only)
 * @returns {Object} Database statistics
 */
export function getStats() {
  if (DB_CONFIG.type !== 'sqlite') {
    return { type: 'postgresql', note: 'Stats not implemented for PostgreSQL' };
  }
  
  const db = dbInstance || getDatabase();
  
  try {
    // Get table sizes
    const tableStats = db.prepare(`
      SELECT 
        name as table_name,
        pgsize as page_count,
        pgsize * (SELECT page_count FROM dbstat WHERE name = 'sqlite_stat1' LIMIT 1) as estimated_size
      FROM sqlite_master 
      WHERE type = 'table' 
      AND name NOT LIKE 'sqlite_%'
    `).all();
    
    return {
      type: 'sqlite',
      path: DB_CONFIG.sqlite.path,
      tables: tableStats,
      pragmas: {
        journalMode: db.pragma('journal_mode', { simple: true }),
        synchronous: db.pragma('synchronous', { simple: true }),
        cacheSize: db.pragma('cache_size', { simple: true }),
        foreignKeys: db.pragma('foreign_keys', { simple: true })
      }
    };
  } catch (error) {
    return {
      type: 'sqlite',
      error: error.message
    };
  }
}

export default {
  getDatabase,
  closeDatabase,
  initializeDatabase,
  runMigrations,
  transaction,
  prepare,
  query,
  getClient,
  healthCheck,
  getStats
};
