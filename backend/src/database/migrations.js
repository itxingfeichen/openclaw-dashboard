/**
 * Database Migrations
 * Manages schema versioning and incremental updates
 */

import { getTableNames, getTableSchema } from './schema.js';

// Migration registry
const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    description: 'Create initial database schema',
    up: (db) => {
      const tables = ['users', 'configs', 'audit_logs', 'sessions'];
      tables.forEach(table => {
        const sql = getTableSchema(table);
        if (sql) {
          db.exec(sql);
        }
      });
    },
    down: (db) => {
      const tables = ['sessions', 'audit_logs', 'configs', 'users'];
      tables.forEach(table => {
        db.exec(`DROP TABLE IF EXISTS ${table}`);
      });
    }
  },
  {
    version: 2,
    name: 'add_indexes',
    description: 'Add performance indexes',
    up: (db) => {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_configs_key ON configs(key)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`);
    },
    down: (db) => {
      db.exec(`DROP INDEX IF EXISTS idx_users_username`);
      db.exec(`DROP INDEX IF EXISTS idx_users_email`);
      db.exec(`DROP INDEX IF EXISTS idx_configs_key`);
      db.exec(`DROP INDEX IF EXISTS idx_audit_logs_user_id`);
      db.exec(`DROP INDEX IF EXISTS idx_audit_logs_action`);
      db.exec(`DROP INDEX IF EXISTS idx_audit_logs_created_at`);
      db.exec(`DROP INDEX IF EXISTS idx_sessions_user_id`);
      db.exec(`DROP INDEX IF EXISTS idx_sessions_token`);
      db.exec(`DROP INDEX IF EXISTS idx_sessions_expires_at`);
    }
  }
];

/**
 * Create migrations table if not exists
 * @param {Database} db - Database instance
 */
function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Get list of executed migrations
 * @param {Database} db - Database instance
 * @returns {number[]} Array of executed version numbers
 */
function getExecutedMigrations(db) {
  const stmt = db.prepare('SELECT version FROM _migrations ORDER BY version');
  const rows = stmt.all();
  return rows.map(row => row.version);
}

/**
 * Mark a migration as executed
 * @param {Database} db - Database instance
 * @param {number} version - Migration version
 * @param {string} name - Migration name
 */
function markMigrationExecuted(db, version, name) {
  const stmt = db.prepare(
    'INSERT INTO _migrations (version, name) VALUES (?, ?)'
  );
  stmt.run(version, name);
}

/**
 * Run all pending migrations
 * @param {Database} db - Database instance
 * @returns {Object} Migration result
 */
export function migrate(db) {
  ensureMigrationsTable(db);
  
  const executed = getExecutedMigrations(db);
  const pending = migrations.filter(m => !executed.includes(m.version));
  
  if (pending.length === 0) {
    console.log('[Migrations] Database is up to date');
    return { executed: 0, pending: 0 };
  }
  
  console.log(`[Migrations] Running ${pending.length} pending migration(s)`);
  
  let count = 0;
  for (const migration of pending) {
    try {
      console.log(`[Migrations] Running: ${migration.name} (v${migration.version})`);
      migration.up(db);
      markMigrationExecuted(db, migration.version, migration.name);
      count++;
      console.log(`[Migrations] Completed: ${migration.name}`);
    } catch (error) {
      console.error(`[Migrations] Failed: ${migration.name}`, error);
      throw error;
    }
  }
  
  console.log(`[Migrations] Successfully executed ${count} migration(s)`);
  return { executed: count, pending: pending.length };
}

/**
 * Rollback last migration
 * @param {Database} db - Database instance
 * @returns {Object} Rollback result
 */
export function rollback(db) {
  ensureMigrationsTable(db);
  
  const stmt = db.prepare(
    'SELECT version, name FROM _migrations ORDER BY version DESC LIMIT 1'
  );
  const last = stmt.get();
  
  if (!last) {
    console.log('[Migrations] No migrations to rollback');
    return { rolledBack: 0 };
  }
  
  const migration = migrations.find(m => m.version === last.version);
  if (!migration) {
    throw new Error(`Migration v${last.version} not found in registry`);
  }
  
  console.log(`[Migrations] Rolling back: ${migration.name} (v${migration.version})`);
  migration.down(db);
  
  const deleteStmt = db.prepare('DELETE FROM _migrations WHERE version = ?');
  deleteStmt.run(last.version);
  
  console.log(`[Migrations] Rolled back: ${migration.name}`);
  return { rolledBack: 1 };
}

/**
 * Get migration status
 * @param {Database} db - Database instance
 * @returns {Object} Migration status
 */
export function status(db) {
  ensureMigrationsTable(db);
  
  const executed = getExecutedMigrations(db);
  const pending = migrations.filter(m => !executed.includes(m.version));
  
  return {
    total: migrations.length,
    executed: executed.length,
    pending: pending.length,
    currentVersion: executed.length > 0 ? Math.max(...executed) : 0,
    latestVersion: migrations.length > 0 ? Math.max(...migrations.map(m => m.version)) : 0,
    pendingMigrations: pending.map(m => ({ version: m.version, name: m.name }))
  };
}

export default {
  migrate,
  rollback,
  status,
  migrations
};
