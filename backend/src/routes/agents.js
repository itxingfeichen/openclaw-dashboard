/**
 * Agent 控制 API 路由
 * 提供 Agent 启动、停止、重启、状态查询功能
 */

import express from 'express'
import {
  startAgent,
  stopAgent,
  restartAgent,
  getAgentStatus,
} from '../cli-adapter/commands.js'

const router = express.Router()

/**
 * 统一错误处理装饰器
 * @param {Function} fn - 异步处理函数
 * @returns {Function} Express 中间件
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/**
 * POST /api/agents/:id/start
 * 启动指定 Agent
 */
router.post(
  '/:id/start',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const result = await startAgent(id)

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: {
          message: result.error || '启动 Agent 失败',
        },
        timestamp: new Date().toISOString(),
      })
      return
    }

    res.json({
      success: true,
      data: {
        id: result.data?.id || id,
        status: 'running',
        pid: result.data?.pid,
        startedAt: result.data?.startedAt || new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * POST /api/agents/:id/stop
 * 停止指定 Agent
 */
router.post(
  '/:id/stop',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const result = await stopAgent(id)

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: {
          message: result.error || '停止 Agent 失败',
        },
        timestamp: new Date().toISOString(),
      })
      return
    }

    res.json({
      success: true,
      data: {
        id: result.data?.id || id,
        status: 'stopped',
        stoppedAt: result.data?.stoppedAt || new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * POST /api/agents/:id/restart
 * 重启指定 Agent
 */
router.post(
  '/:id/restart',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const result = await restartAgent(id)

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: {
          message: result.error || '重启 Agent 失败',
        },
        timestamp: new Date().toISOString(),
      })
      return
    }

    res.json({
      success: true,
      data: {
        id: result.data?.id || id,
        status: 'running',
        pid: result.data?.pid,
        startedAt: result.data?.startedAt || new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/agents/:id/status
 * 获取 Agent 实时状态
 */
router.get(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const result = await getAgentStatus(id)

    if (!result.success) {
      // Agent 不存在或无法获取状态
      res.status(404).json({
        success: false,
        error: {
          message: result.error || 'Agent 不存在或无法获取状态',
          agentId: id,
        },
        timestamp: new Date().toISOString(),
      })
      return
    }

    res.json({
      success: true,
      data: {
        id: result.data?.id || id,
        status: result.data?.status || 'unknown',
        pid: result.data?.pid,
        startedAt: result.data?.startedAt,
        uptime: result.data?.uptime,
        memoryUsage: result.data?.memoryUsage,
        cpuUsage: result.data?.cpuUsage,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * 全局错误处理
 */
router.use((err, req, res, next) => {
  console.error('Agent Control API Error:', err.message)

  let statusCode = 500
  let message = '内部服务器错误'

  if (err.message.includes('超时') || err.message.includes('timeout')) {
    statusCode = 504
    message = 'CLI 命令执行超时'
  } else if (err.message.includes('权限') || err.message.includes('permission')) {
    statusCode = 403
    message = '权限不足'
  } else if (err.message.includes('未找到') || err.message.includes('not found')) {
    statusCode = 404
    message = 'Agent 不存在'
  } else if (err.message.includes('失败')) {
    statusCode = 502
    message = 'CLI 命令执行失败'
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      agentId: req.params?.id,
    },
    timestamp: new Date().toISOString(),
  })
})

export default router
