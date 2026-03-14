/**
 * Database Schema Definitions
 * Defines all table structures for the OpenClaw Dashboard
 * 
 * Tables:
 * - users: User accounts and authentication
 * - agents: Agent configurations and status
 * - tasks: Task management and tracking
 * - skills: Skill registry and installation status
 * - configs: System configuration key-value store
 * - audit_logs: Audit trail for all operations
 * - sessions: User session management
 * - task_logs: Task execution logs
 * - agent_tools: Agent-tool permissions mapping
 */

export const schema = {
  // ==================== User Management ====================
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'readonly')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      avatar_url TEXT,
      last_login_at DATETIME,
      last_login_ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // ==================== Agent Management ====================
  agents: `
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'custom' CHECK(type IN ('main', 'subagent', 'custom')),
      description TEXT,
      status TEXT DEFAULT 'stopped' CHECK(status IN ('running', 'stopped', 'paused', 'error')),
      config_path TEXT,
      workspace_path TEXT,
      tools_enabled TEXT DEFAULT '[]',
      skills_installed TEXT DEFAULT '[]',
      model_name TEXT,
      max_tokens INTEGER DEFAULT 4096,
      temperature REAL DEFAULT 0.7,
      parent_agent_id INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity_at DATETIME,
      FOREIGN KEY (parent_agent_id) REFERENCES agents(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `,

  agent_tools: `
    CREATE TABLE IF NOT EXISTS agent_tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      tool_name TEXT NOT NULL,
      enabled INTEGER DEFAULT 1 CHECK(enabled IN (0, 1)),
      config_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
      UNIQUE(agent_id, tool_name)
    )
  `,

  // ==================== Task Management ====================
  tasks: `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'critical')),
      agent_id INTEGER,
      parent_task_id TEXT,
      assigned_to INTEGER,
      progress REAL DEFAULT 0.0 CHECK(progress >= 0.0 AND progress <= 100.0),
      started_at DATETIME,
      completed_at DATETIME,
      due_date DATETIME,
      metadata TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `,

  task_logs: `
    CREATE TABLE IF NOT EXISTS task_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      level TEXT DEFAULT 'info' CHECK(level IN ('debug', 'info', 'warn', 'error')),
      message TEXT NOT NULL,
      context TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
    )
  `,

  // ==================== Skill Management ====================
  skills: `
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      version TEXT,
      description TEXT,
      source TEXT DEFAULT 'skillhub' CHECK(source IN ('skillhub', 'clawhub', 'local')),
      status TEXT DEFAULT 'available' CHECK(status IN ('available', 'installed', 'updating', 'error')),
      installed_version TEXT,
      latest_version TEXT,
      location TEXT,
      author TEXT,
      license TEXT,
      dependencies TEXT,
      config_schema TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      installed_at DATETIME
    )
  `,

  agent_skills: `
    CREATE TABLE IF NOT EXISTS agent_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      enabled INTEGER DEFAULT 1 CHECK(enabled IN (0, 1)),
      config_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(agent_id, skill_id)
    )
  `,

  // ==================== Configuration ====================
  configs: `
    CREATE TABLE IF NOT EXISTS configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string' CHECK(type IN ('string', 'number', 'boolean', 'json')),
      description TEXT,
      category TEXT DEFAULT 'general',
      is_sensitive INTEGER DEFAULT 0 CHECK(is_sensitive IN (0, 1)),
      is_system INTEGER DEFAULT 0 CHECK(is_system IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `,

  // ==================== Audit & Logging ====================
  audit_logs: `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT DEFAULT 'success' CHECK(status IN ('success', 'failure', 'error')),
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,

  system_logs: `
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT DEFAULT 'info' CHECK(level IN ('debug', 'info', 'warn', 'error', 'fatal')),
      source TEXT,
      message TEXT NOT NULL,
      context TEXT,
      stack_trace TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // ==================== Session Management ====================
  sessions: `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
      last_activity_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,

  // ==================== Migration Tracking ====================
  _migrations: `
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
};

/**
 * Index definitions for performance optimization
 */
export const indexes = {
  // Users
  idx_users_username: 'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
  idx_users_email: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  idx_users_status: 'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
  idx_users_role: 'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
  
  // Agents
  idx_agents_name: 'CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name)',
  idx_agents_status: 'CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)',
  idx_agents_type: 'CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type)',
  idx_agents_parent: 'CREATE INDEX IF NOT EXISTS idx_agents_parent_agent_id ON agents(parent_agent_id)',
  
  // Agent Tools
  idx_agent_tools_agent: 'CREATE INDEX IF NOT EXISTS idx_agent_tools_agent_id ON agent_tools(agent_id)',
  
  // Tasks
  idx_tasks_task_id: 'CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id)',
  idx_tasks_status: 'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
  idx_tasks_priority: 'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)',
  idx_tasks_agent: 'CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id)',
  idx_tasks_assigned: 'CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)',
  idx_tasks_created: 'CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)',
  idx_tasks_due: 'CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)',
  
  // Task Logs
  idx_task_logs_task: 'CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id)',
  idx_task_logs_level: 'CREATE INDEX IF NOT EXISTS idx_task_logs_level ON task_logs(level)',
  idx_task_logs_created: 'CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at)',
  
  // Skills
  idx_skills_name: 'CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name)',
  idx_skills_status: 'CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status)',
  idx_skills_source: 'CREATE INDEX IF NOT EXISTS idx_skills_source ON skills(source)',
  
  // Agent Skills
  idx_agent_skills_agent: 'CREATE INDEX IF NOT EXISTS idx_agent_skills_agent_id ON agent_skills(agent_id)',
  idx_agent_skills_skill: 'CREATE INDEX IF NOT EXISTS idx_agent_skills_skill_id ON agent_skills(skill_id)',
  
  // Configs
  idx_configs_key: 'CREATE INDEX IF NOT EXISTS idx_configs_key ON configs(key)',
  idx_configs_category: 'CREATE INDEX IF NOT EXISTS idx_configs_category ON configs(category)',
  
  // Audit Logs
  idx_audit_logs_user: 'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
  idx_audit_logs_action: 'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
  idx_audit_logs_resource: 'CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type)',
  idx_audit_logs_created: 'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)',
  
  // System Logs
  idx_system_logs_level: 'CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)',
  idx_system_logs_source: 'CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source)',
  idx_system_logs_created: 'CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)',
  
  // Sessions
  idx_sessions_user: 'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
  idx_sessions_token: 'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)',
  idx_sessions_expires: 'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
  idx_sessions_active: 'CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active)'
};

/**
 * Get all table creation SQL statements
 * @returns {string[]} Array of SQL statements
 */
export function getCreateTableStatements() {
  return Object.values(schema);
}

/**
 * Get all index creation SQL statements
 * @returns {string[]} Array of SQL statements
 */
export function getCreateIndexStatements() {
  return Object.values(indexes);
}

/**
 * Get schema for a specific table
 * @param {string} tableName - Name of the table
 * @returns {string|null} SQL statement or null if not found
 */
export function getTableSchema(tableName) {
  return schema[tableName] || null;
}

/**
 * Get index SQL by name
 * @param {string} indexName - Name of the index
 * @returns {string|null} SQL statement or null if not found
 */
export function getIndexSQL(indexName) {
  return indexes[indexName] || null;
}

/**
 * Get list of all table names
 * @returns {string[]} Array of table names
 */
export function getTableNames() {
  return Object.keys(schema);
}

/**
 * Get list of all index names
 * @returns {string[]} Array of index names
 */
export function getIndexNames() {
  return Object.keys(indexes);
}
