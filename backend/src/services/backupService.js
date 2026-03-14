/**
 * Backup Service - 数据备份与恢复服务
 * 支持数据库备份、配置文件备份、压缩存储、定时备份、备份验证
 * @module services/backupService
 */

import { getDatabase, closeDatabase } from '../database/index.js'
import { logInfo, logError, createLogger } from '../utils/logger.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  createReadStream,
  createWriteStream,
  unlinkSync,
  writeFileSync,
  readFileSync,
} from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { createGzip, createGunzip } from 'zlib'
import { pipeline } from 'stream'

const __dirname = dirname(fileURLToPath(import.meta.url))
const execAsync = promisify(exec)

const logger = createLogger('backupService')

// 备份目录配置
const BACKUP_CONFIG = {
  backupDir: process.env.BACKUP_DIR || join(__dirname, '../../backups'),
  dbPath: process.env.DB_PATH || join(__dirname, '../../data/openclaw.db'),
  configDir: process.env.CONFIG_DIR || join(__dirname, '../../'),
  maxBackups: parseInt(process.env.MAX_BACKUPS || '10'),
  compressionLevel: parseInt(process.env.COMPRESSION_LEVEL || '6'),
}

// 备份类型枚举
export const BackupType = {
  MANUAL: 'manual',
  SCHEDULED: 'scheduled',
  PRE_UPDATE: 'pre_update',
}

// 备份状态枚举
export const BackupStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RESTORED: 'restored',
}

/**
 * 确保备份目录存在
 */
function ensureBackupDirectory() {
  if (!existsSync(BACKUP_CONFIG.backupDir)) {
    mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true })
    logger.info('Created backup directory', { path: BACKUP_CONFIG.backupDir })
  }
}

/**
 * 生成备份文件名
 * @param {string} type - 备份类型
 * @returns {string} 备份文件名
 */
function generateBackupFilename(type = BackupType.MANUAL) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `backup-${type}-${timestamp}.sqlite.gz`
}

/**
 * 获取备份文件路径
 * @param {string} filename - 文件名
 * @returns {string} 完整路径
 */
function getBackupFilePath(filename) {
  return join(BACKUP_CONFIG.backupDir, filename)
}

/**
 * 提取备份 ID（从文件名）
 * @param {string} filename - 文件名
 * @returns {string} 备份 ID
 */
function extractBackupId(filename) {
  // 格式：backup-{type}-{timestamp}.sqlite.gz
  const match = filename.match(/backup-([a-z]+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.sqlite\.gz/)
  if (match) {
    return `${match[1]}-${match[2]}`
  }
  return filename.replace('.sqlite.gz', '')
}

/**
 * 验证备份文件完整性
 * @param {string} filePath - 备份文件路径
 * @returns {Promise<Object>} 验证结果
 */
async function verifyBackup(filePath) {
  try {
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return { valid: false, error: 'File not found' }
    }

    // 检查文件大小
    const stats = statSync(filePath)
    if (stats.size < 1024) {
      return { valid: false, error: 'File too small, may be corrupted' }
    }

    // 尝试解压并验证 SQLite 头
    return new Promise((resolve) => {
      const chunks = []
      const gunzip = createGunzip()
      const stream = createReadStream(filePath)

      stream.pipe(gunzip)

      gunzip.on('data', (chunk) => {
        chunks.push(chunk)
        // 只读取前 100 字节来验证 SQLite 头
        if (chunks.reduce((acc, c) => acc + c.length, 0) >= 100) {
          gunzip.destroy()
          stream.destroy()
        }
      })

      gunzip.on('end', () => {
        const header = Buffer.concat(chunks).slice(0, 16).toString('utf8')
        // SQLite 文件头：SQLite format 3\0
        if (header.startsWith('SQLite format 3')) {
          resolve({ valid: true, size: stats.size })
        } else {
          resolve({ valid: false, error: 'Invalid SQLite header' })
        }
      })

      gunzip.on('error', (error) => {
        resolve({ valid: false, error: error.message })
      })

      // 5 秒超时
      setTimeout(() => {
        resolve({ valid: false, error: 'Verification timeout' })
      }, 5000)
    })
  } catch (error) {
    logger.error('Backup verification failed', error)
    return { valid: false, error: error.message }
  }
}

/**
 * 创建数据库备份
 * @param {string} type - 备份类型
 * @returns {Promise<Object>} 备份结果
 */
async function createDatabaseBackup(type = BackupType.MANUAL) {
  const filename = generateBackupFilename(type)
  const backupPath = getBackupFilePath(filename)
  
  logger.info('Starting database backup', { type, filename })

  try {
    // 确保备份目录存在
    ensureBackupDirectory()

    // 关闭现有数据库连接以确保一致性
    await closeDatabase()

    // 使用 SQLite 的 backup 命令或复制文件
    // 方法 1: 使用 sqlite3 .backup 命令（推荐）
    // 方法 2: 直接复制文件（简单但可能不一致）
    
    // 这里使用直接复制 + 压缩的方式
    const dbPath = BACKUP_CONFIG.dbPath
    
    if (!existsSync(dbPath)) {
      throw new Error(`Database file not found: ${dbPath}`)
    }

    // 复制并压缩
    await new Promise((resolve, reject) => {
      const readStream = createReadStream(dbPath)
      const gzip = createGzip({ level: BACKUP_CONFIG.compressionLevel })
      const writeStream = createWriteStream(backupPath)

      pipeline(readStream, gzip, writeStream, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })

    // 验证备份
    const verification = await verifyBackup(backupPath)
    if (!verification.valid) {
      throw new Error(`Backup verification failed: ${verification.error}`)
    }

    const stats = statSync(backupPath)
    
    logger.info('Database backup completed', {
      filename,
      path: backupPath,
      size: stats.size,
      type,
    })

    return {
      success: true,
      data: {
        id: extractBackupId(filename),
        filename,
        path: backupPath,
        size: stats.size,
        type,
        status: BackupStatus.COMPLETED,
        createdAt: new Date().toISOString(),
        verified: true,
      },
    }
  } catch (error) {
    logger.error('Database backup failed', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 备份配置文件
 * @param {string} backupId - 备份 ID
 * @returns {Promise<Object>} 备份结果
 */
async function createConfigBackup(backupId) {
  const configFiles = [
    '.env',
    'package.json',
    'tsconfig.json',
  ]
  
  const configBackupDir = join(BACKUP_CONFIG.backupDir, backupId, 'configs')
  
  try {
    mkdirSync(configBackupDir, { recursive: true })
    
    const backedUpFiles = []
    
    for (const file of configFiles) {
      const srcPath = join(BACKUP_CONFIG.configDir, file)
      const destPath = join(configBackupDir, file)
      
      if (existsSync(srcPath)) {
        const content = readFileSync(srcPath)
        writeFileSync(destPath, content)
        backedUpFiles.push(file)
        logger.debug(`Backed up config file: ${file}`)
      }
    }
    
    return {
      success: true,
      data: {
        files: backedUpFiles,
        path: configBackupDir,
      },
    }
  } catch (error) {
    logger.error('Config backup failed', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 获取备份列表
 * @param {Object} options - 选项
 * @param {number} options.limit - 返回数量限制
 * @returns {Promise<Object>} 备份列表
 */
export async function getBackupList(options = {}) {
  const { limit = 50 } = options
  
  logger.info('Fetching backup list', { limit })
  
  try {
    ensureBackupDirectory()
    
    const files = readdirSync(BACKUP_CONFIG.backupDir)
      .filter(file => file.endsWith('.sqlite.gz'))
      .sort()
      .reverse()
      .slice(0, limit)
    
    const backups = []
    
    for (const file of files) {
      const filePath = getBackupFilePath(file)
      const stats = statSync(filePath)
      const verification = await verifyBackup(filePath)
      
      backups.push({
        id: extractBackupId(file),
        filename: file,
        path: filePath,
        size: stats.size,
        createdAt: stats.mtime.toISOString(),
        status: BackupStatus.COMPLETED,
        verified: verification.valid,
        type: file.split('-')[1] || BackupType.MANUAL,
      })
    }
    
    logger.info(`Retrieved ${backups.length} backups`)
    
    return {
      success: true,
      data: {
        backups,
        total: backups.length,
        backupDir: BACKUP_CONFIG.backupDir,
      },
    }
  } catch (error) {
    logger.error('Failed to fetch backup list', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 创建备份（数据库 + 配置）
 * @param {string} type - 备份类型
 * @returns {Promise<Object>} 备份结果
 */
export async function createBackup(type = BackupType.MANUAL) {
  logger.info('Creating backup', { type })
  
  try {
    // 1. 创建数据库备份
    const dbBackupResult = await createDatabaseBackup(type)
    
    if (!dbBackupResult.success) {
      return dbBackupResult
    }
    
    // 2. 创建配置文件备份
    const backupId = dbBackupResult.data.id
    const configBackupResult = await createConfigBackup(backupId)
    
    // 3. 清理旧备份（保留最近的 maxBackups 个）
    await cleanupOldBackups()
    
    logger.info('Backup created successfully', {
      backupId,
      dbSize: dbBackupResult.data.size,
      configFiles: configBackupResult.data?.files?.length || 0,
    })
    
    return {
      success: true,
      data: {
        ...dbBackupResult.data,
        configBackup: configBackupResult.success,
      },
    }
  } catch (error) {
    logger.error('Backup creation failed', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 恢复备份
 * @param {string} backupId - 备份 ID
 * @returns {Promise<Object>} 恢复结果
 */
export async function restoreBackup(backupId) {
  logger.info('Restoring backup', { backupId })
  
  try {
    // 查找备份文件
    const listResult = await getBackupList({ limit: 100 })
    
    if (!listResult.success) {
      return listResult
    }
    
    const backup = listResult.data.backups.find(b => b.id === backupId)
    
    if (!backup) {
      return {
        success: false,
        error: `Backup not found: ${backupId}`,
      }
    }
    
    // 验证备份
    const verification = await verifyBackup(backup.path)
    if (!verification.valid) {
      return {
        success: false,
        error: `Backup verification failed: ${verification.error}`,
      }
    }
    
    // 关闭现有数据库连接
    await closeDatabase()
    
    // 备份当前数据库（以防恢复失败）
    const preRestoreBackup = await createDatabaseBackup('pre_restore')
    if (!preRestoreBackup.success) {
      logger.warn('Pre-restore backup failed, continuing anyway')
    }
    
    // 解压并恢复数据库
    const dbPath = BACKUP_CONFIG.dbPath
    
    await new Promise((resolve, reject) => {
      const readStream = createReadStream(backup.path)
      const gunzip = createGunzip()
      const writeStream = createWriteStream(dbPath)
      
      pipeline(readStream, gunzip, writeStream, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
    
    // 验证恢复后的数据库
    const db = await getDatabase()
    const result = db.prepare('SELECT 1').get()
    
    if (!result) {
      throw new Error('Database verification failed after restore')
    }
    
    logger.info('Backup restored successfully', {
      backupId,
      dbPath,
    })
    
    return {
      success: true,
      data: {
        backupId,
        restoredAt: new Date().toISOString(),
        dbPath,
        preRestoreBackup: preRestoreBackup.success ? preRestoreBackup.data.id : null,
      },
    }
  } catch (error) {
    logger.error('Backup restore failed', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 删除备份
 * @param {string} backupId - 备份 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteBackup(backupId) {
  logger.info('Deleting backup', { backupId })
  
  try {
    const listResult = await getBackupList({ limit: 100 })
    
    if (!listResult.success) {
      return listResult
    }
    
    const backup = listResult.data.backups.find(b => b.id === backupId)
    
    if (!backup) {
      return {
        success: false,
        error: `Backup not found: ${backupId}`,
      }
    }
    
    // 删除备份文件
    if (existsSync(backup.path)) {
      unlinkSync(backup.path)
    }
    
    // 删除相关配置备份
    const configBackupDir = join(BACKUP_CONFIG.backupDir, backupId, 'configs')
    if (existsSync(configBackupDir)) {
      const files = readdirSync(configBackupDir)
      for (const file of files) {
        unlinkSync(join(configBackupDir, file))
      }
      // 递归删除目录
      const parentDir = join(BACKUP_CONFIG.backupDir, backupId)
      if (existsSync(parentDir)) {
        const parentFiles = readdirSync(parentDir)
        if (parentFiles.length === 0) {
          // 简单删除空目录，不递归处理嵌套
          try {
            const { execSync } = await import('child_process')
            execSync(`rm -rf ${parentDir}`)
          } catch (e) {
            logger.warn('Failed to delete config backup directory', e)
          }
        }
      }
    }
    
    logger.info('Backup deleted successfully', { backupId })
    
    return {
      success: true,
      data: {
        backupId,
        deletedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    logger.error('Backup deletion failed', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 清理旧备份
 * @returns {Promise<void>}
 */
async function cleanupOldBackups() {
  try {
    const listResult = await getBackupList({ limit: 1000 })
    
    if (!listResult.success) {
      return
    }
    
    const backups = listResult.data.backups
    
    if (backups.length > BACKUP_CONFIG.maxBackups) {
      const toDelete = backups.slice(BACKUP_CONFIG.maxBackups)
      
      for (const backup of toDelete) {
        await deleteBackup(backup.id)
        logger.info('Cleaned up old backup', { backupId: backup.id })
      }
      
      logger.info(`Cleaned up ${toDelete.length} old backups`)
    }
  } catch (error) {
    logger.error('Backup cleanup failed', error)
  }
}

/**
 * 获取备份计划
 * @returns {Promise<Object>} 备份计划
 */
export async function getBackupSchedule() {
  const scheduleFile = join(BACKUP_CONFIG.backupDir, 'schedule.json')
  
  try {
    if (existsSync(scheduleFile)) {
      const schedule = JSON.parse(readFileSync(scheduleFile, 'utf8'))
      return {
        success: true,
        data: schedule,
      }
    } else {
      // 默认计划
      const defaultSchedule = {
        enabled: false,
        cron: '0 2 * * *', // 每天凌晨 2 点
        type: BackupType.SCHEDULED,
        retention: BACKUP_CONFIG.maxBackups,
        lastRun: null,
        nextRun: null,
      }
      
      return {
        success: true,
        data: defaultSchedule,
      }
    }
  } catch (error) {
    logger.error('Failed to get backup schedule', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 更新备份计划
 * @param {Object} schedule - 备份计划
 * @returns {Promise<Object>} 更新结果
 */
export async function updateBackupSchedule(schedule) {
  const scheduleFile = join(BACKUP_CONFIG.backupDir, 'schedule.json')
  
  logger.info('Updating backup schedule', schedule)
  
  try {
    ensureBackupDirectory()
    
    // 验证 cron 表达式（简单验证）
    if (schedule.cron && !isValidCron(schedule.cron)) {
      return {
        success: false,
        error: 'Invalid cron expression',
      }
    }
    
    const updatedSchedule = {
      enabled: schedule.enabled !== undefined ? schedule.enabled : false,
      cron: schedule.cron || '0 2 * * *',
      type: schedule.type || BackupType.SCHEDULED,
      retention: schedule.retention || BACKUP_CONFIG.maxBackups,
      lastRun: schedule.lastRun || null,
      nextRun: schedule.nextRun || null,
      updatedAt: new Date().toISOString(),
    }
    
    writeFileSync(scheduleFile, JSON.stringify(updatedSchedule, null, 2))
    
    logger.info('Backup schedule updated', updatedSchedule)
    
    return {
      success: true,
      data: updatedSchedule,
    }
  } catch (error) {
    logger.error('Failed to update backup schedule', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 验证 cron 表达式（简单验证）
 * @param {string} cron - cron 表达式
 * @returns {boolean} 是否有效
 */
function isValidCron(cron) {
  // 简单验证：5 个部分，每个部分是数字、* 或 */N
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return false
  
  const cronPattern = /^(\*|\/?\d+(-\d+)?(,\d+(-\d+)?)*)$/
  return parts.every(part => cronPattern.test(part))
}

/**
 * 执行定时备份
 * @returns {Promise<Object>} 备份结果
 */
export async function executeScheduledBackup() {
  logger.info('Executing scheduled backup')
  
  const result = await createBackup(BackupType.SCHEDULED)
  
  if (result.success) {
    // 更新最后执行时间
    const scheduleResult = await getBackupSchedule()
    if (scheduleResult.success) {
      const schedule = scheduleResult.data
      schedule.lastRun = new Date().toISOString()
      await updateBackupSchedule(schedule)
    }
  }
  
  return result
}

export default {
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
}
