/**
 * Task API Routes
 * 提供任务列表、状态管理、任务详情查看功能
 * @module routes/tasks
 */

import express from 'express'
import {
  getTasks,
  getTaskById,
  getTaskStats,
} from '../services/taskService.js'
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
 * 验证分页参数
 * @param {Object} params - 参数对象
 * @returns {Object} 验证后的参数
 */
function validatePaginationParams(params) {
  const { page, limit } = params
  const validated = {}

  if (page !== undefined) {
    const pageNum = parseInt(page, 10)
    if (isNaN(pageNum) || pageNum < 1) {
      const error = new Error('Page must be a positive integer')
      error.code = 'INVALID_PAGE'
      throw error
    }
    validated.page = pageNum
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 500) {
      const error = new Error('Limit must be between 1 and 500')
      error.code = 'INVALID_LIMIT'
      throw error
    }
    validated.limit = limitNum
  }

  return validated
}

/**
 * 验证状态参数
 * @param {string} status - 状态字符串
 * @returns {boolean} 是否有效
 */
function isValidStatus(status) {
  if (!status) return true
  const validStatuses = ['running', 'done', 'failed']
  return validStatuses.includes(status.toLowerCase())
}

/**
 * GET /api/tasks
 * 获取任务列表（支持分页、状态过滤、Agent 过滤）
 * Query Parameters:
 * - page: 页码（默认 1）
 * - limit: 每页数量（默认 20，最大 500）
 * - status: 状态过滤（running/done/failed）
 * - agent: Agent ID 过滤
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, status, agent } = req.query

    logInfo('Fetching task list', { page, limit, status, agent })

    // 验证分页参数
    const pagination = validatePaginationParams({ page, limit })

    // 验证状态参数
    if (status && !isValidStatus(status)) {
      const error = new Error(`Invalid status: ${status}. Valid statuses: running, done, failed`)
      error.code = 'INVALID_STATUS'
      throw error
    }

    // 获取任务列表
    const result = await getTasks({
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      status,
      agent,
    })

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/tasks/stats
 * 获取任务统计信息
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    logInfo('Fetching task statistics')

    const stats = await getTaskStats()

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/tasks/:id
 * 获取任务详情
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    logInfo('Fetching task details', { taskId: id })

    const task = await getTaskById(id)

    res.json({
      success: true,
      data: task,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * 全局错误处理
 */
router.use((err, req, res, next) => {
  logError('Tasks API Error', err)

  let statusCode = 500
  let message = 'Internal server error'

  // 根据错误类型设置状态码
  switch (err.code) {
    case 'TASK_NOT_FOUND':
      statusCode = 404
      message = err.message || 'Task not found'
      break
    case 'INVALID_PAGE':
    case 'INVALID_LIMIT':
      statusCode = 400
      message = err.message || 'Invalid pagination parameters'
      break
    case 'INVALID_STATUS':
      statusCode = 400
      message = err.message || 'Invalid status parameter'
      break
    case 'TASK_ID_REQUIRED':
      statusCode = 400
      message = err.message || 'Task ID is required'
      break
    case 'CLI_UNAVAILABLE':
      statusCode = 503
      message = 'OpenClaw CLI unavailable'
      break
    default:
      // 保持 500
      message = err.message || message
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'UNKNOWN_ERROR',
      message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      taskId: req.params?.id,
    },
    timestamp: new Date().toISOString(),
  })
})

export default router
