/**
 * Backup Service Unit Tests
 * Tests for backup creation, restoration, listing, and scheduling
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import {
  createBackup,
  getBackupList,
  restoreBackup,
  deleteBackup,
  getBackupSchedule,
  updateBackupSchedule,
  executeScheduledBackup,
  BackupType,
  BackupStatus,
  BACKUP_CONFIG,
} from '../src/services/backupService.js'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getDatabase, closeDatabase, initializeDatabase } from '../src/database/index.js'

// Test backup directory
const TEST_BACKUP_DIR = join(process.cwd(), 'test-backups')
const TEST_DB_PATH = join(process.cwd(), 'test-data', 'test-backup.db')

describe('BackupService', () => {
  // Setup test environment
  before(async () => {
    // Create test directories
    if (!existsSync(TEST_BACKUP_DIR)) {
      mkdirSync(TEST_BACKUP_DIR, { recursive: true })
    }
    
    const testDbDir = join(TEST_DB_PATH, '..')
    if (!existsSync(testDbDir)) {
      mkdirSync(testDbDir, { recursive: true })
    }
    
    // Override backup config for testing
    BACKUP_CONFIG.backupDir = TEST_BACKUP_DIR
    BACKUP_CONFIG.dbPath = TEST_DB_PATH
    BACKUP_CONFIG.maxBackups = 3
    BACKUP_CONFIG.configDir = process.cwd()
    
    // Initialize test database
    process.env.DB_PATH = TEST_DB_PATH
    await initializeDatabase(true)
  })

  // Cleanup after tests
  after(async () => {
    // Close database
    await closeDatabase()
    
    // Clean test files
    try {
      if (existsSync(TEST_BACKUP_DIR)) {
        rmSync(TEST_BACKUP_DIR, { recursive: true, force: true })
      }
      if (existsSync(TEST_DB_PATH)) {
        rmSync(TEST_DB_PATH, { force: true })
      }
      const testDbDir = join(TEST_DB_PATH, '..')
      if (existsSync(testDbDir)) {
        rmSync(testDbDir, { recursive: true, force: true })
      }
    } catch (error) {
      console.warn('Cleanup error:', error.message)
    }
  })

  describe('BackupType and BackupStatus', () => {
    it('should have correct backup types', () => {
      assert.strictEqual(BackupType.MANUAL, 'manual')
      assert.strictEqual(BackupType.SCHEDULED, 'scheduled')
      assert.strictEqual(BackupType.PRE_UPDATE, 'pre_update')
    })

    it('should have correct backup statuses', () => {
      assert.strictEqual(BackupStatus.PENDING, 'pending')
      assert.strictEqual(BackupStatus.IN_PROGRESS, 'in_progress')
      assert.strictEqual(BackupStatus.COMPLETED, 'completed')
      assert.strictEqual(BackupStatus.FAILED, 'failed')
      assert.strictEqual(BackupStatus.RESTORED, 'restored')
    })
  })

  describe('createBackup', () => {
    it('should create a manual backup successfully', async () => {
      const result = await createBackup(BackupType.MANUAL)
      
      assert.strictEqual(result.success, true)
      assert.ok(result.data)
      assert.ok(result.data.id)
      assert.ok(result.data.filename.includes('backup-manual-'))
      assert.ok(result.data.filename.endsWith('.sqlite.gz'))
      assert.strictEqual(result.data.type, BackupType.MANUAL)
      assert.strictEqual(result.data.status, BackupStatus.COMPLETED)
      assert.strictEqual(result.data.verified, true)
      assert.ok(result.data.size > 0)
    })

    it('should create a scheduled backup successfully', async () => {
      const result = await createBackup(BackupType.SCHEDULED)
      
      assert.strictEqual(result.success, true)
      assert.ok(result.data.filename.includes('backup-scheduled-'))
      assert.strictEqual(result.data.type, BackupType.SCHEDULED)
    })

    it('should include config backup', async () => {
      const result = await createBackup(BackupType.MANUAL)
      
      assert.strictEqual(result.success, true)
      assert.ok(result.data.configBackup !== undefined)
    })
  })

  describe('getBackupList', () => {
    it('should return empty list when no backups exist', async () => {
      const result = await getBackupList()
      
      assert.strictEqual(result.success, true)
      assert.deepStrictEqual(result.data.backups, [])
      assert.strictEqual(result.data.total, 0)
    })

    it('should return list of backups after creation', async () => {
      // Create multiple backups
      await createBackup(BackupType.MANUAL)
      await createBackup(BackupType.SCHEDULED)
      
      const result = await getBackupList()
      
      assert.strictEqual(result.success, true)
      assert.strictEqual(result.data.backups.length, 2)
      assert.strictEqual(result.data.total, 2)
      assert.strictEqual(result.data.backupDir, TEST_BACKUP_DIR)
    })

    it('should respect limit parameter', async () => {
      // Create 5 backups
      for (let i = 0; i < 5; i++) {
        await createBackup(BackupType.MANUAL)
      }
      
      const result = await getBackupList({ limit: 3 })
      
      assert.strictEqual(result.success, true)
      assert.ok(result.data.backups.length <= 3)
    })

    it('should include verification status for each backup', async () => {
      await createBackup(BackupType.MANUAL)
      
      const result = await getBackupList()
      
      assert.ok('verified' in result.data.backups[0])
      assert.ok('size' in result.data.backups[0])
      assert.ok('createdAt' in result.data.backups[0])
    })
  })

  describe('restoreBackup', () => {
    it('should restore backup successfully', async () => {
      // Create a backup first
      const createResult = await createBackup(BackupType.MANUAL)
      assert.strictEqual(createResult.success, true)
      
      const backupId = createResult.data.id
      
      // Restore the backup
      const restoreResult = await restoreBackup(backupId)
      
      assert.strictEqual(restoreResult.success, true)
      assert.strictEqual(restoreResult.data.backupId, backupId)
      assert.ok(restoreResult.data.restoredAt)
      assert.strictEqual(restoreResult.data.dbPath, TEST_DB_PATH)
      assert.ok(restoreResult.data.preRestoreBackup)
    })

    it('should fail to restore non-existent backup', async () => {
      const result = await restoreBackup('nonexistent-backup-id')
      
      assert.strictEqual(result.success, false)
      assert.ok(result.error.includes('not found'))
    })

    it('should create pre-restore backup before restoring', async () => {
      const createResult = await createBackup(BackupType.MANUAL)
      const backupId = createResult.data.id
      
      const restoreResult = await restoreBackup(backupId)
      
      assert.strictEqual(restoreResult.success, true)
      assert.ok(restoreResult.data.preRestoreBackup)
    })
  })

  describe('deleteBackup', () => {
    it('should delete backup successfully', async () => {
      // Create a backup first
      const createResult = await createBackup(BackupType.MANUAL)
      assert.strictEqual(createResult.success, true)
      
      const backupId = createResult.data.id
      
      // Delete the backup
      const deleteResult = await deleteBackup(backupId)
      
      assert.strictEqual(deleteResult.success, true)
      assert.strictEqual(deleteResult.data.backupId, backupId)
      assert.ok(deleteResult.data.deletedAt)
      
      // Verify backup is deleted
      const listResult = await getBackupList()
      const remainingBackups = listResult.data.backups.filter(b => b.id === backupId)
      assert.strictEqual(remainingBackups.length, 0)
    })

    it('should fail to delete non-existent backup', async () => {
      const result = await deleteBackup('nonexistent-backup-id')
      
      assert.strictEqual(result.success, false)
      assert.ok(result.error.includes('not found'))
    })

    it('should cleanup old backups when max is exceeded', async () => {
      // Create 5 backups (max is 3)
      const backupIds = []
      for (let i = 0; i < 5; i++) {
        const result = await createBackup(BackupType.MANUAL)
        if (result.success) {
          backupIds.push(result.data.id)
        }
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const listResult = await getBackupList({ limit: 10 })
      
      // Should only keep maxBackups (3)
      assert.ok(listResult.data.backups.length <= 3)
    })
  })

  describe('getBackupSchedule', () => {
    it('should return default schedule when none exists', async () => {
      const result = await getBackupSchedule()
      
      assert.strictEqual(result.success, true)
      assert.ok(result.data)
      assert.strictEqual(result.data.enabled, false)
      assert.strictEqual(result.data.cron, '0 2 * * *')
      assert.strictEqual(result.data.retention, BACKUP_CONFIG.maxBackups)
    })

    it('should return saved schedule', async () => {
      const schedule = {
        enabled: true,
        cron: '0 3 * * *',
        retention: 5,
      }
      
      await updateBackupSchedule(schedule)
      const result = await getBackupSchedule()
      
      assert.strictEqual(result.success, true)
      assert.strictEqual(result.data.enabled, true)
      assert.strictEqual(result.data.cron, '0 3 * * *')
      assert.strictEqual(result.data.retention, 5)
    })
  })

  describe('updateBackupSchedule', () => {
    it('should update schedule successfully', async () => {
      const schedule = {
        enabled: true,
        cron: '0 */6 * * *', // Every 6 hours
        retention: 7,
      }
      
      const result = await updateBackupSchedule(schedule)
      
      assert.strictEqual(result.success, true)
      assert.strictEqual(result.data.enabled, true)
      assert.strictEqual(result.data.cron, '0 */6 * * *')
      assert.strictEqual(result.data.retention, 7)
      assert.ok(result.data.updatedAt)
    })

    it('should use default values for missing fields', async () => {
      const result = await updateBackupSchedule({})
      
      assert.strictEqual(result.success, true)
      assert.strictEqual(result.data.enabled, false)
      assert.strictEqual(result.data.cron, '0 2 * * *')
      assert.strictEqual(result.data.retention, BACKUP_CONFIG.maxBackups)
    })

    it('should reject invalid cron expression', async () => {
      const result = await updateBackupSchedule({
        cron: 'invalid cron',
      })
      
      assert.strictEqual(result.success, false)
      assert.ok(result.error.includes('Invalid cron'))
    })
  })

  describe('executeScheduledBackup', () => {
    it('should execute scheduled backup successfully', async () => {
      const result = await executeScheduledBackup()
      
      assert.strictEqual(result.success, true)
      assert.strictEqual(result.data.type, BackupType.SCHEDULED)
      assert.strictEqual(result.data.status, BackupStatus.COMPLETED)
    })

    it('should update lastRun timestamp in schedule', async () => {
      await executeScheduledBackup()
      
      const scheduleResult = await getBackupSchedule()
      
      assert.strictEqual(scheduleResult.success, true)
      assert.ok(scheduleResult.data.lastRun)
    })
  })
})

describe('BackupService Error Handling', () => {
  before(async () => {
    if (!existsSync(TEST_BACKUP_DIR)) {
      mkdirSync(TEST_BACKUP_DIR, { recursive: true })
    }
    
    BACKUP_CONFIG.backupDir = TEST_BACKUP_DIR
    BACKUP_CONFIG.dbPath = TEST_DB_PATH
    BACKUP_CONFIG.maxBackups = 3
  })

  after(async () => {
    await closeDatabase()
    try {
      if (existsSync(TEST_BACKUP_DIR)) {
        rmSync(TEST_BACKUP_DIR, { recursive: true, force: true })
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  it('should handle concurrent backup requests gracefully', async () => {
    // Try to create multiple backups concurrently
    const promises = Array(3).fill(null).map(() => createBackup(BackupType.MANUAL))
    const results = await Promise.all(promises)
    
    // At least some should succeed
    const successCount = results.filter(r => r.success).length
    assert.ok(successCount > 0)
  })
})
