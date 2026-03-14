# Database Documentation

## Overview

The OpenClaw Dashboard uses SQLite by default for development and testing, with optional PostgreSQL support for production deployments.

## Database Structure

### Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| **users** | User accounts and authentication | id, username, email, role, status |
| **agents** | Agent configurations and status | id, name, type, status, model_name |
| **agent_tools** | Agent-tool permissions mapping | id, agent_id, tool_name, enabled |
| **tasks** | Task management and tracking | id, task_id, title, status, priority |
| **task_logs** | Task execution logs | id, task_id, level, message |
| **skills** | Skill registry and installation status | id, name, version, status, source |
| **agent_skills** | Agent-skill mappings | id, agent_id, skill_id, enabled |
| **configs** | System configuration key-value store | id, key, value, type, category |
| **audit_logs** | Audit trail for all operations | id, user_id, action, resource_type |
| **system_logs** | Application system logs | id, level, source, message |
| **sessions** | User session management | id, user_id, token, expires_at |
| **_migrations** | Migration tracking | id, version, name, executed_at |

### Entity Relationships

```
users (1) ──< (N) agents
users (1) ──< (N) tasks (assigned_to)
users (1) ──< (N) configs (created_by)
users (1) ──< (N) audit_logs
users (1) ──< (N) sessions

agents (1) ──< (N) agent_tools
agents (1) ──< (N) agent_skills
agents (1) ──< (N) tasks (agent_id)
agents (1) ──< (N) agents (parent_agent_id - self reference)

tasks (1) ──< (N) task_logs
tasks (1) ──< (N) tasks (parent_task_id - self reference)

skills (1) ──< (N) agent_skills
```

## Setup

### Development (SQLite)

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

3. **Seed database (optional):**
   ```bash
   npm run db:seed
   ```

### Production (PostgreSQL)

1. **Install PostgreSQL driver:**
   ```bash
   npm install pg
   ```

2. **Set environment variables:**
   ```bash
   export DB_TYPE=postgresql
   export PG_HOST=localhost
   export PG_PORT=5432
   export PG_DATABASE=openclaw_dashboard
   export PG_USER=openclaw
   export PG_PASSWORD=your-secure-password
   ```

3. **Create database:**
   ```bash
   createdb -U openclaw openclaw_dashboard
   ```

4. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

## Migration Commands

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run all pending migrations |
| `npm run db:rollback` | Rollback last migration |
| `npm run db:status` | Show migration status |
| `npm run db:reset` | Reset database (drop all + re-migrate) |
| `npm run db:seed` | Seed database with initial data |

### Manual Migration Commands

```bash
# Run migrations
node scripts/db-migrate.js migrate

# Check status
node scripts/db-migrate.js status

# Rollback last migration
node scripts/db-migrate.js rollback

# Rollback to specific version
node scripts/db-migrate.js rollback-to 5

# Reset database (requires FORCE_RESET=true)
FORCE_RESET=true node scripts/db-migrate.js reset
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_TYPE` | `sqlite` | Database type: `sqlite` or `postgresql` |
| `DB_PATH` | `./data/openclaw.db` | SQLite database file path |
| `DB_VERBOSE` | `false` | Enable verbose database logging |
| `PG_HOST` | `localhost` | PostgreSQL host |
| `PG_PORT` | `5432` | PostgreSQL port |
| `PG_DATABASE` | `openclaw_dashboard` | PostgreSQL database name |
| `PG_USER` | `openclaw` | PostgreSQL username |
| `PG_PASSWORD` | `` | PostgreSQL password |
| `PG_POOL_MAX` | `10` | PostgreSQL connection pool max size |
| `PG_IDLE_TIMEOUT` | `30000` | PostgreSQL idle timeout (ms) |
| `PG_CONNECTION_TIMEOUT` | `2000` | PostgreSQL connection timeout (ms) |

## Connection Pool

### SQLite
- Uses singleton pattern
- WAL mode enabled for better performance
- Foreign keys enabled

### PostgreSQL
- Connection pooling with configurable size
- Automatic connection recovery
- Configurable timeouts

## Indexes

All tables have appropriate indexes for common query patterns:

### Users
- `idx_users_username` - Fast username lookups
- `idx_users_email` - Fast email lookups
- `idx_users_status` - Filter by status
- `idx_users_role` - Filter by role

### Agents
- `idx_agents_name` - Fast name lookups
- `idx_agents_status` - Filter by status
- `idx_agents_type` - Filter by type
- `idx_agents_parent_agent_id` - Find subagents

### Tasks
- `idx_tasks_task_id` - Fast task ID lookups
- `idx_tasks_status` - Filter by status
- `idx_tasks_priority` - Filter by priority
- `idx_tasks_agent_id` - Find tasks by agent
- `idx_tasks_assigned_to` - Find tasks by assignee
- `idx_tasks_created_at` - Sort by creation date
- `idx_tasks_due_date` - Find overdue tasks

### Skills
- `idx_skills_name` - Fast name lookups
- `idx_skills_status` - Filter by status
- `idx_skills_source` - Filter by source

### Logs
- `idx_task_logs_task_id` - Find logs by task
- `idx_task_logs_level` - Filter by level
- `idx_task_logs_created_at` - Sort by date
- `idx_audit_logs_user_id` - Find logs by user
- `idx_audit_logs_action` - Filter by action
- `idx_audit_logs_created_at` - Sort by date

## Data Access Layer

Repositories provide a clean API for database operations:

### User Repository
```javascript
import { createUser, getUserById, updateUser } from './repositories/user-repository.js';

const user = createUser({ username, email, passwordHash });
const updated = updateUser(id, { status: 'active' });
```

### Agent Repository
```javascript
import { createAgent, getAgentById, updateAgentStatus } from './repositories/agent-repository.js';

const agent = createAgent({ name, type, description });
const running = updateAgentStatus(id, 'running');
```

### Task Repository
```javascript
import { createTask, updateTaskProgress, addTaskLog } from './repositories/task-repository.js';

const task = createTask({ taskId, title, description });
updateTaskProgress(id, 50);
addTaskLog(taskId, 'Task completed', 'info');
```

### Skill Repository
```javascript
import { upsertSkill, markSkillInstalled, getAgentSkills } from './repositories/skill-repository.js';

const skill = upsertSkill({ name, version, description });
markSkillInstalled(name, version, location);
```

## Default Users (After Seeding)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| developer | admin123 | user |
| viewer | admin123 | readonly |

**⚠️ Change default passwords in production!**

## Backup & Restore

### SQLite Backup
```bash
# Backup
cp data/openclaw.db data/openclaw.backup.db

# Restore
cp data/openclaw.backup.db data/openclaw.db
```

### PostgreSQL Backup
```bash
# Backup
pg_dump -U openclaw openclaw_dashboard > backup.sql

# Restore
psql -U openclaw -d openclaw_dashboard < backup.sql
```

## Performance Tuning

### SQLite
- WAL mode enabled by default
- Synchronous mode: NORMAL (balance of safety and speed)
- Cache size: 10000 pages
- Memory mapped I/O: 256MB

### PostgreSQL
- Connection pooling: 10 connections (configurable)
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

## Testing

Use test database for running tests:

```bash
# Run tests with test database
DB_PATH=./data/test-openclaw.db npm test

# Run tests with coverage
DB_PATH=./data/test-openclaw.db npm run test:coverage
```

## Troubleshooting

### Database locked (SQLite)
```bash
# Check for locks
lsof data/openclaw.db

# Kill processes holding locks
kill -9 <pid>
```

### Migration failed
```bash
# Check migration status
npm run db:status

# Rollback failed migration
npm run db:rollback

# Fix and re-run
npm run db:migrate
```

### Connection refused (PostgreSQL)
```bash
# Check PostgreSQL is running
pg_isready

# Check connection settings
echo $PG_HOST $PG_PORT $PG_USER
```
