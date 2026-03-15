/**
 * Config History API 路由
 * 提供配置版本历史管理，支持 Git 集成、版本对比、回滚功能
 */

import express from 'express'
import {
  getVersionList,
  getVersionDetail,
  rollbackToVersion,
  compareVersions,
  commitConfig,
} from '../services/configHistoryService.js'

const router = express.Router()

/**
 * 统一错误处理装饰器
 * @param {Function} fn - 异步处理函数
 * @returns {Function} Express 中间件
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/**
 * GET /api/config/:agentId/versions
 * 获取版本列表
 */
router.get(
  '/:agentId/versions',
  asyncHandler(async (req, res) => {
    const { agentId } = req.params
    const { limit } = req.query

    const result = await getVersionList(agentId, {
      limit: limit ? parseInt(limit, 10) : 20,
    })

    res.json({
      success: true,
      data: {
        agentId,
        versions: result.versions,
        count: result.count,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/config/:agentId/versions/:versionId
 * 获取版本详情
 */
router.get(
  '/:agentId/versions/:versionId',
  asyncHandler(async (req, res) => {
    const { agentId, versionId } = req.params

    const result = await getVersionDetail(agentId, versionId)

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * POST /api/config/:agentId/versions/:versionId/rollback
 * 回滚到指定版本
 */
router.post(
  '/:agentId/versions/:versionId/rollback',
  asyncHandler(async (req, res) => {
    const { agentId, versionId } = req.params
    const { message } = req.body

    const commitMessage = message || `Rollback to ${versionId.substring(0, 7)}`

    const result = await rollbackToVersion(agentId, versionId)

    res.json({
      success: true,
      data: {
        ...result,
        message: commitMessage,
      },
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * GET /api/config/:agentId/versions/compare
 * 版本对比
 */
router.get(
  '/:agentId/versions/compare',
  asyncHandler(async (req, res) => {
    const { agentId } = req.params
    const { version1, version2 } = req.query

    if (!version1 || !version2) {
      const error = new Error('必须提供 version1 和 version2 参数')
      error.code = 'MISSING_PARAMS'
      throw error
    }

    const result = await compareVersions(agentId, version1, version2)

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  })
)

/**
 * POST /api/config/:agentId/versions/commit
 * 提交当前配置到版本历史
 */
router.post(
  '/:agentId/versions/commit',
  asyncHandler(async (req, res) => {
    const { agentId } = req.params
    const { message } = req.body

    const commitMessage = message || `Update ${agentId} config`

    const result = await commitConfig(agentId, commitMessage)

    res.status(201).json({
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
  console.error('Config History API Error:', err.message)

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
  } else if (err.code === 'INVALID_VERSION_ID') {
    statusCode = 400
    message = '无效的版本 ID'
    errorDetails = {
      versionId: req.params?.versionId || req.query?.version1 || req.query?.version2,
      hint: '版本 ID 必须是有效的 Git commit hash',
    }
  } else if (err.code === 'VERSION_NOT_FOUND') {
    statusCode = 404
    message = '版本不存在'
    errorDetails = {
      agentId: req.params?.agentId,
      versionId: req.params?.versionId,
    }
  } else if (err.code === 'CONFIG_NOT_FOUND') {
    statusCode = 404
    message = '配置文件不存在'
    errorDetails = {
      agentId: req.params?.agentId,
    }
  } else if (err.code === 'MISSING_PARAMS') {
    statusCode = 400
    message = err.message
    errorDetails = {
      required: ['version1', 'version2'],
    }
  } else if (err.code === 'PARSE_ERROR') {
    statusCode = 400
    message = '配置解析失败'
    errorDetails = {
      details: err.message,
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
