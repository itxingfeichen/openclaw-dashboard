/**
 * Config Editor API 路由
 * 提供 Agent 配置文件读取、编辑、保存、验证功能
 */

import express from 'express'
import {
  getConfig,
  saveConfig,
  validateConfigEndpoint,
  getConfigHistory,
  restoreConfigFromHistory,
  ConfigFormat,
} from '../services/configEditorService.js'

const router = express.Router()

/**
 * 统一错误处理装饰器
 * @param {Function} fn - 异步处理函数
 * @returns {Function} Express 中间件
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/**
 * GET /api/config/:agentId
 * 读取指定 Agent 的配置
 */
router.get(
  '/:agentId',
  asyncHandler(async (req, res) => {
    const { agentId } = req.params

    const result = await getConfig(agentId)

    res.json({
      success: true,
      data: {
        agentId,
        config: result.config,
        format: result.format,
        path: result.path,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * PUT /api/config/:agentId
 * 保存指定 Agent 的配置
 */
router.put(
  '/:agentId',
  asyncHandler(async (req, res) => {
    const { agentId } = req.params
    const config = req.body

    // 支持指定格式（可选）
    const format = req.query.format || ConfigFormat.YAML

    const result = await saveConfig(agentId, config, {
      format,
      saveHistory: true,
    })

    const statusCode = result.warnings && result.warnings.length > 0 ? 200 : 200

    res.status(statusCode).json({
      success: true,
      data: {
        agentId,
        path: result.path,
        format: result.format,
        config: result.config,
      },
      warnings: result.warnings || [],
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * POST /api/config/:agentId/validate
 * 验证 Agent 配置
 */
router.post(
  '/:agentId/validate',
  asyncHandler(async (req, res) => {
    const { agentId } = req.params
    const config = req.body

    const validation = await validateConfigEndpoint(config)

    const statusCode = validation.valid ? 200 : 400

    res.status(statusCode).json({
      success: validation.valid,
      data: {
        agentId,
        valid: validation.valid,
        config: validation.valid ? config : undefined,
      },
      errors: validation.errors || [],
      warnings: validation.warnings || [],
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/config/:agentId/history
 * 获取 Agent 配置历史记录
 */
router.get(
  '/:agentId/history',
  asyncHandler(async (req, res) => {
    const { agentId } = req.params
    const { limit } = req.query

    const result = await getConfigHistory(agentId, {
      limit: limit ? parseInt(limit, 10) : 20,
    })

    res.json({
      success: true,
      data: {
        agentId,
        history: result.history,
        count: result.count,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * POST /api/config/:agentId/history/:filename/restore
 * 从历史记录恢复配置
 */
router.post(
  '/:agentId/history/:filename/restore',
  asyncHandler(async (req, res) => {
    const { agentId, filename } = req.params

    const result = await restoreConfigFromHistory(agentId, filename)

    res.json({
      success: true,
      data: {
        agentId,
        restoredFrom: result.restoredFrom,
        timestamp: result.timestamp,
        config: result.config,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * 全局错误处理
 */
router.use((err, req, res, next) => {
  console.error('Config Editor API Error:', err.message)

  let statusCode = 500
  let message = '内部服务器错误'
  let errorDetails = {}

  // 处理特定错误类型
  if (err.code === 'INVALID_AGENT_ID') {
    statusCode = 400
    message = '无效的 Agent ID 格式'
    errorDetails = {
      agentId: req.params?.agentId,
      hint: 'Agent ID 只能包含字母、数字、连字符和下划线（2-50 字符）',
    }
  } else if (err.code === 'CONFIG_NOT_FOUND' || err.code === 'HISTORY_FILE_NOT_FOUND') {
    statusCode = 404
    message = err.code === 'CONFIG_NOT_FOUND' ? 'Agent 配置不存在' : '历史记录文件不存在'
    errorDetails = {
      agentId: req.params?.agentId,
      filename: req.params?.filename,
    }
  } else if (err.code === 'VALIDATION_ERROR') {
    statusCode = 400
    message = '配置验证失败'
    errorDetails = {
      details: err.details || [],
    }
  } else if (err.code === 'INVALID_CONFIG') {
    statusCode = 400
    message = '无效的配置格式'
    errorDetails = {
      hint: '配置必须是非空对象',
    }
  } else if (err.code === 'PARSE_ERROR') {
    statusCode = 400
    message = '配置文件解析失败'
    errorDetails = {
      details: err.message,
    }
  } else if (err.code === 'INVALID_HISTORY_FILE') {
    statusCode = 400
    message = '无效的历史记录文件名'
    errorDetails = {
      filename: req.params?.filename,
    }
  } else if (err.code === 'IO_ERROR') {
    statusCode = 500
    message = '文件系统操作失败'
    errorDetails = {
      details: err.message,
    }
  } else if (err.message.includes('超时') || err.message.includes('timeout')) {
    statusCode = 504
    message = '操作超时'
  } else if (err.message.includes('权限') || err.message.includes('permission')) {
    statusCode = 403
    message = '权限不足'
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? { ...errorDetails, stack: err.stack } : errorDetails,
      agentId: req.params?.agentId,
    },
    timestamp: new Date().toISOString(),
  })
})

export default router
