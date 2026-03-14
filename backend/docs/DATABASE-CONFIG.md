# 数据库配置文档 - Database Configuration Guide

## 概述

OpenClaw Dashboard 使用 SQLite 作为默认数据库（开发和测试），并支持 PostgreSQL 用于生产环境部署。

## 数据库架构

### 核心表结构

#### 1. 用户管理 (users)
```sql
CREATE TABLE users (
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
```

**字段说明：**
- `role`: 用户角色（admin/user/readonly）
- `status`: 账户状态（active/inactive/suspended）
- `password_hash`: 使用 bcrypt 加密的密码哈希

#### 2. Agent 管理 (agents)
```sql
CREATE TABLE agents (
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
```

**字段说明：**
- `type`: Agent 类型（main/subagent/custom）
- `status`: 运行状态（running/stopped/paused/error）
- `tools_enabled`: JSON 数组，启用的工具列表
- `skills_installed`: JSON 数组，已安装的技能列表

#### 3. Agent 工具权限 (agent_tools)
```sql
CREATE TABLE agent_tools (
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
```

#### 4. 任务管理 (tasks)
```sql
CREATE TABLE tasks (
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
```

**字段说明：**
- `task_id`: 任务唯一标识符（如 T1.3）
- `status`: 任务状态（pending/running/paused/completed/failed/cancelled）
- `priority`: 优先级（low/normal/high/critical）
- `progress`: 进度百分比（0-100）
- `metadata`: JSON 格式的元数据

#### 5. 任务日志 (task_logs)
```sql
CREATE TABLE task_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  level TEXT DEFAULT 'info' CHECK(level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  context TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
)
```

#### 6. 技能管理 (skills)
```sql
CREATE TABLE skills (
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
```

#### 7. Agent 技能关联 (agent_skills)
```sql
CREATE TABLE agent_skills (
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
```

#### 8. 系统配置 (configs)
```sql
CREATE TABLE configs (
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
```

#### 9. 审计日志 (audit_logs)
```sql
CREATE TABLE audit_logs (
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
```

#### 10. 系统日志 (system_logs)
```sql
CREATE TABLE system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT DEFAULT 'info' CHECK(level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  source TEXT,
  message TEXT NOT NULL,
  context TEXT,
  stack_trace TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### 11. 会话管理 (sessions)
```sql
CREATE TABLE sessions (
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
```

#### 12. 迁移跟踪 (_migrations)
```sql
CREATE TABLE _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## 索引设计

### 用户表索引
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
```

### Agent 表索引
```sql
CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_parent_agent_id ON agents(parent_agent_id);
CREATE INDEX idx_agent_tools_agent_id ON agent_tools(agent_id);
```

### 任务表索引
```sql
CREATE INDEX idx_tasks_task_id ON tasks(task_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_level ON task_logs(level);
CREATE INDEX idx_task_logs_created_at ON task_logs(created_at);
```

### 技能表索引
```sql
CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_status ON skills(status);
CREATE INDEX idx_skills_source ON skills(source);
CREATE INDEX idx_agent_skills_agent_id ON agent_skills(agent_id);
CREATE INDEX idx_agent_skills_skill_id ON agent_skills(skill_id);
```

### 配置表索引
```sql
CREATE INDEX idx_configs_key ON configs(key);
CREATE INDEX idx_configs_category ON configs(category);
```

### 日志表索引
```sql
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_source ON system_logs(source);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
```

### 会话表索引
```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
```

## 环境配置

### 开发环境 (SQLite)

创建 `.env` 文件：
```bash
# 数据库类型
DB_TYPE=sqlite

# SQLite 数据库路径
DB_PATH=./data/openclaw.db

# 可选：详细日志
DB_VERBOSE=false
```

### 生产环境 (PostgreSQL)

创建 `.env` 文件：
```bash
# 数据库类型
DB_TYPE=postgresql

# PostgreSQL 连接配置
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=openclaw_dashboard
PG_USER=openclaw
PG_PASSWORD=your-secure-password

# 连接池配置
PG_POOL_MAX=10
PG_IDLE_TIMEOUT=30000
PG_CONNECTION_TIMEOUT=2000
```

## 数据库初始化

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 运行迁移
```bash
# 运行所有待执行的迁移
npm run db:migrate

# 或手动执行
node scripts/db-migrate.js migrate
```

### 3. 种子数据（可选）
```bash
# 填充初始数据
npm run db:seed

# 或手动执行
node scripts/db-migrate.js seed
```

### 4. 查看迁移状态
```bash
npm run db:status
```

## 迁移命令

| 命令 | 说明 |
|------|------|
| `npm run db:migrate` | 运行所有待执行的迁移 |
| `npm run db:rollback` | 回滚最后一个迁移 |
| `npm run db:rollback-to <version>` | 回滚到指定版本 |
| `npm run db:status` | 显示迁移状态 |
| `npm run db:reset` | 重置数据库（删除所有表并重新迁移） |
| `npm run db:seed` | 填充种子数据 |

### 手动迁移操作

```bash
# 查看迁移状态
node scripts/db-migrate.js status

# 运行迁移
node scripts/db-migrate.js migrate

# 回滚最后一个迁移
node scripts/db-migrate.js rollback

# 回滚到特定版本
node scripts/db-migrate.js rollback-to 5

# 重置数据库（需要确认）
FORCE_RESET=true node scripts/db-migrate.js reset
```

## 数据访问层 (Repository)

### 用户仓库
```javascript
import { 
  createUser, 
  getUserById, 
  updateUser, 
  deleteUser 
} from './repositories/user-repository.js';

// 创建用户
const user = createUser({
  username: 'newuser',
  email: 'user@example.com',
  passwordHash: '$2a$10$...'
});

// 查询用户
const user = getUserById(1);
const byUsername = getUserByUsername('admin');

// 更新用户
updateUser(1, { status: 'active' });

// 删除用户
deleteUser(1);
```

### Agent 仓库
```javascript
import { 
  createAgent, 
  getAgentById, 
  updateAgentStatus,
  getAgentTools 
} from './repositories/agent-repository.js';

// 创建 Agent
const agent = createAgent({
  name: 'coder',
  type: 'subagent',
  description: '代码开发专家',
  created_by: 1
});

// 更新状态
updateAgentStatus(agent.id, 'running');

// 获取 Agent 的工具
const tools = getAgentTools(agent.id);
```

### 任务仓库
```javascript
import { 
  createTask, 
  updateTaskProgress, 
  addTaskLog,
  getTasksByStatus 
} from './repositories/task-repository.js';

// 创建任务
const task = createTask({
  taskId: 'T1.3',
  title: '数据库设计',
  description: '设计数据库表结构',
  priority: 'high',
  agent_id: 1,
  assigned_to: 1
});

// 更新进度
updateTaskProgress(task.id, 50);

// 添加日志
addTaskLog(task.task_id, '任务开始执行', 'info');

// 查询任务
const pendingTasks = getTasksByStatus('pending');
```

### 技能仓库
```javascript
import { 
  upsertSkill, 
  markSkillInstalled, 
  getAgentSkills,
  searchSkills 
} from './repositories/skill-repository.js';

// 注册技能
const skill = upsertSkill({
  name: 'weather',
  version: '1.0.0',
  description: '天气查询技能',
  source: 'clawhub'
});

// 标记为已安装
markSkillInstalled('weather', '1.0.0', '/path/to/skill');

// 获取 Agent 的技能
const skills = getAgentSkills(agentId);
```

## 默认用户（种子数据）

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | admin | 管理员账户 |
| developer | admin123 | user | 开发者账户 |
| viewer | admin123 | readonly | 只读账户 |

**⚠️ 重要：在生产环境中必须修改默认密码！**

## 性能优化

### SQLite 优化配置
```javascript
// 在 database/index.js 中已配置
db.pragma('journal_mode = WAL');  // WAL 模式
db.pragma('synchronous = NORMAL'); // 平衡安全性和性能
db.pragma('cache_size = 10000');   // 缓存 10000 页
db.pragma('temp_store = MEMORY');  // 临时存储使用内存
db.pragma('mmap_size = 268435456'); // 内存映射 256MB
```

### PostgreSQL 优化建议
```sql
-- 增加连接池大小（根据负载调整）
max_connections = 100

-- 调整共享缓冲区
shared_buffers = 256MB

-- 工作内存
work_mem = 16MB

-- 维护工作内存
maintenance_work_mem = 128MB
```

## 备份与恢复

### SQLite 备份
```bash
# 备份
cp data/openclaw.db data/openclaw.backup.$(date +%Y%m%d).db

# 恢复
cp data/openclaw.backup.db data/openclaw.db
```

### PostgreSQL 备份
```bash
# 备份
pg_dump -U openclaw -h localhost openclaw_dashboard > backup_$(date +%Y%m%d).sql

# 压缩备份
pg_dump -U openclaw -h localhost openclaw_dashboard | gzip > backup_$(date +%Y%m%d).sql.gz

# 恢复
psql -U openclaw -h localhost -d openclaw_dashboard < backup.sql

# 恢复压缩备份
gunzip < backup.sql.gz | psql -U openclaw -h localhost -d openclaw_dashboard
```

## 监控与维护

### 数据库健康检查
```javascript
import { healthCheck } from './database/index.js';

const health = await healthCheck();
console.log(health);
// { status: 'healthy', type: 'sqlite', responseTime: '2ms' }
```

### 获取数据库统计
```javascript
import { getStats } from './database/index.js';

const stats = getStats();
console.log(stats);
```

### 日志清理
定期清理旧日志（建议每月执行）：
```sql
-- 清理 30 天前的任务日志
DELETE FROM task_logs 
WHERE created_at < datetime('now', '-30 days');

-- 清理 30 天前的审计日志
DELETE FROM audit_logs 
WHERE created_at < datetime('now', '-30 days');

-- 清理 30 天前的系统日志
DELETE FROM system_logs 
WHERE created_at < datetime('now', '-30 days');
```

## 故障排查

### SQLite 数据库锁定
```bash
# 检查锁
lsof data/openclaw.db

# 杀死持有锁的进程
kill -9 <pid>

# 或者等待 WAL 检查点完成
sqlite3 data/openclaw.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

### 迁移失败
```bash
# 查看迁移状态
npm run db:status

# 回滚失败的迁移
npm run db:rollback

# 修复后重新运行
npm run db:migrate
```

### PostgreSQL 连接拒绝
```bash
# 检查 PostgreSQL 是否运行
pg_isready

# 检查连接配置
echo $PG_HOST $PG_PORT $PG_USER

# 测试连接
psql -U openclaw -h localhost -d openclaw_dashboard -c "SELECT 1"
```

## 测试

### 运行数据库测试
```bash
# 使用测试数据库运行测试
DB_PATH=./data/test-openclaw.db npm test

# 运行测试覆盖率
DB_PATH=./data/test-openclaw.db npm run test:coverage

# 监视模式运行测试
DB_PATH=./data/test-openclaw.db npm run test:watch
```

### 测试数据库清理
```bash
# 每次测试前自动清理
# 在测试文件中：
import { resetDatabase } from './database/index.js';

beforeEach(() => {
  resetDatabase();
});
```

## 安全最佳实践

1. **密码加密**: 所有密码使用 bcrypt 加密（cost factor >= 10）
2. **SQL 注入防护**: 使用参数化查询，不拼接 SQL 字符串
3. **敏感数据**: 敏感配置字段标记 `is_sensitive = 1`
4. **访问控制**: 实现基于角色的访问控制（RBAC）
5. **审计日志**: 记录所有关键操作
6. **会话管理**: 设置合理的会话超时时间
7. **输入验证**: 在应用层验证所有输入数据

## 扩展性考虑

### 分表策略
当单个表数据量过大时，考虑：
- 按时间分表（如 task_logs_2026_03）
- 按业务分表（如按 agent_id 范围）

### 读写分离
生产环境可考虑：
- 主库负责写操作
- 从库负责读操作
- 使用连接池路由

### 缓存层
对于高频查询：
- 使用 Redis 缓存热点数据
- 实现缓存失效策略
- 注意缓存一致性

---

**文档版本**: 1.0.0  
**最后更新**: 2026-03-14  
**维护者**: OpenClaw Team
