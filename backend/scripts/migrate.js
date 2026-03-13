#!/usr/bin/env node

/**
 * Database Migration Script
 * Runs pending migrations or rolls back migrations
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, '../data/openclaw.db');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'status';
const verbose = args.includes('--verbose') || args.includes('-v');

console.log('🔄 OpenClaw Dashboard - Database Migrations');
console.log('=' .repeat(50));
console.log(`📊 Database: ${DB_PATH}`);
console.log(`📋 Command: ${command}`);
console.log('');

// Connect to database
let db;
try {
  db = new Database(DB_PATH, { readonly: command === 'status' });
  db.pragma('foreign_keys = ON');
  console.log('✅ Connected to database');
} catch (error) {
  console.error('❌ Failed to connect to database:', error.message);
  process.exit(1);
}

// Import migration functions
const { migrate, rollback, status } = await import('../src/database/migrations.js');

try {
  switch (command) {
    case 'status':
      console.log('\n📊 Migration Status:');
      const migrationStatus = status(db);
      console.log(`   Total migrations: ${migrationStatus.total}`);
      console.log(`   Executed: ${migrationStatus.executed}`);
      console.log(`   Pending: ${migrationStatus.pending}`);
      console.log(`   Current version: ${migrationStatus.currentVersion}`);
      console.log(`   Latest version: ${migrationStatus.latestVersion}`);
      
      if (migrationStatus.pendingMigrations.length > 0) {
        console.log('\n   Pending migrations:');
        migrationStatus.pendingMigrations.forEach(m => {
          console.log(`     - v${m.version}: ${m.name}`);
        });
      }
      break;
      
    case 'up':
    case 'migrate':
      console.log('\n🚀 Running migrations...');
      const result = migrate(db);
      console.log(`\n✅ Successfully executed ${result.executed} migration(s)`);
      break;
      
    case 'down':
    case 'rollback':
      console.log('\n⏪ Rolling back last migration...');
      const rollbackResult = rollback(db);
      console.log(`\n✅ Rolled back ${rollbackResult.rolledBack} migration(s)`);
      break;
      
    case 'reset':
      console.log('\n⚠️  Resetting database...');
      console.log('   This will drop all tables and re-run all migrations.');
      console.log('   Use --force to confirm.');
      
      if (args.includes('--force')) {
        // Drop all tables
        const tables = ['sessions', 'audit_logs', 'configs', 'users', '_migrations'];
        tables.forEach(table => {
          db.exec(`DROP TABLE IF EXISTS ${table}`);
          console.log(`   ✅ Dropped table: ${table}`);
        });
        
        // Re-run migrations
        console.log('\n🚀 Running migrations...');
        const resetResult = migrate(db);
        console.log(`\n✅ Database reset complete. Executed ${resetResult.executed} migration(s)`);
      } else {
        console.log('   ℹ️  Add --force to confirm reset');
      }
      break;
      
    case 'help':
    default:
      console.log('\n📖 Usage:');
      console.log('   node scripts/migrate.js [command] [options]');
      console.log('');
      console.log('Commands:');
      console.log('   status    Show migration status (default)');
      console.log('   up        Run all pending migrations');
      console.log('   down      Rollback last migration');
      console.log('   reset     Reset database (drops all tables)');
      console.log('   help      Show this help message');
      console.log('');
      console.log('Options:');
      console.log('   --force   Confirm destructive operations');
      console.log('   --verbose Show detailed output');
      console.log('');
      console.log('Examples:');
      console.log('   node scripts/migrate.js status');
      console.log('   node scripts/migrate.js up');
      console.log('   node scripts/migrate.js down');
      console.log('   node scripts/migrate.js reset --force');
      break;
  }
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  if (verbose) {
    console.error(error.stack);
  }
  db.close();
  process.exit(1);
}

db.close();
console.log('\n✅ Done!');
