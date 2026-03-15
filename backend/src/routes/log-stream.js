/**
 * Log Stream API Routes
 * 提供 WebSocket 日志流的 HTTP API 接口
 * @module routes/log-stream
 */

import express from 'express'
import { asyncHandler } from '../middleware/error-handler.js'
import { authenticateToken } from '../middleware/auth.js'
import {
  getConnectionStats,
  generateWebSocketToken,
} from '../services/websocketService.js'
import { logInfo, logError } from '../utils/logger.js'

const router = express.Router()

/**
 * GET /api/log-stream/token
 * 获取 WebSocket 认证 token
 * 需要用户认证
 */
router.get(
  '/token',
  authenticateToken,
  asyncHandler(async (req, res) => {
    logInfo('Generating WebSocket token', { userId: req.user.id })

    const token = generateWebSocketToken(req.user, '1h')

    res.json({
      success: true,
      data: {
        token,
        expiresIn: 3600, // seconds
        websocketUrl: `/ws/logs`,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/log-stream/stats
 * 获取 WebSocket 连接统计信息
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    logInfo('Fetching WebSocket stats')

    const stats = getConnectionStats()

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/log-stream/health
 * WebSocket 服务健康检查
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const stats = getConnectionStats()
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        websocketServer: 'running',
        activeConnections: stats.totalConnections,
        agentRooms: stats.agentRooms,
        taskRooms: stats.taskRooms,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * 全局错误处理
 */
router.use((err, req, res, next) => {
  logError('Log Stream API Error', err)

  let statusCode = 500
  let message = 'Internal server error'

  // 根据错误类型设置状态码
  switch (err.code) {
    case 'AUTH_REQUIRED':
      statusCode = 401
      message = 'Authentication required'
      break
    case 'AUTH_FAILED':
      statusCode = 403
      message = 'Authentication failed'
      break
    case 'INVALID_TOKEN':
      statusCode = 401
      message = 'Invalid token'
      break
    default:
      message = err.message || message
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'UNKNOWN_ERROR',
      message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    timestamp: new Date().toISOString(),
  })
})

export default router
