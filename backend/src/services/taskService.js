/**
 * Task Service - 任务读取服务
 * 集成 OpenClaw sessions API，提供任务查询、状态筛选、统计功能
 * @module services/taskService
 */

import { getSessionsList } from '../cli-adapter/commands.js'
import { logInfo, logError, createLogger } from '../utils/logger.js'

const logger = createLogger('taskService')

/**
 * 任务状态枚举
 */
export const TaskStatus = {
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
}

/**
 * 任务类型枚举
 */
export const TaskType = {
  SUBAGENT: 'subagent',
  CRON: 'cron',
  MANUAL: 'manual',
}

/**
 * 验证状态参数
 * @param {string} status - 状态字符串
 * @returns {boolean} 是否有效
 */
function isValidStatus(status) {
  if (!status) return true
  const validStatuses = Object.values(TaskStatus)
  return validStatuses.includes(status.toLowerCase())
}

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
 * 将 OpenClaw session 转换为任务对象
 * @param {Object} session - OpenClaw session 对象
 * @returns {Object} 任务对象
 */
function sessionToTask(session) {
  // 从 session 中提取任务信息
  // OpenClaw session 结构可能包含：id, agent, status, createdAt, updatedAt, task, stats 等
  const status = mapSessionStatus(session.status)
  
  return {
    id: session.id || `task-${Date.now()}`,
    agentId: session.agent || session.agentId || 'unknown',
    status: status,
    type: TaskType.SUBAGENT,
    label: session.label || session.task?.label || `Task-${session.id?.substring(0, 8)}`,
    task: session.task || session.description,
    createdAt: session.createdAt || new Date().toISOString(),
    updatedAt: session.updatedAt || session.lastActivity || new Date().toISOString(),
    stats: session.stats || {
      tokens: session.tokens || 0,
      runtime: session.runtime || 0,
    },
  }
}

/**
 * 映射 OpenClaw session 状态到任务状态
 * @param {string} sessionStatus - Session 状态
 * @returns {string} 任务状态
 */
function mapSessionStatus(sessionStatus) {
  if (!sessionStatus) return TaskStatus.RUNNING
  
  const status = sessionStatus.toLowerCase()
  
  // OpenClaw session 可能的状态：active, idle, completed, error, etc.
  if (status === 'active' || status === 'running' || status === 'idle') {
    return TaskStatus.RUNNING
  }
  
  if (status === 'completed' || status === 'done' || status === 'finished') {
    return TaskStatus.DONE
  }
  
  if (status === 'error' || status === 'failed' || status === 'killed') {
    return TaskStatus.FAILED
  }
  
  // 默认视为运行中
  return TaskStatus.RUNNING
}

/**
 * 过滤任务列表
 * @param {Array} tasks - 任务列表
 * @param {Object} filters - 过滤条件
 * @param {string} filters.status - 状态过滤
 * @param {string} filters.agent - Agent ID 过滤
 * @returns {Array} 过滤后的任务列表
 */
function filterTasks(tasks, filters = {}) {
  const { status, agent } = filters
  
  let filtered = tasks
  
  // 状态过滤
  if (status && isValidStatus(status)) {
    filtered = filtered.filter(task => task.status === status.toLowerCase())
  }
  
  // Agent 过滤
  if (agent) {
    filtered = filtered.filter(task => 
      task.agentId.toLowerCase() === agent.toLowerCase()
    )
  }
  
  return filtered
}

/**
 * 分页任务列表
 * @param {Array} tasks - 任务列表
 * @param {Object} pagination - 分页参数
 * @param {number} pagination.page - 页码
 * @param {number} pagination.limit - 每页数量
 * @returns {Object} 分页后的任务列表和分页信息
 */
function paginateTasks(tasks, pagination = {}) {
  const page = pagination.page || 1
  const limit = pagination.limit || 20
  
  const total = tasks.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  
  const paginatedTasks = tasks.slice(startIndex, endIndex)
  
  return {
    tasks: paginatedTasks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * 获取任务列表（支持分页、状态过滤、Agent 过滤）
 * @param {Object} options - 选项
 * @param {number} options.page - 页码（从 1 开始）
 * @param {number} options.limit - 每页数量
 * @param {string} options.status - 状态过滤（running/done/failed）
 * @param {string} options.agent - Agent ID 过滤
 * @returns {Object} 任务数据和分页信息
 */
export async function getTasks(options = {}) {
  const {
    page,
    limit,
    status,
    agent,
  } = options
  
  logInfo('Fetching tasks', { page, limit, status, agent })
  
  // 验证分页参数
  const pagination = validatePaginationParams({ page, limit })
  
  // 验证状态参数
  if (status && !isValidStatus(status)) {
    const error = new Error(`Invalid status: ${status}. Valid statuses: running, done, failed`)
    error.code = 'INVALID_STATUS'
    throw error
  }
  
  try {
    // 从 OpenClaw 获取 sessions 列表
    const sessionsData = await getSessionsList()
    
    // sessionsData 结构可能是：{ sessions: [...], count: N } 或直接是数组
    const sessions = Array.isArray(sessionsData) 
      ? sessionsData 
      : (sessionsData.sessions || [])
    
    // 转换为任务对象
    const tasks = sessions.map(session => sessionToTask(session))
    
    // 应用过滤
    const filteredTasks = filterTasks(tasks, { status, agent })
    
    // 应用分页
    const result = paginateTasks(filteredTasks, {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    })
    
    logInfo(`Retrieved ${result.tasks.length} tasks`, {
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
    })
    
    return {
      tasks: result.tasks,
      pagination: result.pagination,
      filters: {
        status: status?.toLowerCase(),
        agent,
      },
    }
  } catch (error) {
    logError('Failed to fetch tasks', error)
    
    // 如果 OpenClaw CLI 不可用，返回空列表（降级处理）
    if (error.message.includes('CLI') || error.message.includes('命令')) {
      logInfo('OpenClaw CLI unavailable, returning empty task list')
      return {
        tasks: [],
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: {
          status: status?.toLowerCase(),
          agent,
        },
        note: 'OpenClaw CLI unavailable',
      }
    }
    
    throw error
  }
}

/**
 * 获取任务详情
 * @param {string} taskId - 任务 ID
 * @returns {Object} 任务详情
 */
export async function getTaskById(taskId) {
  if (!taskId) {
    const error = new Error('Task ID is required')
    error.code = 'TASK_ID_REQUIRED'
    throw error
  }
  
  logInfo('Fetching task details', { taskId })
  
  try {
    // 从 OpenClaw 获取 sessions 列表
    const sessionsData = await getSessionsList()
    
    const sessions = Array.isArray(sessionsData) 
      ? sessionsData 
      : (sessionsData.sessions || [])
    
    // 查找匹配的任务
    const session = sessions.find(s => 
      s.id === taskId || 
      s.id?.endsWith(taskId) ||
      `task-${s.id?.substring(0, 8)}` === taskId
    )
    
    if (!session) {
      const error = new Error(`Task not found: ${taskId}`)
      error.code = 'TASK_NOT_FOUND'
      error.taskId = taskId
      throw error
    }
    
    const task = sessionToTask(session)
    
    logInfo(`Retrieved task details for ${taskId}`, {
      status: task.status,
      agentId: task.agentId,
    })
    
    return task
  } catch (error) {
    logError(`Failed to fetch task ${taskId}`, error)
    
    if (error.code === 'TASK_NOT_FOUND') {
      throw error
    }
    
    // CLI 不可用时的降级处理
    if (error.message.includes('CLI') || error.message.includes('命令')) {
      const error2 = new Error('OpenClaw CLI unavailable')
      error2.code = 'CLI_UNAVAILABLE'
      throw error2
    }
    
    throw error
  }
}

/**
 * 获取任务统计信息
 * @returns {Object} 统计信息
 */
export async function getTaskStats() {
  logInfo('Fetching task statistics')
  
  try {
    // 从 OpenClaw 获取 sessions 列表
    const sessionsData = await getSessionsList()
    
    const sessions = Array.isArray(sessionsData) 
      ? sessionsData 
      : (sessionsData.sessions || [])
    
    // 转换为任务对象
    const tasks = sessions.map(session => sessionToTask(session))
    
    // 统计总数
    const total = tasks.length
    
    // 按状态统计
    const byStatus = {
      [TaskStatus.RUNNING]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.FAILED]: 0,
    }
    
    // 按 Agent 统计
    const byAgent = {}
    
    for (const task of tasks) {
      // 状态统计
      if (byStatus[task.status] !== undefined) {
        byStatus[task.status]++
      }
      
      // Agent 统计
      const agentId = task.agentId || 'unknown'
      byAgent[agentId] = (byAgent[agentId] || 0) + 1
    }
    
    logInfo('Retrieved task statistics', {
      total,
      byStatus,
      agentCount: Object.keys(byAgent).length,
    })
    
    return {
      total,
      byStatus,
      byAgent,
    }
  } catch (error) {
    logError('Failed to fetch task statistics', error)
    
    // CLI 不可用时的降级处理
    if (error.message.includes('CLI') || error.message.includes('命令')) {
      logInfo('OpenClaw CLI unavailable, returning empty statistics')
      return {
        total: 0,
        byStatus: {
          [TaskStatus.RUNNING]: 0,
          [TaskStatus.DONE]: 0,
          [TaskStatus.FAILED]: 0,
        },
        byAgent: {},
        note: 'OpenClaw CLI unavailable',
      }
    }
    
    throw error
  }
}

export default {
  getTasks,
  getTaskById,
  getTaskStats,
  TaskStatus,
  TaskType,
}
