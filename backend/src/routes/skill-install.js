/**
 * Skill Installation API Routes
 * Provides endpoints for skill installation, updates, and management
 */

import express from 'express'
import {
  searchSkills,
  getSkillDetails,
  assessRisk,
  installSkill,
  updateSkill,
  checkAvailableUpdates,
  getInstallationHistory,
  batchInstall,
  uninstallSkill,
  skillInstallEmitter,
  createProgressCallback
} from '../services/skillInstallService.js'
import AppError from '../errors/AppError.js'
import {
  ERR_INVALID_REQUEST,
  ERR_NOT_FOUND,
  ERR_EXTERNAL_SERVICE,
  ERR_EXTERNAL_TIMEOUT,
  ERR_OPERATION_NOT_ALLOWED
} from '../errors/error-codes.js'

const router = express.Router()

/**
 * 统一错误处理装饰器
 * @param {Function} fn - 异步处理函数
 * @returns {Function} Express 中间件
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/**
 * POST /api/skills/search
 * 搜索技能
 * 
 * Request Body:
 * - query {string} 搜索关键词
 * - limit {number} 结果数量限制 (默认 10)
 * - source {string} 指定注册表 (可选：skillhub/clawhub)
 * 
 * Response:
 * - skills {Array} 技能列表
 * - total {number} 结果总数
 * - sources {Array} 搜索的注册表
 */
router.post(
  '/search',
  asyncHandler(async (req, res) => {
    const { query, limit = 10, source } = req.body

    if (!query || typeof query !== 'string') {
      throw new AppError(
        ERR_INVALID_REQUEST,
        '搜索关键词不能为空'
      )
    }

    const results = await searchSkills(query.trim(), { limit, source })

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * GET /api/skills/:name/details
 * 获取技能详细信息
 * 
 * Path Parameters:
 * - name {string} 技能名称
 * 
 * Query Parameters:
 * - source {string} 指定注册表 (可选)
 */
router.get(
  '/:name/details',
  asyncHandler(async (req, res) => {
    const { name } = req.params
    const { source } = req.query

    const skillInfo = await getSkillDetails(name, source)
    const riskAssessment = assessRisk(skillInfo)

    res.json({
      success: true,
      data: {
        ...skillInfo,
        riskAssessment
      },
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * POST /api/skills/install
 * 安装技能
 * 
 * Request Body:
 * - skillName {string} 技能名称 (必填)
 * - version {string} 指定版本 (可选，默认最新)
 * - source {string} 注册表来源 (可选，自动检测)
 * - skipRiskCheck {boolean} 跳过风险评估 (不推荐，默认 false)
 * - config {Object} 技能配置 (可选)
 * 
 * Response:
 * - skill {Object} 安装的技能信息
 * - riskAssessment {Object} 风险评估结果
 * - installResult {Object} 安装结果
 */
router.post(
  '/install',
  asyncHandler(async (req, res) => {
    const { skillName, version, source, skipRiskCheck, config } = req.body

    if (!skillName) {
      throw new AppError(
        ERR_INVALID_REQUEST,
        '技能名称不能为空'
      )
    }

    // Support progress callback via WebSocket or SSE
    // For now, return immediate response
    const result = await installSkill({
      skillName,
      version,
      source,
      skipRiskCheck,
      config
    })

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * POST /api/skills/update
 * 更新技能
 * 
 * Request Body:
 * - skillName {string} 技能名称 (必填)
 * - version {string} 目标版本 (可选，默认最新)
 * - source {string} 注册表来源 (可选)
 * 
 * Response:
 * - skill {Object} 更新后的技能信息
 * - fromVersion {string} 原版本
 * - toVersion {string} 新版本
 */
router.post(
  '/update',
  asyncHandler(async (req, res) => {
    const { skillName, version, source } = req.body

    if (!skillName) {
      throw new AppError(
        ERR_INVALID_REQUEST,
        '技能名称不能为空'
      )
    }

    const result = await updateSkill({
      skillName,
      version,
      source
    })

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * GET /api/skills/updates
 * 检查可更新的技能
 * 
 * Response:
 * - updates {Array} 可更新的技能列表
 * - total {number} 可更新数量
 */
router.get(
  '/updates',
  asyncHandler(async (req, res) => {
    const updates = await checkAvailableUpdates()

    res.json({
      success: true,
      data: {
        updates,
        total: updates.length
      },
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * GET /api/skills/install/history
 * 获取安装历史
 * 
 * Query Parameters:
 * - skillName {string} 按技能名称过滤
 * - status {string} 按状态过滤 (installed/available/error)
 * - limit {number} 结果数量限制 (默认 50)
 * - offset {number} 偏移量 (默认 0)
 * 
 * Response:
 * - history {Array} 安装历史记录
 * - total {number} 总记录数
 */
router.get(
  '/install/history',
  asyncHandler(async (req, res) => {
    const { skillName, status, limit = 50, offset = 0 } = req.query

    const history = getInstallationHistory({
      skillName,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      success: true,
      data: {
        history,
        total: history.length
      },
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * POST /api/skills/batch-install
 * 批量安装技能
 * 
 * Request Body:
 * - skills {Array} 技能安装请求列表
 *   - skillName {string} 技能名称
 *   - version {string} 版本 (可选)
 *   - source {string} 注册表 (可选)
 * 
 * Response:
 * - results {Array} 每个技能的结果
 * - summary {Object} 批量操作摘要
 */
router.post(
  '/batch-install',
  asyncHandler(async (req, res) => {
    const { skills } = req.body

    if (!Array.isArray(skills) || skills.length === 0) {
      throw new AppError(
        ERR_INVALID_REQUEST,
        '技能列表不能为空'
      )
    }

    // Limit batch size
    if (skills.length > 20) {
      throw new AppError(
        ERR_INVALID_REQUEST,
        '批量安装最多支持 20 个技能'
      )
    }

    const results = await batchInstall(skills, (progress) => {
      // Progress callback - could emit via WebSocket
      console.log('Batch install progress:', progress)
    })

    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failCount
        }
      },
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * DELETE /api/skills/:name
 * 卸载技能
 * 
 * Path Parameters:
 * - name {string} 技能名称
 */
router.delete(
  '/:name',
  asyncHandler(async (req, res) => {
    const { name } = req.params

    const result = await uninstallSkill(name)

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * GET /api/skills/:name/risk
 * 获取技能风险评估
 * 
 * Path Parameters:
 * - name {string} 技能名称
 * 
 * Query Parameters:
 * - source {string} 注册表来源 (可选)
 */
router.get(
  '/:name/risk',
  asyncHandler(async (req, res) => {
    const { name } = req.params
    const { source } = req.query

    const skillInfo = await getSkillDetails(name, source)
    const riskAssessment = assessRisk(skillInfo)

    res.json({
      success: true,
      data: {
        skillName: name,
        ...riskAssessment
      },
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * SSE Endpoint for installation progress
 * GET /api/skills/install/progress
 * 
 * Query Parameters:
 * - skillName {string} 技能名称 (可选，不指定则接收所有进度)
 */
router.get(
  '/install/progress',
  asyncHandler(async (req, res) => {
    const { skillName } = req.query

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)

    // Create progress listener
    const progressHandler = (data) => {
      if (!skillName || data.skillName === skillName) {
        res.write(`data: ${JSON.stringify({ type: 'progress', ...data })}\n\n`)
      }
    }

    const completeHandler = (data) => {
      if (!skillName || data.skillName === skillName) {
        res.write(`data: ${JSON.stringify({ type: 'complete', ...data })}\n\n`)
      }
    }

    // Subscribe to events
    skillInstallEmitter.on('install:*:progress', progressHandler)
    skillInstallEmitter.on('install:*:complete', completeHandler)

    // Cleanup on client disconnect
    req.on('close', () => {
      skillInstallEmitter.off('install:*:progress', progressHandler)
      skillInstallEmitter.off('install:*:complete', completeHandler)
      res.end()
    })

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(':keepalive\n\n')
    }, 30000)

    req.on('close', () => {
      clearInterval(keepAlive)
    })
  })
)

/**
 * 全局错误处理
 */
router.use((err, req, res, next) => {
  console.error('Skill Install API Error:', err.message)

  let statusCode = 500
  let message = '内部服务器错误'

  if (err instanceof AppError) {
    switch (err.code) {
      case ERR_INVALID_REQUEST:
        statusCode = 400
        message = err.message
        break
      case ERR_NOT_FOUND:
        statusCode = 404
        message = err.message
        break
      case ERR_OPERATION_NOT_ALLOWED:
        statusCode = 403
        message = err.message
        break
      case ERR_INTERNAL:
      case ERR_INTERNAL:
        statusCode = 500
        message = err.message
        break
      case ERR_EXTERNAL_TIMEOUT:
        statusCode = 504
        message = err.message
        break
      case ERR_EXTERNAL_SERVICE:
        statusCode = 502
        message = err.message
        break
      default:
        statusCode = 500
        message = err.message
    }
  } else {
    // Unexpected errors
    if (err.message.includes('超时') || err.message.includes('timeout')) {
      statusCode = 504
      message = '操作超时'
    } else if (err.message.includes('权限') || err.message.includes('permission')) {
      statusCode = 403
      message = '权限不足'
    } else if (err.message.includes('未找到') || err.message.includes('not found')) {
      statusCode = 404
      message = '资源不存在'
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    },
    timestamp: new Date().toISOString()
  })
})

export default router
