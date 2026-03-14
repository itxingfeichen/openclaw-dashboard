#!/usr/bin/env node

/**
 * Database Migration CLI
 * 
 * Usage:
 *   node scripts/db-migrate.js [command]
 * 
 * Commands:
 *   migrate    - Run all pending migrations
 *   rollback   - Rollback last migration
 *   rollback-to <version> - Rollback to specific version
 *   status     - Show migration status
 *   reset      - Reset database (drop all tables and re-migrate)
 *   seed       - Seed database with initial data
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDatabase, closeDatabase, initializeDatabase } from '../src/database/index.js';
import { migrate, rollback, rollbackTo, status, getAllMigrations } from '../src/database/migrations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}Error: ${message}${colors.reset}`);
}

/**
 * Show migration status
 */
async function showStatus() {
  const db = await getDatabase();
  const result = status(db);
  
  log('\n📊 Migration Status', 'cyan');
  log('─'.repeat(50));
  log(`Total migrations: ${result.total}`);
  log(`Executed: ${result.executed}`);
  log(`Pending: ${result.pending}`);
  log(`Current version: v${result.currentVersion}`);
  log(`Latest version: v${result.latestVersion}`);
  
  if (result.pendingMigrations.length > 0) {
    log('\n⏳ Pending migrations:', 'yellow');
    result.pendingMigrations.forEach(m => {
      log(`  v${m.version}: ${m.name} - ${m.description}`);
    });
  } else {
    log('\n✅ Database is up to date', 'green');
  }
  
  log('');
  await closeDatabase();
}

/**
 * Run migrations
 */
async function runMigrate() {
  const db = await getDatabase();
  
  log('\n🚀 Running migrations...', 'cyan');
  
  try {
    const result = migrate(db);
    
    if (result.executed > 0) {
      log(`\n✅ Successfully executed ${result.executed} migration(s)`, 'green');
    } else {
      log('\n✅ No pending migrations', 'green');
    }
  } catch (err) {
    error(`Migration failed: ${err.message}`);
    process.exit(1);
  }
  
  await closeDatabase();
}

/**
 * Rollback last migration
 */
async function runRollback() {
  const db = await getDatabase();
  
  log('\n↩️  Rolling back last migration...', 'cyan');
  
  try {
    const result = rollback(db);
    
    if (result.rolledBack > 0) {
      log(`\n✅ Successfully rolled back ${result.rolledBack} migration(s)`, 'green');
    } else {
      log('\n⚠️  No migrations to rollback', 'yellow');
    }
  } catch (err) {
    error(`Rollback failed: ${err.message}`);
    process.exit(1);
  }
  
  await closeDatabase();
}

/**
 * Rollback to specific version
 */
async function runRollbackTo(version) {
  if (!version || isNaN(parseInt(version))) {
    error('Please specify a valid version number');
    process.exit(1);
  }
  
  const db = await getDatabase();
  
  log(`\n↩️  Rolling back to version ${version}...`, 'cyan');
  
  try {
    const result = rollbackTo(db, parseInt(version));
    
    if (result.rolledBack > 0) {
      log(`\n✅ Successfully rolled back ${result.rolledBack} migration(s)`, 'green');
    } else {
      log('\n⚠️  No migrations to rollback', 'yellow');
    }
  } catch (err) {
    error(`Rollback failed: ${err.message}`);
    process.exit(1);
  }
  
  await closeDatabase();
}

/**
 * Reset database
 */
async function runReset() {
  log('\n⚠️  This will drop all tables and re-run migrations!', 'yellow');
  log('Are you sure? (y/N)', 'yellow');
  
  // For non-interactive use, check environment variable
  const force = process.env.FORCE_RESET === 'true';
  
  if (!force) {
    // In interactive mode, you could use readline here
    log('Set FORCE_RESET=true to skip confirmation', 'yellow');
    process.exit(1);
  }
  
  try {
    await initializeDatabase(true);
    log('\n✅ Database reset complete', 'green');
  } catch (err) {
    error(`Reset failed: ${err.message}`);
    process.exit(1);
  }
  
  await closeDatabase();
}

/**
 * Seed database with initial data
 */
async function runSeed() {
  const db = await getDatabase();
  
  log('\n🌱 Seeding database...', 'cyan');
  
  try {
    // Import and run seed function
    const { seedDatabase } = await import('./seed-database.js');
    await seedDatabase(db);
    log('\n✅ Database seeded successfully', 'green');
  } catch (err) {
    error(`Seeding failed: ${err.message}`);
    process.exit(1);
  }
  
  await closeDatabase();
}

/**
 * Show help
 */
function showHelp() {
  log(`
📦 Database Migration CLI

Usage: node scripts/db-migrate.js [command]

Commands:
  migrate         Run all pending migrations
  rollback        Rollback last migration
  rollback-to <v> Rollback to specific version
  status          Show migration status
  reset           Reset database (drop all + re-migrate)
  seed            Seed database with initial data
  help            Show this help message

Environment Variables:
  DB_PATH         SQLite database path (default: ./data/openclaw.db)
  DB_TYPE         Database type: sqlite or postgresql
  FORCE_RESET     Skip confirmation for reset (true/false)

Examples:
  node scripts/db-migrate.js status
  node scripts/db-migrate.js migrate
  node scripts/db-migrate.js rollback-to 5
  FORCE_RESET=true node scripts/db-migrate.js reset
`);
}

/**
 * Main entry point
 */
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'status':
      await showStatus();
      break;
    case 'migrate':
      await runMigrate();
      break;
    case 'rollback':
      await runRollback();
      break;
    case 'rollback-to':
      await runRollbackTo(arg);
      break;
    case 'reset':
      await runReset();
      break;
    case 'seed':
      await runSeed();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      if (command) {
        error(`Unknown command: ${command}`);
      }
      showHelp();
      process.exit(command ? 1 : 0);
  }
}

// Run main function
main().catch(err => {
  error(err.message);
  process.exit(1);
});
