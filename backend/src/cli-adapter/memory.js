/**
 * OpenClaw Memory 操作封装
 * 封装记忆搜索和获取功能
 */

import { executeCli } from './executor.js'
import { validateCliOutput } from './schema.js'

/**
 * Memory 命令配置
 */
const MEMORY_COMMANDS = {
  SEARCH: 'openclaw memory search',
  GET: 'openclaw memory get',
  REINDEX: 'openclaw memory reindex',
  STATUS: 'openclaw memory status',
}

/**
 * 搜索记忆
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Promise<Object>} 搜索结果
 */
export async function searchMemory(query, options = {}) {
  const {
    limit = 20,
    threshold = 0.5,
    agentId,
    sessionKey,
    timeRange,
  } = options

  let command = `openclaw memory search --query "${query}" --limit ${limit} --threshold ${threshold}`

  if (agentId) {
    command += ` --agent "${agentId}"`
  }

  if (sessionKey) {
    command += ` --session "${sessionKey}"`
  }

  if (timeRange) {
    command += ` --time-range "${timeRange}"`
  }

  const result = await executeCli(command, {
    timeout: 60000,
    retries: 1,
    parseJson: true,
  })

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      query,
    }
  }

  const validation = validateCliOutput(command, result.data)

  return {
    success: true,
    data: result.data,
    query,
    validation,
  }
}

/**
 * 获取记忆详情
 * @param {string} memoryId - 记忆 ID
 * @returns {Promise<Object>} 记忆详情
 */
export async function getMemory(memoryId) {
  const command = `openclaw memory get --id "${memoryId}"`

  const result = await executeCli(command, {
    timeout: 30000,
    retries: 0,
    parseJson: true,
  })

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      memoryId,
    }
  }

  const validation = validateCliOutput(command, result.data)

  return {
    success: true,
    data: result.data,
    memoryId,
    validation,
  }
}

/**
 * 重新索引记忆
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 执行结果
 */
export async function reindexMemory(options = {}) {
  const { agentId, force = false } = options

  let command = 'openclaw memory reindex'

  if (agentId) {
    command += ` --agent "${agentId}"`
  }

  if (force) {
    command += ' --force'
  }

  const result = await executeCli(command, {
    timeout: 120000,
    retries: 0,
    parseJson: false,
  })

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    }
  }

  return {
    success: true,
    data: {
      message: 'Memory reindex completed',
      output: result.rawOutput,
    },
  }
}

/**
 * 获取记忆系统状态
 * @returns {Promise<Object>} 状态信息
 */
export async function getMemoryStatus() {
  const command = 'openclaw memory status'

  const result = await executeCli(command, {
    timeout: 30000,
    retries: 1,
    parseJson: false,
  })

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    }
  }

  // 解析状态输出
  const status = parseMemoryStatusOutput(result.rawOutput)

  return {
    success: true,
    data: status,
  }
}

/**
 * 解析记忆状态输出
 * @param {string} output - CLI 原始输出
 * @returns {Object} 解析后的状态
 */
function parseMemoryStatusOutput(output) {
  const status = {
    timestamp: new Date().toISOString(),
  }

  const lines = output.split('\n')

  for (const line of lines) {
    // 索引文件数量
    const filesMatch = line.match(/Index files:\s*(\d+)/)
    if (filesMatch) {
      status.indexFiles = parseInt(filesMatch[1], 10)
    }

    // 总记忆数
    const memoriesMatch = line.match(/Memories:\s*(\d+)/)
    if (memoriesMatch) {
      status.totalMemories = parseInt(memoriesMatch[1], 10)
    }

    // 向量维度
    const dimensionsMatch = line.match(/Dimensions:\s*(\d+)/)
    if (dimensionsMatch) {
      status.dimensions = parseInt(dimensionsMatch[1], 10)
    }

    // 索引路径
    const pathMatch = line.match(/Path:\s*(.+)/)
    if (pathMatch) {
      status.path = pathMatch[1].trim()
    }

    // 最后更新时间
    const updatedMatch = line.match(/Last updated:\s*(.+)/)
    if (updatedMatch) {
      status.lastUpdated = updatedMatch[1].trim()
    }
  }

  return status
}

/**
 * 按会话获取记忆
 * @param {string} sessionKey - 会话键
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 记忆列表
 */
export async function getMemoriesBySession(sessionKey, options = {}) {
  const { limit = 50 } = options

  const command = `openclaw memory search --session "${sessionKey}" --limit ${limit}`

  const result = await executeCli(command, {
    timeout: 60000,
    retries: 1,
    parseJson: true,
  })

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      sessionKey,
    }
  }

  return {
    success: true,
    data: result.data,
    sessionKey,
  }
}

/**
 * 按 Agent 获取记忆
 * @param {string} agentId - Agent ID
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 记忆列表
 */
export async function getMemoriesByAgent(agentId, options = {}) {
  const { limit = 50 } = options

  const command = `openclaw memory search --agent "${agentId}" --limit ${limit}`

  const result = await executeCli(command, {
    timeout: 60000,
    retries: 1,
    parseJson: true,
  })

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      agentId,
    }
  }

  return {
    success: true,
    data: result.data,
    agentId,
  }
}

/**
 * 删除记忆
 * @param {string} memoryId - 记忆 ID
 * @returns {Promise<Object>} 执行结果
 */
export async function deleteMemory(memoryId) {
  // 注意：OpenClaw 可能没有直接的 delete 命令
  // 这里提供一个占位实现
  return {
    success: false,
    error: 'Memory deletion is not supported via CLI',
    memoryId,
    note: 'Use memory management API directly',
  }
}

export default {
  MEMORY_COMMANDS,
  searchMemory,
  getMemory,
  reindexMemory,
  getMemoryStatus,
  getMemoriesBySession,
  getMemoriesByAgent,
  deleteMemory,
  parseMemoryStatusOutput,
}
