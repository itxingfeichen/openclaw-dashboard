/**
 * Export API Routes
 * 数据导出 API 路由，支持多格式导出、自定义字段、批量导出
 * 
 * Endpoints:
 * - POST /api/export/agents - 导出 Agent 数据
 * - POST /api/export/tasks - 导出任务数据
 * - POST /api/export/logs - 导出日志数据
 * - POST /api/export/config - 导出配置数据
 * - GET /api/export/download/:id - 下载导出文件
 * - GET /api/export/history - 导出历史
 * - DELETE /api/export/:id - 删除导出文件
 */

import express from 'express'
import {
  ExportFormat,
  ExportType,
  ExportStatus,
  DEFAULT_FIELDS,
  getAgentsData,
  getTasksData,
  getLogsData,
  getConfigData,
  exportDataToFile,
  exportDataAsync,
  getExportHistory,
  downloadExportFile,
  deleteExportFile,
  cleanupExpiredExports
} from '../services/exportService.js'

const router = express.Router()

/**
 * 统一错误处理装饰器
 * @param {Function} fn - 异步处理函数
 * @returns {Function} Express 中间件
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/**
 * 验证导出格式
 * @param {string} format - 格式字符串
 * @returns {boolean} 是否有效
 */
function isValidFormat(format) {
  return Object.values(ExportFormat).includes(format)
}

/**
 * 验证导出类型
 * @param {string} type - 类型字符串
 * @returns {boolean} 是否有效
 */
function isValidType(type) {
  return Object.values(ExportType).includes(type)
}

/**
 * 解析请求参数
 * @param {Object} req - Express 请求对象
 * @returns {Object} 解析后的参数
 */
function parseExportParams(req) {
  const { format = ExportFormat.JSON, async: isAsync = false } = req.query
  const { fields, filters = '{}', options = '{}' } = req.body
  
  let parsedFilters, parsedOptions
  
  try {
    parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters
  } catch (e) {
    parsedFilters = {}
  }
  
  try {
    parsedOptions = typeof options === 'string' ? JSON.parse(options) : options
  } catch (e) {
    parsedOptions = {}
  }
  
  return {
    format: format.toLowerCase(),
    isAsync: isAsync === 'true' || isAsync === true,
    fields: Array.isArray(fields) ? fields : (typeof fields === 'string' ? fields.split(',') : null),
    filters: parsedFilters,
    options: parsedOptions
  }
}

// ==================== 导出 Agent 数据 ====================

/**
 * POST /api/export/agents
 * 导出 Agent 数据
 * 
 * Request Body:
 * - fields: string[] - 自定义字段列表（可选）
 * - filters: object - 过滤条件（可选）
 * - options: object - 查询选项（可选）
 * 
 * Query Params:
 * - format: string - 导出格式 (json/csv/xlsx)，默认 json
 * - async: boolean - 是否异步导出，默认 false
 */
router.post(
  '/agents',
  asyncHandler(async (req, res) => {
    const { format, isAsync, fields, filters, options } = parseExportParams(req)
    
    // 验证格式
    if (!isValidFormat(format)) {
      res.status(400).json({
        success: false,
        error: {
          message: `不支持的导出格式：${format}。支持的格式：${Object.values(ExportFormat).join(', ')}`,
          code: 'INVALID_FORMAT'
        },
        timestamp: new Date().toISOString()
      })
      return
    }
    
    // 执行导出
    let result
    if (isAsync) {
      result = await exportDataAsync(ExportType.AGENTS, format, fields, filters, options)
    } else {
      result = exportDataToFile(ExportType.AGENTS, format, fields, filters, options)
    }
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
  })
)

// ==================== 导出任务数据 ====================

/**
 * POST /api/export/tasks
 * 导出任务数据
 * 
 * Request Body:
 * - fields: string[] - 自定义字段列表（可选）
 * - filters: object - 过滤条件（可选）
 * - options: object - 查询选项（可选）
 * 
 * Query Params:
 * - format: string - 导出格式 (json/csv/xlsx)，默认 json
 * - async: boolean - 是否异步导出，默认 false
 */
router.post(
  '/tasks',
  asyncHandler(async (req, res) => {
    const { format, isAsync, fields, filters, options } = parseExportParams(req)
    
    // 验证格式
    if (!isValidFormat(format)) {
      res.status(400).json({
        success: false,
        error: {
          message: `不支持的导出格式：${format}。支持的格式：${Object.values(ExportFormat).join(', ')}`,
          code: 'INVALID_FORMAT'
        },
        timestamp: new Date().toISOString()
      })
      return
    }
    
    // 执行导出
    let result
    if (isAsync) {
      result = await exportDataAsync(ExportType.TASKS, format, fields, filters, options)
    } else {
      result = exportDataToFile(ExportType.TASKS, format, fields, filters, options)
    }
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
  })
)

// ==================== 导出日志数据 ====================

/**
 * POST /api/export/logs
 * 导出日志数据
 * 
 * Request Body:
 * - fields: string[] - 自定义字段列表（可选）
 * - filters: object - 过滤条件（可选）
 * - options: object - 查询选项（可选）
 * 
 * Query Params:
 * - format: string - 导出格式 (json/csv/xlsx)，默认 json
 * - async: boolean - 是否异步导出，默认 false
 */
router.post(
  '/logs',
  asyncHandler(async (req, res) => {
    const { format, isAsync, fields, filters, options } = parseExportParams(req)
    
    // 验证格式
    if (!isValidFormat(format)) {
      res.status(400).json({
        success: false,
        error: {
          message: `不支持的导出格式：${format}。支持的格式：${Object.values(ExportFormat).join(', ')}`,
          code: 'INVALID_FORMAT'
        },
        timestamp: new Date().toISOString()
      })
      return
    }
    
    // 执行导出
    let result
    if (isAsync) {
      result = await exportDataAsync(ExportType.LOGS, format, fields, filters, options)
    } else {
      result = exportDataToFile(ExportType.LOGS, format, fields, filters, options)
    }
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
  })
)

// ==================== 导出配置数据 ====================

/**
 * POST /api/export/config
 * 导出配置数据
 * 
 * Request Body:
 * - fields: string[] - 自定义字段列表（可选）
 * - filters: object - 过滤条件（可选）
 * - options: object - 查询选项（可选）
 * 
 * Query Params:
 * - format: string - 导出格式 (json/csv/xlsx)，默认 json
 * - async: boolean - 是否异步导出，默认 false
 */
router.post(
  '/config',
  asyncHandler(async (req, res) => {
    const { format, isAsync, fields, filters, options } = parseExportParams(req)
    
    // 验证格式
    if (!isValidFormat(format)) {
      res.status(400).json({
        success: false,
        error: {
          message: `不支持的导出格式：${format}。支持的格式：${Object.values(ExportFormat).join(', ')}`,
          code: 'INVALID_FORMAT'
        },
        timestamp: new Date().toISOString()
      })
      return
    }
    
    // 执行导出
    let result
    if (isAsync) {
      result = await exportDataAsync(ExportType.CONFIG, format, fields, filters, options)
    } else {
      result = exportDataToFile(ExportType.CONFIG, format, fields, filters, options)
    }
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
  })
)

// ==================== 下载导出文件 ====================

/**
 * GET /api/export/download/:id
 * 下载导出文件
 * 
 * Path Params:
 * - id: string - 导出 ID
 */
router.get(
  '/download/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    
    const fileInfo = downloadExportFile(id)
    
    // 设置响应头
    res.setHeader('Content-Type', fileInfo.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`)
    res.setHeader('Content-Length', fileInfo.size)
    
    // 发送文件
    const { createReadStream } = await import('fs')
    const stream = createReadStream(fileInfo.filePath)
    stream.pipe(res)
  })
)

// ==================== 导出历史 ====================

/**
 * GET /api/export/history
 * 获取导出历史记录
 * 
 * Query Params:
 * - limit: number - 每页数量，默认 50
 * - offset: number - 偏移量，默认 0
 */
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query
    
    const history = getExportHistory({
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
    
    res.json({
      success: true,
      data: {
        history,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: history.length
        }
      },
      timestamp: new Date().toISOString()
    })
  })
)

// ==================== 删除导出文件 ====================

/**
 * DELETE /api/export/:id
 * 删除导出文件
 * 
 * Path Params:
 * - id: string - 导出 ID
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    
    const deleted = deleteExportFile(id)
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          message: `导出文件不存在：${id}`,
          code: 'NOT_FOUND'
        },
        timestamp: new Date().toISOString()
      })
      return
    }
    
    res.json({
      success: true,
      data: {
        exportId: id,
        deleted: true
      },
      timestamp: new Date().toISOString()
    })
  })
)

// ==================== 清理过期导出 ====================

/**
 * POST /api/export/cleanup
 * 清理过期的导出文件
 * 
 * Request Body:
 * - maxAge: number - 最大保留时间（毫秒），默认 7 天
 */
router.post(
  '/cleanup',
  asyncHandler(async (req, res) => {
    const { maxAge = 7 * 24 * 60 * 60 * 1000 } = req.body
    
    const result = cleanupExpiredExports(parseInt(maxAge))
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
  })
)

// ==================== 获取可用字段 ====================

/**
 * GET /api/export/fields/:type
 * 获取指定类型的可用字段列表
 * 
 * Path Params:
 * - type: string - 导出类型 (agents/tasks/logs/config)
 */
router.get(
  '/fields/:type',
  asyncHandler(async (req, res) => {
    const { type } = req.params
    
    if (!isValidType(type)) {
      res.status(400).json({
        success: false,
        error: {
          message: `未知的导出类型：${type}。支持的类型：${Object.values(ExportType).join(', ')}`,
          code: 'INVALID_TYPE'
        },
        timestamp: new Date().toISOString()
      })
      return
    }
    
    res.json({
      success: true,
      data: {
        type,
        defaultFields: DEFAULT_FIELDS[type],
        description: getFieldDescription(type)
      },
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * 获取字段描述
 * @param {string} type - 导出类型
 * @returns {Object} 字段描述
 */
function getFieldDescription(type) {
  const descriptions = {
    [ExportType.AGENTS]: 'Agent 配置和状态信息',
    [ExportType.TASKS]: '任务管理和执行记录',
    [ExportType.LOGS]: '任务执行日志',
    [ExportType.CONFIG]: '系统配置项'
  }
  return descriptions[type] || ''
}

// ==================== 全局错误处理 ====================

router.use((err, req, res, next) => {
  console.error('Export API Error:', err.message)
  
  let statusCode = 500
  let message = '导出操作失败'
  let code = 'EXPORT_ERROR'
  
  if (err.message.includes('不支持的导出格式')) {
    statusCode = 400
    code = 'INVALID_FORMAT'
  } else if (err.message.includes('未知的导出类型')) {
    statusCode = 400
    code = 'INVALID_TYPE'
  } else if (err.message.includes('不存在')) {
    statusCode = 404
    code = 'NOT_FOUND'
  } else if (err.message.includes('权限') || err.message.includes('permission')) {
    statusCode = 403
    code = 'PERMISSION_DENIED'
  } else if (err.message.includes('超时') || err.message.includes('timeout')) {
    statusCode = 504
    code = 'TIMEOUT'
  }
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    },
    timestamp: new Date().toISOString()
  })
})

export default router
