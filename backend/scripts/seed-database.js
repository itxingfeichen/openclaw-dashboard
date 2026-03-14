/**
 * Database Seed Script
 * Seeds the database with initial data for development and testing
 */

import { getDatabase, prepare } from '../src/database/index.js';
import bcrypt from 'bcryptjs';

/**
 * Seed database with initial data
 * @param {Database} db - Database instance
 */
export async function seedDatabase(db) {
  console.log('Seeding users...');
  await seedUsers(db);
  
  console.log('Seeding configs...');
  await seedConfigs(db);
  
  console.log('Seeding sample agents...');
  await seedAgents(db);
  
  console.log('Seeding sample skills...');
  await seedSkills(db);
  
  console.log('Seeding sample tasks...');
  await seedTasks(db);
  
  console.log('✅ Database seeding complete');
}

/**
 * Seed default users
 */
async function seedUsers(db) {
  // Check if users already exist
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existing.count > 0) {
    console.log('  ⚠️  Users already exist, skipping...');
    return;
  }
  
  // Create default admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run('admin', 'admin@openclaw.dev', passwordHash, 'admin', 'active');
  stmt.run('developer', 'dev@openclaw.dev', passwordHash, 'user', 'active');
  stmt.run('viewer', 'view@openclaw.dev', passwordHash, 'readonly', 'active');
  
  console.log('  ✅ Created 3 default users');
  console.log('     - admin / admin123');
  console.log('     - developer / admin123');
  console.log('     - viewer / admin123');
}

/**
 * Seed default configurations
 */
function seedConfigs(db) {
  const configs = [
    // Application settings
    { key: 'app.name', value: 'OpenClaw Dashboard', type: 'string', category: 'general', description: 'Application display name', is_system: 1 },
    { key: 'app.version', value: '1.0.0', type: 'string', category: 'general', description: 'Application version', is_system: 1 },
    { key: 'app.timezone', value: 'UTC', type: 'string', category: 'general', description: 'Default timezone', is_system: 1 },
    { key: 'app.theme', value: 'light', type: 'string', category: 'ui', description: 'Default UI theme' },
    { key: 'app.language', value: 'en-US', type: 'string', category: 'ui', description: 'Default language' },
    
    // Authentication settings
    { key: 'auth.session_timeout', value: '86400', type: 'number', category: 'auth', description: 'Session timeout in seconds', is_system: 1 },
    { key: 'auth.max_login_attempts', value: '5', type: 'number', category: 'auth', description: 'Maximum login attempts before lockout', is_system: 1 },
    { key: 'auth.lockout_duration', value: '900', type: 'number', category: 'auth', description: 'Account lockout duration in seconds', is_system: 1 },
    { key: 'auth.require_email_verification', value: 'false', type: 'boolean', category: 'auth', description: 'Require email verification for new users' },
    { key: 'auth.password_min_length', value: '8', type: 'number', category: 'auth', description: 'Minimum password length' },
    
    // API settings
    { key: 'api.rate_limit', value: '100', type: 'number', category: 'api', description: 'API rate limit per minute', is_system: 1 },
    { key: 'api.max_page_size', value: '100', type: 'number', category: 'api', description: 'Maximum page size for pagination', is_system: 1 },
    { key: 'api.enable_cors', value: 'true', type: 'boolean', category: 'api', description: 'Enable CORS' },
    { key: 'api.allowed_origins', value: '["*"]', type: 'json', category: 'api', description: 'Allowed CORS origins' },
    
    // Logging settings
    { key: 'log.retention_days', value: '30', type: 'number', category: 'log', description: 'Log retention period in days', is_system: 1 },
    { key: 'log.level', value: 'info', type: 'string', category: 'log', description: 'Default log level', is_system: 1 },
    { key: 'log.enable_audit', value: 'true', type: 'boolean', category: 'log', description: 'Enable audit logging' },
    
    // Agent settings
    { key: 'agent.default_model', value: 'qwencode/qwen3.5-plus', type: 'string', category: 'agent', description: 'Default model for agents' },
    { key: 'agent.default_max_tokens', value: '4096', type: 'number', category: 'agent', description: 'Default max tokens' },
    { key: 'agent.default_temperature', value: '0.7', type: 'number', category: 'agent', description: 'Default temperature' },
    { key: 'agent.auto_start', value: 'false', type: 'boolean', category: 'agent', description: 'Auto-start agents on creation' },
    
    // Task settings
    { key: 'task.default_priority', value: 'normal', type: 'string', category: 'task', description: 'Default task priority' },
    { key: 'task.auto_archive_days', value: '90', type: 'number', category: 'task', description: 'Auto-archive completed tasks after days' },
    { key: 'task.enable_notifications', value: 'true', type: 'boolean', category: 'task', description: 'Enable task notifications' },
    
    // Skill settings
    { key: 'skill.default_source', value: 'skillhub', type: 'string', category: 'skill', description: 'Default skill source', is_system: 1 },
    { key: 'skill.auto_update', value: 'false', type: 'boolean', category: 'skill', description: 'Auto-update skills' },
    { key: 'skill.verify_signatures', value: 'true', type: 'boolean', category: 'skill', description: 'Verify skill signatures' }
  ];
  
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO configs (key, value, type, category, description, is_system)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  let count = 0;
  configs.forEach(config => {
    const result = stmt.run(config.key, config.value, config.type, config.category, config.description, config.is_system || 0);
    if (result.changes > 0) {
      count++;
    }
  });
  
  console.log(`  ✅ Inserted ${count} configuration entries`);
}

/**
 * Seed sample agents
 */
function seedAgents(db) {
  // Check if agents already exist
  const existing = db.prepare('SELECT COUNT(*) as count FROM agents').get();
  if (existing.count > 0) {
    console.log('  ⚠️  Agents already exist, skipping...');
    return;
  }
  
  const stmt = db.prepare(`
    INSERT INTO agents (name, type, description, status, model_name, max_tokens, temperature, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Get admin user ID
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  const adminId = admin ? admin.id : null;
  
  // Create main coordinator agent
  stmt.run(
    'main',
    'main',
    'Main coordinator agent for task orchestration',
    'stopped',
    'qwencode/qwen3.5-plus',
    4096,
    0.7,
    adminId
  );
  
  // Create sample subagents
  stmt.run(
    'product_manager',
    'subagent',
    'Product management specialist - PRD, requirements, user stories',
    'stopped',
    'qwencode/qwen3.5-plus',
    4096,
    0.7,
    adminId
  );
  
  stmt.run(
    'coder',
    'subagent',
    'Software development specialist - coding, debugging, architecture',
    'stopped',
    'qwencode/qwen3.5-plus',
    8192,
    0.5,
    adminId
  );
  
  console.log('  ✅ Created 3 sample agents');
}

/**
 * Seed sample skills
 */
function seedSkills(db) {
  // Check if skills already exist
  const existing = db.prepare('SELECT COUNT(*) as count FROM skills').get();
  if (existing.count > 0) {
    console.log('  ⚠️  Skills already exist, skipping...');
    return;
  }
  
  const stmt = db.prepare(`
    INSERT INTO skills (name, version, description, source, status, author, license)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const skills = [
    ['feishu-doc', '1.0.0', 'Feishu document read/write operations', 'skillhub', 'available', 'OpenClaw', 'MIT'],
    ['feishu-drive', '1.0.0', 'Feishu cloud storage file management', 'skillhub', 'available', 'OpenClaw', 'MIT'],
    ['feishu-perm', '1.0.0', 'Feishu permission management', 'skillhub', 'available', 'OpenClaw', 'MIT'],
    ['feishu-wiki', '1.0.0', 'Feishu knowledge base navigation', 'skillhub', 'available', 'OpenClaw', 'MIT'],
    ['qqbot-cron', '1.0.0', 'QQBot scheduled reminders', 'skillhub', 'available', 'OpenClaw', 'MIT'],
    ['qqbot-media', '1.0.0', 'QQBot media handling', 'skillhub', 'available', 'OpenClaw', 'MIT'],
    ['weather', '1.0.0', 'Weather forecast via wttr.in or Open-Meteo', 'clawhub', 'available', 'OpenClaw', 'MIT'],
    ['github-mcp', '1.0.0', 'GitHub MCP Server integration', 'clawhub', 'available', 'OpenClaw', 'MIT'],
    ['mermaid-diagrams', '1.0.0', 'Create diagrams using Mermaid syntax', 'clawhub', 'available', 'OpenClaw', 'MIT']
  ];
  
  skills.forEach(skill => {
    stmt.run(...skill);
  });
  
  console.log(`  ✅ Created ${skills.length} sample skills`);
}

/**
 * Seed sample tasks
 */
function seedTasks(db) {
  // Check if tasks already exist
  const existing = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  if (existing.count > 0) {
    console.log('  ⚠️  Tasks already exist, skipping...');
    return;
  }
  
  const stmt = db.prepare(`
    INSERT INTO tasks (task_id, title, description, status, priority, agent_id, assigned_to, progress, due_date, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Get IDs
  const mainAgent = db.prepare('SELECT id FROM agents WHERE name = ?').get('main');
  const pmAgent = db.prepare('SELECT id FROM agents WHERE name = ?').get('product_manager');
  const coderAgent = db.prepare('SELECT id FROM agents WHERE name = ?').get('coder');
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  
  const mainAgentId = mainAgent ? mainAgent.id : null;
  const pmAgentId = pmAgent ? pmAgent.id : null;
  const coderAgentId = coderAgent ? coderAgent.id : null;
  const adminId = admin ? admin.id : null;
  
  const tasks = [
    [
      'T1.1',
      '项目脚手架搭建',
      'Setup project scaffolding for frontend and backend',
      'completed',
      'high',
      mainAgentId,
      adminId,
      100,
      '2026-03-13',
      JSON.stringify({ deliverables: ['frontend', 'backend', 'docs'] })
    ],
    [
      'T1.2',
      '用户认证系统',
      'Implement user authentication with JWT',
      'completed',
      'high',
      coderAgentId,
      adminId,
      100,
      '2026-03-13',
      JSON.stringify({ deliverables: ['login', 'logout', 'session-management'] })
    ],
    [
      'T1.3',
      '数据库设计与实现',
      'Design database schema, indexes, and migration scripts',
      'running',
      'critical',
      coderAgentId,
      adminId,
      75,
      '2026-03-14',
      JSON.stringify({ deliverables: ['schema', 'migrations', 'repositories'] })
    ],
    [
      'T1.4',
      '系统状态仪表盘',
      'Create system status dashboard',
      'pending',
      'high',
      mainAgentId,
      adminId,
      0,
      '2026-03-15',
      JSON.stringify({ deliverables: ['dashboard-ui', 'status-api'] })
    ],
    [
      'T1.5',
      'Agent 管理功能',
      'Implement agent management (list, start, stop)',
      'pending',
      'high',
      coderAgentId,
      adminId,
      0,
      '2026-03-16',
      JSON.stringify({ deliverables: ['agent-api', 'agent-ui'] })
    ],
    [
      'T2.1',
      '技能市场集成',
      'Integrate skill market (skillhub/clawhub)',
      'pending',
      'normal',
      mainAgentId,
      adminId,
      0,
      '2026-03-20',
      JSON.stringify({ deliverables: ['skill-search', 'skill-install', 'skill-update'] })
    ]
  ];
  
  tasks.forEach(task => {
    stmt.run(...task);
  });
  
  console.log(`  ✅ Created ${tasks.length} sample tasks`);
  
  // Add some task logs
  const logStmt = db.prepare(`
    INSERT INTO task_logs (task_id, level, message, context)
    VALUES (?, ?, ?, ?)
  `);
  
  logStmt.run('T1.3', 'info', 'Task started', JSON.stringify({ timestamp: new Date().toISOString() }));
  logStmt.run('T1.3', 'info', 'Database schema designed', JSON.stringify({ tables: 10 }));
  logStmt.run('T1.3', 'info', 'Migration scripts created', JSON.stringify({ migrations: 10 }));
  logStmt.run('T1.3', 'info', 'Repository layer implemented', JSON.stringify({ repositories: 5 }));
}

export default {
  seedDatabase,
  seedUsers,
  seedConfigs,
  seedAgents,
  seedSkills,
  seedTasks
};

// Run seeding when executed directly
async function main() {
  try {
    const { getDatabase, closeDatabase } = await import('../src/database/index.js');
    const db = await getDatabase();
    await seedDatabase(db);
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
}

main();
