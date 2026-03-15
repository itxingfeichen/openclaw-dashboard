/**
 * Agent Create API 路由
 * 提供 Agent 创建、模板管理、配置验证功能
 * @module routes/agent-create
 */

import express from 'express'
import {
  createAgent,
  validateAgentConfig,
  getAgentTemplates,
  getAgentTemplateById,
} from '../services/agentCreateService.js'

const router = express.Router()

/**
 * 统一错误处理装饰器
 * @param {Function} fn - 异步处理函数
 * @returns {Function} Express 中间件
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/**
 * POST /api/agents/create
 * 创建新 Agent
 * 
 * 请求体:
 * {
 *   "name": "my-agent",
 *   "model": "qwen3.5-plus",
 *   "tools": ["exec", "read", "write"],
 *   "workspace": "/path/to/workspace"
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "my-agent",
 *     "name": "my-agent",
 *     "model": "qwen3.5-plus",
 *     "tools": ["exec", "read", "write"],
 *     "workspace": "/path/to/workspace",
 *     "status": "created",
 *     "createdAt": "2026-03-14T01:38:00.000Z",
 *     "configFile": {
 *       "path": "/path/to/workspace/agents/my-agent/my-agent-config.yaml",
 *       "format": "yaml"
 *     }
 *   },
 *   "timestamp": "2026-03-14T01:38:00.000Z"
 * }
 */
router.post(
  '/create',
  asyncHandler(async (req, res) => {
    const config = req.body

    // 验证必填字段
    if (!config) {
      res.status(400).json({
        success: false,
        error: {
          message: '请求体不能为空',
        },
        timestamp: new Date().toISOString(),
      })
      return
    }

    // 创建 Agent
    const result = await createAgent(config, {
      generateConfigFile: config.generateConfigFile !== false,
      configFormat: config.configFormat || 'yaml',
    })

    if (!result.success) {
      const statusCode = result.error?.message?.includes('验证') ? 400 : 500
      res.status(statusCode).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      })
      return
    }

    res.status(201).json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/agents/templates
 * 获取 Agent 模板列表
 * 
 * 响应:
 * {
 *   "success": true,
 *   "data": {
 *     "templates": [
 *       {
 *         "id": "default",
 *         "name": "默认 Agent",
 *         "description": "基础 Agent 配置，包含常用工具",
 *         "model": "qwen3.5-plus",
 *         "tools": ["exec", "read", "write", "web_search"],
 *         "workspace": "/home/admin/.openclaw/workspace"
 *       }
 *     ],
 *     "count": 4
 *   },
 *   "timestamp": "2026-03-14T01:38:00.000Z"
 * }
 */
router.get(
  '/templates',
  asyncHandler(async (req, res) => {
    const templates = getAgentTemplates()

    res.json({
      success: true,
      data: {
        templates,
        count: templates.length,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/agents/templates/:id
 * 获取指定 Agent 模板
 * 
 * 响应:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "default",
 *     "name": "默认 Agent",
 *     "description": "基础 Agent 配置，包含常用工具",
 *     "model": "qwen3.5-plus",
 *     "tools": ["exec", "read", "write", "web_search"],
 *     "workspace": "/home/admin/.openclaw/workspace"
 *   },
 *   "timestamp": "2026-03-14T01:38:00.000Z"
 * }
 */
router.get(
  '/templates/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const template = getAgentTemplateById(id)

    if (!template) {
      res.status(404).json({
        success: false,
        error: {
          message: '模板不存在',
          templateId: id,
        },
        timestamp: new Date().toISOString(),
      })
      return
    }

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * POST /api/agents/validate
 * 验证 Agent 配置
 * 
 * 请求体:
 * {
 *   "name": "my-agent",
 *   "model": "qwen3.5-plus",
 *   "tools": ["exec", "read", "write"],
 *   "workspace": "/path/to/workspace"
 * }
 * 
 * 响应 (验证通过):
 * {
 *   "success": true,
 *   "data": {
 *     "valid": true,
 *     "config": {
 *       "name": "my-agent",
 *       "model": "qwen3.5-plus",
 *       "tools": ["exec", "read", "write"],
 *       "workspace": "/path/to/workspace"
 *     }
 *   },
 *   "timestamp": "2026-03-14T01:38:00.000Z"
 * }
 * 
 * 响应 (验证失败):
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Agent 配置验证失败",
 *     "details": ["Agent 名称只能包含字母、数字、连字符和下划线"]
 *   },
 *   "timestamp": "2026-03-14T01:38:00.000Z"
 * }
 */
router.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const config = req.body

    if (!config) {
      res.status(400).json({
        success: false,
        error: {
          message: '请求体不能为空',
        },
        timestamp: new Date().toISOString(),
      })
      return
    }

    const validation = validateAgentConfig(config)

    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Agent 配置验证失败',
          details: validation.errors,
        },
        timestamp: new Date().toISOString(),
      })
      return
    }

    res.json({
      success: true,
      data: {
        valid: true,
        config: validation.config,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * 全局错误处理
 */
router.use((err, req, res, next) => {
  console.error('Agent Create API Error:', err.message)

  let statusCode = 500
  let message = '内部服务器错误'

  if (err.message.includes('验证') || err.message.includes('validation')) {
    statusCode = 400
    message = '请求参数验证失败'
  } else if (err.message.includes('权限') || err.message.includes('permission')) {
    statusCode = 403
    message = '权限不足'
  } else if (err.message.includes('未找到') || err.message.includes('not found')) {
    statusCode = 404
    message = '资源不存在'
  } else if (err.message.includes('CLI') || err.message.includes('命令')) {
    statusCode = 502
    message = 'CLI 命令执行失败'
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    timestamp: new Date().toISOString(),
  })
})

export default router
