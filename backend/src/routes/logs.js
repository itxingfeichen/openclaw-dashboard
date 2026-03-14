/**
 * Log API Routes
 * 提供日志查看、搜索、过滤功能
 * @module routes/logs
 */

import express from 'express'
import {
  getLogSources,
  readLogs,
  searchLogs,
  getLogStats,
} from '../services/logService.js'
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
 * 验证日志级别
 * @param {string} level - 日志级别
 * @returns {boolean} 是否有效
 */
function isValidLogLevel(level) {
  if (!level) return true
  const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR']
  return validLevels.includes(level.toUpperCase())
}

/**
 * GET /api/logs/sources
 * 获取可用日志源列表
 */
router.get(
  '/sources',
  asyncHandler(async (req, res) => {
    logInfo('Fetching log sources')
    
    const sources = getLogSources()
    const sourceList = Object.entries(sources).map(([key, config]) => ({
      id: key,
      name: config.name,
      path: config.path,
      description: config.description,
    }))

    res.json({
      success: true,
      data: {
        sources: sourceList,
        total: sourceList.length,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/logs/:source
 * 读取日志内容（支持分页、过滤）
 * Query Parameters:
 * - page: 页码（默认 1）
 * - limit: 每页数量（默认 50，最大 500）
 * - level: 日志级别过滤（DEBUG/INFO/WARN/ERROR）
 * - from: 起始时间（ISO 8601 格式）
 * - to: 结束时间（ISO 8601 格式）
 */
router.get(
  '/:source',
  asyncHandler(async (req, res) => {
    const { source } = req.params
    const { page, limit, level, from, to } = req.query

    logInfo('Reading logs', { source, page, limit, level, from, to })

    // 验证参数
    const pagination = validatePaginationParams({ page, limit })
    
    if (level && !isValidLogLevel(level)) {
      const error = new Error(`Invalid log level: ${level}. Valid levels: DEBUG, INFO, WARN, ERROR`)
      error.code = 'INVALID_LOG_LEVEL'
      throw error
    }

    // 验证时间格式
    if (from) {
      const fromDate = new Date(from)
      if (isNaN(fromDate.getTime())) {
        const error = new Error('Invalid "from" date format. Use ISO 8601 format.')
        error.code = 'INVALID_DATE_FORMAT'
        throw error
      }
    }

    if (to) {
      const toDate = new Date(to)
      if (isNaN(toDate.getTime())) {
        const error = new Error('Invalid "to" date format. Use ISO 8601 format.')
        error.code = 'INVALID_DATE_FORMAT'
        throw error
      }
    }

    if (from && to) {
      const fromDate = new Date(from)
      const toDate = new Date(to)
      if (fromDate > toDate) {
        const error = new Error('"from" date must be before "to" date')
        error.code = 'INVALID_DATE_RANGE'
        throw error
      }
    }

    // 读取日志
    const result = await readLogs(source, {
      page: pagination.page || 1,
      limit: pagination.limit || 50,
      level: level?.toUpperCase(),
      from,
      to,
    })

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/logs/:source/stats
 * 获取日志统计信息
 */
router.get(
  '/:source/stats',
  asyncHandler(async (req, res) => {
    const { source } = req.params

    logInfo('Getting log stats', { source })

    const stats = await getLogStats(source)

    res.json({
      success: true,
      data: {
        source,
        stats,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/logs/:source/search
 * 关键词搜索日志
 * Query Parameters:
 * - q: 搜索关键词（必需）
 * - page: 页码（默认 1）
 * - limit: 每页数量（默认 50，最大 500）
 */
router.get(
  '/:source/search',
  asyncHandler(async (req, res) => {
    const { source } = req.params
    const { q, page, limit } = req.query

    logInfo('Searching logs', { source, query: q, page, limit })

    if (!q || !q.trim()) {
      const error = new Error('Search query "q" is required')
      error.code = 'SEARCH_QUERY_REQUIRED'
      throw error
    }

    // 验证参数
    const pagination = validatePaginationParams({ page, limit })

    // 搜索日志
    const result = await searchLogs(source, q.trim(), {
      page: pagination.page || 1,
      limit: pagination.limit || 50,
    })

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * 全局错误处理
 */
router.use((err, req, res, next) => {
  logError('Logs API Error', err)

  let statusCode = 500
  let message = 'Internal server error'

  // 根据错误类型设置状态码
  switch (err.code) {
    case 'LOG_SOURCE_NOT_FOUND':
      statusCode = 404
      message = err.message || 'Log source not found'
      break
    case 'INVALID_PAGE':
    case 'INVALID_LIMIT':
    case 'INVALID_LOG_LEVEL':
    case 'INVALID_DATE_FORMAT':
    case 'INVALID_DATE_RANGE':
    case 'SEARCH_QUERY_REQUIRED':
      statusCode = 400
      message = err.message || 'Invalid request parameters'
      break
    case 'ENOENT':
      statusCode = 404
      message = 'Log file not found'
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
      source: req.params?.source,
    },
    timestamp: new Date().toISOString(),
  })
})

export default router
