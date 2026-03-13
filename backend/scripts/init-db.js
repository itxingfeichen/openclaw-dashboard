#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes the database with schema and runs migrations
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../data/openclaw.db');

console.log('🚀 OpenClaw Dashboard - Database Initialization');
console.log('=' .repeat(50));

// Ensure data directory exists
import { existsSync, mkdirSync } from 'fs';
const dataDir = join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Created data directory: ${dataDir}`);
}

console.log(`📊 Database path: ${DB_PATH}`);

// Connect to database
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

console.log('✅ Connected to database');

// Import and run schema
console.log('\n📋 Loading schema...');
const { getCreateTableStatements, getTableNames } = await import('../src/database/schema.js');

const tableNames = getTableNames();
console.log(`📊 Tables to create: ${tableNames.join(', ')}`);

const statements = getCreateTableStatements();
statements.forEach((sql, index) => {
  db.exec(sql);
  console.log(`   ✅ Created table: ${tableNames[index]}`);
});

// Import and run migrations
console.log('\n🔄 Running migrations...');
const { migrate, status } = await import('../src/database/migrations.js');

try {
  const result = migrate(db);
  console.log(`   ✅ Executed ${result.executed} migration(s)`);
} catch (error) {
  console.error('   ❌ Migration failed:', error.message);
  db.close();
  process.exit(1);
}

// Show migration status
const migrationStatus = status(db);
console.log(`   📊 Current version: ${migrationStatus.currentVersion}`);
console.log(`   📊 Latest version: ${migrationStatus.latestVersion}`);

// Create default admin user if not exists
console.log('\n👤 Checking default admin user...');
const { getUserByUsername, createUser } = await import('../src/repositories/user-repository.js');

const adminUser = getUserByUsername('admin');
if (!adminUser) {
  // Create default admin user
  // Note: In production, password should be properly hashed
  const bcrypt = await import('bcrypt').catch(() => null);
  
  let passwordHash;
  if (bcrypt) {
    passwordHash = bcrypt.hashSync('admin123', 10);
  } else {
    // Fallback if bcrypt not available (for initialization only)
    passwordHash = 'sha256_hash_of_admin123_placeholder';
  }
  
  try {
    const newAdmin = createUser({
      username: 'admin',
      email: 'admin@openclaw.local',
      passwordHash,
      role: 'admin'
    });
    console.log('   ✅ Created default admin user');
    console.log('   ⚠️  Default credentials: admin / admin123');
    console.log('   ⚠️  Please change the password immediately!');
  } catch (error) {
    console.log('   ⚠️  Could not create admin user (bcrypt may not be installed)');
    console.log('   ℹ️  You can create users through the API once running');
  }
} else {
  console.log('   ℹ️  Admin user already exists');
}

// Create default configurations
console.log('\n⚙️  Setting up default configurations...');
const { getConfigByKey, createConfig } = await import('../src/repositories/config-repository.js');

const defaultConfigs = [
  { key: 'app.name', value: 'OpenClaw Dashboard', type: 'string', description: 'Application name' },
  { key: 'app.version', value: '0.1.0', type: 'string', description: 'Application version' },
  { key: 'auth.sessionTimeout', value: '3600', type: 'number', description: 'Session timeout in seconds' },
  { key: 'auth.maxSessions', value: '5', type: 'number', description: 'Maximum sessions per user' },
  { key: 'audit.retentionDays', value: '90', type: 'number', description: 'Audit log retention in days' }
];

let configsCreated = 0;
defaultConfigs.forEach(config => {
  const existing = getConfigByKey(config.key);
  if (!existing) {
    createConfig(config);
    console.log(`   ✅ Created config: ${config.key}`);
    configsCreated++;
  }
});

if (configsCreated === 0) {
  console.log('   ℹ️  All default configs already exist');
}

// Close database
db.close();

console.log('\n' + '='.repeat(50));
console.log('✅ Database initialization complete!');
console.log('\nNext steps:');
console.log('  1. Change the default admin password');
console.log('  2. Configure environment variables in .env');
console.log('  3. Start the server: npm start');
console.log('');
