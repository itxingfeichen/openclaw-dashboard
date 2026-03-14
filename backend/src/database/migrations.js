/**
 * Database Migrations
 * Manages schema versioning and incremental updates
 * 
 * Migration Strategy:
 * - Each migration has up() and down() methods
 * - Migrations are versioned and tracked in _migrations table
 * - Failed migrations are rolled back automatically
 */

import { getTableSchema, getIndexSQL } from './schema.js';

// Migration registry - ordered by version
const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    description: 'Create initial database schema with core tables',
    up: (db) => {
      // Core tables in dependency order
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
    name: 'add_core_indexes',
    description: 'Add performance indexes for core tables',
    up: (db) => {
      // User indexes
      db.exec(getIndexSQL('idx_users_username'));
      db.exec(getIndexSQL('idx_users_email'));
      db.exec(getIndexSQL('idx_users_status'));
      db.exec(getIndexSQL('idx_users_role'));
      
      // Config indexes
      db.exec(getIndexSQL('idx_configs_key'));
      db.exec(getIndexSQL('idx_configs_category'));
      
      // Audit log indexes
      db.exec(getIndexSQL('idx_audit_logs_user'));
      db.exec(getIndexSQL('idx_audit_logs_action'));
      db.exec(getIndexSQL('idx_audit_logs_resource'));
      db.exec(getIndexSQL('idx_audit_logs_created'));
      
      // Session indexes
      db.exec(getIndexSQL('idx_sessions_user'));
      db.exec(getIndexSQL('idx_sessions_token'));
      db.exec(getIndexSQL('idx_sessions_expires'));
      db.exec(getIndexSQL('idx_sessions_active'));
    },
    down: (db) => {
      db.exec('DROP INDEX IF EXISTS idx_users_username');
      db.exec('DROP INDEX IF EXISTS idx_users_email');
      db.exec('DROP INDEX IF EXISTS idx_users_status');
      db.exec('DROP INDEX IF EXISTS idx_users_role');
      db.exec('DROP INDEX IF EXISTS idx_configs_key');
      db.exec('DROP INDEX IF EXISTS idx_configs_category');
      db.exec('DROP INDEX IF EXISTS idx_audit_logs_user');
      db.exec('DROP INDEX IF EXISTS idx_audit_logs_action');
      db.exec('DROP INDEX IF EXISTS idx_audit_logs_resource');
      db.exec('DROP INDEX IF EXISTS idx_audit_logs_created');
      db.exec('DROP INDEX IF EXISTS idx_sessions_user');
      db.exec('DROP INDEX IF EXISTS idx_sessions_token');
      db.exec('DROP INDEX IF EXISTS idx_sessions_expires');
      db.exec('DROP INDEX IF EXISTS idx_sessions_active');
    }
  },
  {
    version: 3,
    name: 'add_agent_tables',
    description: 'Add agent management tables',
    up: (db) => {
      db.exec(getTableSchema('agents'));
      db.exec(getTableSchema('agent_tools'));
    },
    down: (db) => {
      db.exec('DROP TABLE IF EXISTS agent_tools');
      db.exec('DROP TABLE IF EXISTS agents');
    }
  },
  {
    version: 4,
    name: 'add_agent_indexes',
    description: 'Add indexes for agent tables',
    up: (db) => {
      db.exec(getIndexSQL('idx_agents_name'));
      db.exec(getIndexSQL('idx_agents_status'));
      db.exec(getIndexSQL('idx_agents_type'));
      db.exec(getIndexSQL('idx_agents_parent'));
      db.exec(getIndexSQL('idx_agent_tools_agent'));
    },
    down: (db) => {
      db.exec('DROP INDEX IF EXISTS idx_agents_name');
      db.exec('DROP INDEX IF EXISTS idx_agents_status');
      db.exec('DROP INDEX IF EXISTS idx_agents_type');
      db.exec('DROP INDEX IF EXISTS idx_agents_parent');
      db.exec('DROP INDEX IF EXISTS idx_agent_tools_agent');
    }
  },
  {
    version: 5,
    name: 'add_task_tables',
    description: 'Add task management and logging tables',
    up: (db) => {
      db.exec(getTableSchema('tasks'));
      db.exec(getTableSchema('task_logs'));
    },
    down: (db) => {
      db.exec('DROP TABLE IF EXISTS task_logs');
      db.exec('DROP TABLE IF EXISTS tasks');
    }
  },
  {
    version: 6,
    name: 'add_task_indexes',
    description: 'Add indexes for task tables',
    up: (db) => {
      db.exec(getIndexSQL('idx_tasks_task_id'));
      db.exec(getIndexSQL('idx_tasks_status'));
      db.exec(getIndexSQL('idx_tasks_priority'));
      db.exec(getIndexSQL('idx_tasks_agent'));
      db.exec(getIndexSQL('idx_tasks_assigned'));
      db.exec(getIndexSQL('idx_tasks_created'));
      db.exec(getIndexSQL('idx_tasks_due'));
      db.exec(getIndexSQL('idx_task_logs_task'));
      db.exec(getIndexSQL('idx_task_logs_level'));
      db.exec(getIndexSQL('idx_task_logs_created'));
    },
    down: (db) => {
      db.exec('DROP INDEX IF EXISTS idx_tasks_task_id');
      db.exec('DROP INDEX IF EXISTS idx_tasks_status');
      db.exec('DROP INDEX IF EXISTS idx_tasks_priority');
      db.exec('DROP INDEX IF EXISTS idx_tasks_agent');
      db.exec('DROP INDEX IF EXISTS idx_tasks_assigned');
      db.exec('DROP INDEX IF EXISTS idx_tasks_created');
      db.exec('DROP INDEX IF EXISTS idx_tasks_due');
      db.exec('DROP INDEX IF EXISTS idx_task_logs_task');
      db.exec('DROP INDEX IF EXISTS idx_task_logs_level');
      db.exec('DROP INDEX IF EXISTS idx_task_logs_created');
    }
  },
  {
    version: 7,
    name: 'add_skill_tables',
    description: 'Add skill registry and agent-skill mapping tables',
    up: (db) => {
      db.exec(getTableSchema('skills'));
      db.exec(getTableSchema('agent_skills'));
    },
    down: (db) => {
      db.exec('DROP TABLE IF EXISTS agent_skills');
      db.exec('DROP TABLE IF EXISTS skills');
    }
  },
  {
    version: 8,
    name: 'add_skill_indexes',
    description: 'Add indexes for skill tables',
    up: (db) => {
      db.exec(getIndexSQL('idx_skills_name'));
      db.exec(getIndexSQL('idx_skills_status'));
      db.exec(getIndexSQL('idx_skills_source'));
      db.exec(getIndexSQL('idx_agent_skills_agent'));
      db.exec(getIndexSQL('idx_agent_skills_skill'));
    },
    down: (db) => {
      db.exec('DROP INDEX IF EXISTS idx_skills_name');
      db.exec('DROP INDEX IF EXISTS idx_skills_status');
      db.exec('DROP INDEX IF EXISTS idx_skills_source');
      db.exec('DROP INDEX IF EXISTS idx_agent_skills_agent');
      db.exec('DROP INDEX IF EXISTS idx_agent_skills_skill');
    }
  },
  {
    version: 9,
    name: 'add_system_logs',
    description: 'Add system logging table for application logs',
    up: (db) => {
      db.exec(getTableSchema('system_logs'));
      db.exec(getIndexSQL('idx_system_logs_level'));
      db.exec(getIndexSQL('idx_system_logs_source'));
      db.exec(getIndexSQL('idx_system_logs_created'));
    },
    down: (db) => {
      db.exec('DROP INDEX IF EXISTS idx_system_logs_level');
      db.exec('DROP INDEX IF EXISTS idx_system_logs_source');
      db.exec('DROP INDEX IF EXISTS idx_system_logs_created');
      db.exec('DROP TABLE IF EXISTS system_logs');
    }
  },
  {
    version: 10,
    name: 'seed_default_config',
    description: 'Seed default configuration values',
    up: (db) => {
      const defaultConfigs = [
        { key: 'app.name', value: 'OpenClaw Dashboard', type: 'string', category: 'general', description: 'Application display name' },
        { key: 'app.version', value: '1.0.0', type: 'string', category: 'general', description: 'Application version' },
        { key: 'app.timezone', value: 'UTC', type: 'string', category: 'general', description: 'Default timezone' },
        { key: 'auth.session_timeout', value: '86400', type: 'number', category: 'auth', description: 'Session timeout in seconds' },
        { key: 'auth.max_login_attempts', value: '5', type: 'number', category: 'auth', description: 'Maximum login attempts before lockout' },
        { key: 'auth.lockout_duration', value: '900', type: 'number', category: 'auth', description: 'Account lockout duration in seconds' },
        { key: 'api.rate_limit', value: '100', type: 'number', category: 'api', description: 'API rate limit per minute' },
        { key: 'api.max_page_size', value: '100', type: 'number', category: 'api', description: 'Maximum page size for pagination' },
        { key: 'log.retention_days', value: '30', type: 'number', category: 'log', description: 'Log retention period in days' },
        { key: 'log.level', value: 'info', type: 'string', category: 'log', description: 'Default log level' }
      ];
      
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO configs (key, value, type, category, description, is_system)
        VALUES (?, ?, ?, ?, ?, 1)
      `);
      
      defaultConfigs.forEach(config => {
        stmt.run(config.key, config.value, config.type, config.category, config.description);
      });
    },
    down: (db) => {
      const keys = [
        'app.name', 'app.version', 'app.timezone',
        'auth.session_timeout', 'auth.max_login_attempts', 'auth.lockout_duration',
        'api.rate_limit', 'api.max_page_size',
        'log.retention_days', 'log.level'
      ];
      
      const stmt = db.prepare('DELETE FROM configs WHERE key = ? AND is_system = 1');
      keys.forEach(key => {
        stmt.run(key);
      });
    }
  },
  {
    version: 11,
    name: 'add_alert_tables',
    description: 'Add alert management tables for alert rules and history',
    up: (db) => {
      db.exec(getTableSchema('alert_rules'));
      db.exec(getTableSchema('alert_history'));
    },
    down: (db) => {
      db.exec('DROP TABLE IF EXISTS alert_history');
      db.exec('DROP TABLE IF EXISTS alert_rules');
    }
  },
  {
    version: 12,
    name: 'add_alert_indexes',
    description: 'Add indexes for alert tables',
    up: (db) => {
      db.exec(getIndexSQL('idx_alert_rules_name'));
      db.exec(getIndexSQL('idx_alert_rules_severity'));
      db.exec(getIndexSQL('idx_alert_rules_enabled'));
      db.exec(getIndexSQL('idx_alert_history_rule'));
      db.exec(getIndexSQL('idx_alert_history_status'));
      db.exec(getIndexSQL('idx_alert_history_severity'));
      db.exec(getIndexSQL('idx_alert_history_triggered'));
    },
    down: (db) => {
      db.exec('DROP INDEX IF EXISTS idx_alert_rules_name');
      db.exec('DROP INDEX IF EXISTS idx_alert_rules_severity');
      db.exec('DROP INDEX IF EXISTS idx_alert_rules_enabled');
      db.exec('DROP INDEX IF EXISTS idx_alert_history_rule');
      db.exec('DROP INDEX IF EXISTS idx_alert_history_status');
      db.exec('DROP INDEX IF EXISTS idx_alert_history_severity');
      db.exec('DROP INDEX IF EXISTS idx_alert_history_triggered');
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
 * Rollback to specific version
 * @param {Database} db - Database instance
 * @param {number} targetVersion - Target version to rollback to
 * @returns {Object} Rollback result
 */
export function rollbackTo(db, targetVersion) {
  ensureMigrationsTable(db);
  
  const executed = getExecutedMigrations(db);
  const toRollback = executed.filter(v => v > targetVersion).sort((a, b) => b - a);
  
  if (toRollback.length === 0) {
    console.log('[Migrations] No migrations to rollback');
    return { rolledBack: 0 };
  }
  
  console.log(`[Migrations] Rolling back ${toRollback.length} migration(s) to v${targetVersion}`);
  
  let count = 0;
  for (const version of toRollback) {
    const migration = migrations.find(m => m.version === version);
    if (!migration) {
      throw new Error(`Migration v${version} not found in registry`);
    }
    
    console.log(`[Migrations] Rolling back: ${migration.name} (v${version})`);
    migration.down(db);
    
    const deleteStmt = db.prepare('DELETE FROM _migrations WHERE version = ?');
    deleteStmt.run(version);
    
    count++;
  }
  
  console.log(`[Migrations] Successfully rolled back ${count} migration(s)`);
  return { rolledBack: count };
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
    pendingMigrations: pending.map(m => ({ version: m.version, name: m.name, description: m.description }))
  };
}

/**
 * Get all migrations info
 * @returns {Array} All migrations with execution status
 */
export function getAllMigrations() {
  return migrations.map(m => ({
    version: m.version,
    name: m.name,
    description: m.description
  }));
}

export default {
  migrate,
  rollback,
  rollbackTo,
  status,
  getAllMigrations,
  migrations
};
