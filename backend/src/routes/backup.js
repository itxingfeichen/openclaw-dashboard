/**
 * Backup API Routes - 数据备份与恢复 API
 * 提供手动备份、恢复、备份列表、备份计划管理功能
 * @module routes/backup
 */

import express from 'express'
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
} from '../services/backupService.js'
import { logInfo, logError } from '../utils/logger.js'

const router = express.Router()

/**
 * 统一错误处理装饰器
 * @param {Function} fn - 异步处理函数
 * @returns {Function} Express 中间件
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/**
 * POST /api/backup/create
 * 创建备份（手动备份）
 * 
 * Request Body:
 * - type: string (optional) - 备份类型：manual, pre_update
 * 
 * Response:
 * - success: boolean
 * - data: { id, filename, size, type, status, createdAt, verified }
 * - error: string (if failed)
 */
router.post(
  '/create',
  asyncHandler(async (req, res) => {
    const { type = BackupType.MANUAL } = req.body
    
    logInfo('Backup creation requested', { type })
    
    const result = await createBackup(type)
    
    if (!result.success) {
      logError('Backup creation failed', result.error)
      res.status(500).json({
        success: false,
        error: {
          message: result.error || '创建备份失败',
          type,
        },
        timestamp: new Date().toISOString(),
      })
      return
    }
    
    logInfo('Backup created successfully', result.data)
    
    res.status(201).json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/backup/list
 * 获取备份列表
 * 
 * Query Parameters:
 * - limit: number (optional, default: 50) - 返回数量限制
 * 
 * Response:
 * - success: boolean
 * - data: { backups: [...], total, backupDir }
 */
router.get(
  '/list',
  asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query
    
    logInfo('Backup list requested', { limit })
    
    const result = await getBackupList({ limit: parseInt(limit, 10) })
    
    if (!result.success) {
      logError('Failed to fetch backup list', result.error)
      res.status(500).json({
        success: false,
        error: {
          message: result.error || '获取备份列表失败',
        },
        timestamp: new Date().toISOString(),
      })
      return
    }
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * POST /api/backup/restore/:id
 * 恢复备份
 * 
 * Path Parameters:
 * - id: string - 备份 ID
 * 
 * Response:
 * - success: boolean
 * - data: { backupId, restoredAt, dbPath, preRestoreBackup }
 * - error: string (if failed)
 */
router.post(
  '/restore/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    
    logInfo('Backup restore requested', { backupId: id })
    
    const result = await restoreBackup(id)
    
    if (!result.success) {
      logError('Backup restore failed', result.error)
      
      const statusCode = result.error.includes('not found') ? 404 : 500
      
      res.status(statusCode).json({
        success: false,
        error: {
          message: result.error || '恢复备份失败',
          backupId: id,
        },
        timestamp: new Date().toISOString(),
      })
      return
    }
    
    logInfo('Backup restored successfully', result.data)
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * DELETE /api/backup/:id
 * 删除备份
 * 
 * Path Parameters:
 * - id: string - 备份 ID
 * 
 * Response:
 * - success: boolean
 * - data: { backupId, deletedAt }
 * - error: string (if failed)
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    
    logInfo('Backup deletion requested', { backupId: id })
    
    const result = await deleteBackup(id)
    
    if (!result.success) {
      logError('Backup deletion failed', result.error)
      
      const statusCode = result.error.includes('not found') ? 404 : 500
      
      res.status(statusCode).json({
        success: false,
        error: {
          message: result.error || '删除备份失败',
          backupId: id,
        },
        timestamp: new Date().toISOString(),
      })
      return
    }
    
    logInfo('Backup deleted successfully', result.data)
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/backup/schedule
 * 获取备份计划
 * 
 * Response:
 * - success: boolean
 * - data: { enabled, cron, type, retention, lastRun, nextRun }
 */
router.get(
  '/schedule',
  asyncHandler(async (req, res) => {
    logInfo('Backup schedule requested')
    
    const result = await getBackupSchedule()
    
    if (!result.success) {
      logError('Failed to fetch backup schedule', result.error)
      res.status(500).json({
        success: false,
        error: {
          message: result.error || '获取备份计划失败',
        },
        timestamp: new Date().toISOString(),
      })
      return
    }
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * PUT /api/backup/schedule
 * 更新备份计划
 * 
 * Request Body:
 * - enabled: boolean - 是否启用定时备份
 * - cron: string - cron 表达式 (e.g., "0 2 * * *")
 * - retention: number - 保留备份数量
 * 
 * Response:
 * - success: boolean
 * - data: { enabled, cron, type, retention, updatedAt }
 * - error: string (if failed)
 */
router.put(
  '/schedule',
  asyncHandler(async (req, res) => {
    const { enabled, cron, retention } = req.body
    
    logInfo('Backup schedule update requested', { enabled, cron, retention })
    
    const result = await updateBackupSchedule({ enabled, cron, retention })
    
    if (!result.success) {
      logError('Backup schedule update failed', result.error)
      res.status(400).json({
        success: false,
        error: {
          message: result.error || '更新备份计划失败',
        },
        timestamp: new Date().toISOString(),
      })
      return
    }
    
    logInfo('Backup schedule updated', result.data)
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * POST /api/backup/schedule/test
 * 测试定时备份（手动触发一次定时备份）
 * 
 * Response:
 * - success: boolean
 * - data: { id, filename, size, type, status }
 */
router.post(
  '/schedule/test',
  asyncHandler(async (req, res) => {
    logInfo('Scheduled backup test requested')
    
    const result = await executeScheduledBackup()
    
    if (!result.success) {
      logError('Scheduled backup test failed', result.error)
      res.status(500).json({
        success: false,
        error: {
          message: result.error || '定时备份测试失败',
        },
        timestamp: new Date().toISOString(),
      })
      return
    }
    
    logInfo('Scheduled backup test completed', result.data)
    
    res.status(201).json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * 全局错误处理
 */
router.use((err, req, res, next) => {
  console.error('Backup API Error:', err.message)
  logError('Backup API error', err)

  let statusCode = 500
  let message = '内部服务器错误'

  if (err.message.includes('超时') || err.message.includes('timeout')) {
    statusCode = 504
    message = '备份操作超时'
  } else if (err.message.includes('权限') || err.message.includes('permission')) {
    statusCode = 403
    message = '权限不足'
  } else if (err.message.includes('未找到') || err.message.includes('not found')) {
    statusCode = 404
    message = '备份不存在'
  } else if (err.message.includes('空间') || err.message.includes('disk')) {
    statusCode = 507
    message = '磁盘空间不足'
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      backupId: req.params?.id,
    },
    timestamp: new Date().toISOString(),
  })
})

export default router
