/**
 * CLI API 路由
 * 提供 OpenClaw CLI 命令的 HTTP 接口
 */

import express from 'express'
import {
  getStatus,
  getAgentsList,
  getSessionsList,
  getCronList,
  getConfig,
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
 * GET /api/status
 * 获取系统状态
 */
router.get(
  '/status',
  asyncHandler(async (req, res) => {
    const status = await getStatus()
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/agents
 * 获取 Agent 列表
 */
router.get(
  '/agents',
  asyncHandler(async (req, res) => {
    const agents = await getAgentsList()
    res.json({
      success: true,
      data: agents,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/sessions
 * 获取会话列表
 */
router.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const sessions = await getSessionsList()
    res.json({
      success: true,
      data: sessions,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/cron
 * 获取定时任务列表
 */
router.get(
  '/cron',
  asyncHandler(async (req, res) => {
    const cron = await getCronList()
    res.json({
      success: true,
      data: cron,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/config
 * 获取配置信息
 * 支持可选的 key 参数：/api/config?key=some.key
 */
router.get(
  '/config',
  asyncHandler(async (req, res) => {
    const { key } = req.query
    const config = await getConfig(key || null)
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * 全局错误处理
 */
router.use((err, req, res, next) => {
  console.error('CLI API Error:', err.message)

  // 根据错误类型返回不同的状态码
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
    message = '资源未找到'
  } else if (err.message.includes('失败')) {
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
