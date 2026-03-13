/**
 * Database Tests
 * Unit tests for database layer
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Use a shared in-memory database for all test suites
const TEST_DB_PATH = 'file:sharedtestdb?mode=memory&cache=shared';

// Test database instance
let db = null;

/**
 * Setup test database
 */
async function setupTestDatabase() {
  // Reset database module to pick up test DB path
  const { resetDatabase, getDatabase, closeDatabase } = await import('../src/database/index.js');
  resetDatabase();
  closeDatabase();
  
  // Get database connection (this will create new in-memory database)
  db = getDatabase(true);
  
  // Create tables
  const { getCreateTableStatements } = await import('../src/database/schema.js');
  const statements = getCreateTableStatements();
  statements.forEach(sql => db.exec(sql));
  
  return db;
}

/**
 * Cleanup test database
 */
function cleanupTestDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

describe('Database Schema', () => {
  before(async () => {
    db = await setupTestDatabase();
  });
  
  after(() => {
    cleanupTestDatabase();
  });
  
  it('should create users table', () => {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    const result = stmt.get();
    assert.ok(result, 'users table should exist');
  });
  
  it('should create configs table', () => {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='configs'");
    const result = stmt.get();
    assert.ok(result, 'configs table should exist');
  });
  
  it('should create audit_logs table', () => {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'");
    const result = stmt.get();
    assert.ok(result, 'audit_logs table should exist');
  });
  
  it('should create sessions table', () => {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'");
    const result = stmt.get();
    assert.ok(result, 'sessions table should exist');
  });
  
  it('users table should have correct columns', () => {
    const stmt = db.prepare("PRAGMA table_info(users)");
    const columns = stmt.all().map(col => col.name);
    
    const expectedColumns = [
      'id', 'username', 'email', 'password_hash', 'role',
      'status', 'created_at', 'updated_at', 'last_login_at'
    ];
    
    expectedColumns.forEach(col => {
      assert.ok(columns.includes(col), `users table should have ${col} column`);
    });
  });
  
  it('configs table should have correct columns', () => {
    const stmt = db.prepare("PRAGMA table_info(configs)");
    const columns = stmt.all().map(col => col.name);
    
    const expectedColumns = [
      'id', 'key', 'value', 'type', 'description',
      'is_sensitive', 'created_at', 'updated_at', 'created_by'
    ];
    
    expectedColumns.forEach(col => {
      assert.ok(columns.includes(col), `configs table should have ${col} column`);
    });
  });
});

describe('User Repository', () => {
  before(async () => {
    db = await setupTestDatabase();
  });
  
  after(() => {
    cleanupTestDatabase();
  });
  
  it('should create a user', async () => {
    const { createUser } = await import('../src/repositories/user-repository.js');
    
    const user = createUser({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashed_password_123',
      role: 'user'
    });
    
    assert.ok(user, 'createUser should return a user');
    assert.strictEqual(user.username, 'testuser');
    assert.strictEqual(user.email, 'test@example.com');
    assert.strictEqual(user.role, 'user');
    assert.ok(user.id > 0, 'user should have an id');
  });
  
  it('should get user by id', async () => {
    const { getUserById } = await import('../src/repositories/user-repository.js');
    
    const user = getUserById(1);
    assert.ok(user, 'getUserById should return a user');
    assert.strictEqual(user.id, 1);
  });
  
  it('should get user by username', async () => {
    const { getUserByUsername } = await import('../src/repositories/user-repository.js');
    
    const user = getUserByUsername('testuser');
    assert.ok(user, 'getUserByUsername should return a user');
    assert.strictEqual(user.username, 'testuser');
  });
  
  it('should get user by email', async () => {
    const { getUserByEmail } = await import('../src/repositories/user-repository.js');
    
    const user = getUserByEmail('test@example.com');
    assert.ok(user, 'getUserByEmail should return a user');
    assert.strictEqual(user.email, 'test@example.com');
  });
  
  it('should return null for non-existent user', async () => {
    const { getUserById } = await import('../src/repositories/user-repository.js');
    
    const user = getUserById(9999);
    assert.strictEqual(user, null, 'getUserById should return null for non-existent user');
  });
  
  it('should update user', async () => {
    const { updateUser, getUserById } = await import('../src/repositories/user-repository.js');
    
    const updated = updateUser(1, { role: 'admin', status: 'active' });
    assert.ok(updated, 'updateUser should return updated user');
    assert.strictEqual(updated.role, 'admin');
    
    const user = getUserById(1);
    assert.strictEqual(user.role, 'admin');
  });
  
  it('should get all users', async () => {
    const { getAllUsers, createUser } = await import('../src/repositories/user-repository.js');
    
    // Create additional users
    createUser({
      username: 'user2',
      email: 'user2@example.com',
      passwordHash: 'hash2',
      role: 'user'
    });
    
    createUser({
      username: 'user3',
      email: 'user3@example.com',
      passwordHash: 'hash3',
      role: 'user'
    });
    
    const users = getAllUsers(10, 0);
    assert.ok(Array.isArray(users), 'getAllUsers should return an array');
    assert.ok(users.length >= 3, 'should have at least 3 users');
  });
  
  it('should get user count', async () => {
    const { getUserCount } = await import('../src/repositories/user-repository.js');
    
    const count = getUserCount();
    assert.ok(count >= 3, 'getUserCount should return count >= 3');
  });
  
  it('should search users', async () => {
    const { searchUsers } = await import('../src/repositories/user-repository.js');
    
    const users = searchUsers('test', 10);
    assert.ok(Array.isArray(users), 'searchUsers should return an array');
    assert.ok(users.length > 0, 'searchUsers should find matching users');
  });
  
  it('should delete user', async () => {
    const { deleteUser, createUser, getUserById } = await import('../src/repositories/user-repository.js');
    
    const newUser = createUser({
      username: 'tobedeleted',
      email: 'delete@example.com',
      passwordHash: 'hash',
      role: 'user'
    });
    
    const deleted = deleteUser(newUser.id);
    assert.strictEqual(deleted, true, 'deleteUser should return true');
    
    const user = getUserById(newUser.id);
    assert.strictEqual(user, null, 'deleted user should not exist');
  });
});

describe('Config Repository', () => {
  before(async () => {
    db = await setupTestDatabase();
  });
  
  after(() => {
    cleanupTestDatabase();
  });
  
  it('should create a config', async () => {
    const { createConfig } = await import('../src/repositories/config-repository.js');
    
    const config = createConfig({
      key: 'test.config',
      value: 'test_value',
      type: 'string',
      description: 'Test configuration'
    });
    
    assert.ok(config, 'createConfig should return a config');
    assert.strictEqual(config.key, 'test.config');
    assert.strictEqual(config.value, 'test_value');
  });
  
  it('should get config by key', async () => {
    const { getConfigByKey } = await import('../src/repositories/config-repository.js');
    
    const config = getConfigByKey('test.config');
    assert.ok(config, 'getConfigByKey should return a config');
    assert.strictEqual(config.key, 'test.config');
  });
  
  it('should get config value with type conversion', async () => {
    const { getConfigValue, createConfig } = await import('../src/repositories/config-repository.js');
    
    // Create number config
    createConfig({
      key: 'test.number',
      value: '42',
      type: 'number'
    });
    
    // Create boolean config
    createConfig({
      key: 'test.boolean',
      value: 'true',
      type: 'boolean'
    });
    
    const numberValue = getConfigValue('test.number');
    assert.strictEqual(numberValue, 42, 'number config should be converted to number');
    
    const booleanValue = getConfigValue('test.boolean');
    assert.strictEqual(booleanValue, true, 'boolean config should be converted to boolean');
  });
  
  it('should return default value for non-existent config', async () => {
    const { getConfigValue } = await import('../src/repositories/config-repository.js');
    
    const value = getConfigValue('nonexistent', 'default');
    assert.strictEqual(value, 'default', 'should return default value');
  });
  
  it('should update config', async () => {
    const { updateConfigByKey, getConfigByKey } = await import('../src/repositories/config-repository.js');
    
    const updated = updateConfigByKey('test.config', { value: 'updated_value' });
    assert.ok(updated, 'updateConfigByKey should return updated config');
    assert.strictEqual(updated.value, 'updated_value');
    
    const config = getConfigByKey('test.config');
    assert.strictEqual(config.value, 'updated_value');
  });
  
  it('should set config (create or update)', async () => {
    const { setConfig, getConfigByKey } = await import('../src/repositories/config-repository.js');
    
    // Update existing
    const updated = setConfig('test.config', 'new_value');
    assert.strictEqual(updated.value, 'new_value');
    
    // Create new
    const created = setConfig('new.config', 'new_value');
    assert.ok(created, 'setConfig should create new config');
    
    const config = getConfigByKey('new.config');
    assert.ok(config, 'new config should exist');
  });
  
  it('should delete config', async () => {
    const { deleteConfigByKey, getConfigByKey } = await import('../src/repositories/config-repository.js');
    
    const deleted = deleteConfigByKey('test.config');
    assert.strictEqual(deleted, true, 'deleteConfigByKey should return true');
    
    const config = getConfigByKey('test.config');
    assert.strictEqual(config, null, 'deleted config should not exist');
  });
});

describe('Audit Repository', () => {
  before(async () => {
    db = await setupTestDatabase();
    // Create a user first for foreign key reference
    const { createUser } = await import('../src/repositories/user-repository.js');
    createUser({
      username: 'audituser',
      email: 'audit@example.com',
      passwordHash: 'hash',
      role: 'user'
    });
  });
  
  after(() => {
    cleanupTestDatabase();
  });
  
  it('should create an audit log', async () => {
    const { createAuditLog } = await import('../src/repositories/audit-repository.js');
    
    const log = createAuditLog({
      userId: 1,
      action: 'CREATE_USER',
      resourceType: 'user',
      resourceId: '1',
      status: 'success',
      ipAddress: '127.0.0.1'
    });
    
    assert.ok(log, 'createAuditLog should return a log');
    assert.strictEqual(log.action, 'CREATE_USER');
    assert.strictEqual(log.status, 'success');
  });
  
  it('should get audit logs', async () => {
    const { getAuditLogs } = await import('../src/repositories/audit-repository.js');
    
    const logs = getAuditLogs({ limit: 10 });
    assert.ok(Array.isArray(logs), 'getAuditLogs should return an array');
    assert.ok(logs.length > 0, 'should have at least one log');
  });
  
  it('should get audit logs by user', async () => {
    const { getUserAuditLogs } = await import('../src/repositories/audit-repository.js');
    
    const logs = getUserAuditLogs(1, 10);
    assert.ok(Array.isArray(logs), 'getUserAuditLogs should return an array');
  });
  
  it('should get audit stats', async () => {
    const { getAuditStats } = await import('../src/repositories/audit-repository.js');
    
    const stats = getAuditStats();
    assert.ok(stats, 'getAuditStats should return stats');
    assert.ok(typeof stats.total === 'number', 'stats should have total count');
  });
  
  it('should get recent audit logs', async () => {
    const { getRecentAuditLogs } = await import('../src/repositories/audit-repository.js');
    
    const logs = getRecentAuditLogs(5);
    assert.ok(Array.isArray(logs), 'getRecentAuditLogs should return an array');
    assert.ok(logs.length <= 5, 'should return at most 5 logs');
  });
});

describe('Session Repository', () => {
  before(async () => {
    db = await setupTestDatabase();
    // Create a user first for foreign key reference
    const { createUser } = await import('../src/repositories/user-repository.js');
    createUser({
      username: 'sessionuser',
      email: 'session@example.com',
      passwordHash: 'hash',
      role: 'user'
    });
  });
  
  after(() => {
    cleanupTestDatabase();
  });
  
  it('should create a session', async () => {
    const { createSession } = await import('../src/repositories/session-repository.js');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    const session = createSession({
      userId: 1,
      token: `test_session_token_${Date.now()}`,
      expiresAt,
      ipAddress: '127.0.0.1'
    });
    
    assert.ok(session, 'createSession should return a session');
    assert.ok(session.token.startsWith('test_session_token_'), 'session should have correct token prefix');
    assert.strictEqual(session.userId, 1);
  });
  
  it('should get session by token', async () => {
    const { getSessionByToken, createSession } = await import('../src/repositories/session-repository.js');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    const testToken = `test_get_token_${Date.now()}`;
    
    createSession({ userId: 1, token: testToken, expiresAt });
    
    const session = getSessionByToken(testToken);
    assert.ok(session, 'getSessionByToken should return a session');
    assert.strictEqual(session.token, testToken);
  });
  
  it('should get user sessions', async () => {
    const { getUserSessions } = await import('../src/repositories/session-repository.js');
    
    const sessions = getUserSessions(1);
    assert.ok(Array.isArray(sessions), 'getUserSessions should return an array');
    assert.ok(sessions.length > 0, 'should have at least one session');
  });
  
  it('should invalidate session', async () => {
    const { invalidateSessionByToken, getSessionByToken, createSession } = await import('../src/repositories/session-repository.js');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    const testToken = `test_invalidate_token_${Date.now()}`;
    
    createSession({ userId: 1, token: testToken, expiresAt });
    
    const result = invalidateSessionByToken(testToken);
    assert.strictEqual(result, true, 'invalidateSessionByToken should return true');
    
    const session = getSessionByToken(testToken);
    assert.strictEqual(session.is_active, 0, 'session should be inactive');
  });
  
  it('should delete expired sessions', async () => {
    const { deleteExpiredSessions } = await import('../src/repositories/session-repository.js');
    
    const deleted = deleteExpiredSessions();
    assert.ok(typeof deleted === 'number', 'deleteExpiredSessions should return count');
  });
});

describe('Database Migrations', () => {
  before(async () => {
    db = await setupTestDatabase();
  });
  
  after(() => {
    cleanupTestDatabase();
  });
  
  it('should get migration status', async () => {
    const { status } = await import('../src/database/migrations.js');
    
    const migrationStatus = status(db);
    assert.ok(migrationStatus, 'status should return migration status');
    assert.ok(typeof migrationStatus.total === 'number', 'status should have total');
    assert.ok(typeof migrationStatus.executed === 'number', 'status should have executed count');
  });
});

// Run a simple connection test
describe('Database Connection', () => {
  it('should connect to database', () => {
    const testDb = new Database(':memory:');
    const result = testDb.prepare('SELECT 1 as test').get();
    assert.strictEqual(result.test, 1);
    testDb.close();
  });
  
  it('should enable foreign keys', () => {
    const testDb = new Database(':memory:');
    testDb.pragma('foreign_keys = ON');
    const result = testDb.pragma('foreign_keys');
    assert.strictEqual(result[0].foreign_keys, 1);
    testDb.close();
  });
});
