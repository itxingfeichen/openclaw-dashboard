/**
 * OpenClaw Sessions 管理封装
 * 封装会话的创建、发送消息、历史记录等功能
 */

import { executeCli } from './executor.js'
import { validateCliOutput } from './schema.js'

/**
 * Sessions 命令配置
 */
const SESSION_COMMANDS = {
  LIST: 'openclaw sessions --json',
  SPAWN: 'openclaw agent',
  SEND: 'openclaw sessions send',
  HISTORY: 'openclaw sessions history',
  GET: 'openclaw sessions get',
  DELETE: 'openclaw sessions delete',
}

/**
 * 列出所有会话
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 会话列表
 */
export async function listSessions(options = {}) {
  const { activeMinutes = 1440, limit = 100 } = options

  let command = `openclaw sessions --json --active-minutes ${activeMinutes}`

  const result = await executeCli(command, {
    timeout: 30000,
    retries: 1,
    parseJson: true,
  })

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    }
  }

  const validation = validateCliOutput(SESSION_COMMANDS.LIST, result.data)

  return {
    success: true,
    data: result.data,
    validation,
  }
}

/**
 * 生成/唤醒会话 (spawn)
 * @param {Object} options - 会话选项
 * @returns {Promise<Object>} 会话信息
 */
export async function spawnSession(options = {}) {
  const {
    message,
    target,
    agentId,
    model,
    deliver = false,
  } = options

  // 构建 agent 命令
  let command = 'openclaw agent'

  if (message) {
    command += ` --message "${message.replace(/"/g, '\\"')}"`
  }

  if (target) {
    command += ` --to "${target}"`
  }

  if (agentId) {
    command += ` --agent "${agentId}"`
  }

  if (model) {
    command += ` --model "${model}"`
  }

  if (deliver) {
    command += ' --deliver'
  }

  // 添加 JSON 输出
  command += ' --json'

  const result = await executeCli(command, {
    timeout: 120000,
    retries: 0,
    parseJson: true,
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
      ...result.data,
      spawnedAt: new Date().toISOString(),
    },
  }
}

/**
 * 发送消息到会话
 * @param {string} sessionKey - 会话键
 * @param {string} message - 消息内容
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 执行结果
 */
export async function sendToSession(sessionKey, message, options = {}) {
  const { agentId, model, deliver = false } = options

  // 使用 agent 命令发送消息到特定会话
  let command = `openclaw agent --message "${message.replace(/"/g, '\\"')}"`

  if (sessionKey) {
    command += ` --session "${sessionKey}"`
  }

  if (agentId) {
    command += ` --agent "${agentId}"`
  }

  if (model) {
    command += ` --model "${model}"`
  }

  if (deliver) {
    command += ' --deliver'
  }

  command += ' --json'

  const result = await executeCli(command, {
    timeout: 120000,
    retries: 0,
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
    sentAt: new Date().toISOString(),
  }
}

/**
 * 获取会话历史记录
 * @param {string} sessionKey - 会话键
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 历史记录
 */
export async function getSessionHistory(sessionKey, options = {}) {
  const { limit = 50, includeMetadata = true } = options

  // 读取会话文件获取历史
  const { readFile } = await import('./tools.js')
  
  // 会话文件通常在 ~/.openclaw/sessions/ 目录下
  const sessionPath = `~/.openclaw/sessions/${sessionKey}.json`
  
  const result = await readFile(sessionPath, { limit: 1000 })

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Session not found',
      sessionKey,
    }
  }

  // 解析会话数据
  try {
    let sessionData
    if (typeof result.data === 'string') {
      sessionData = JSON.parse(result.data)
    } else {
      sessionData = result.data
    }

    // 提取消息历史
    const history = sessionData.messages || sessionData.turns || []
    
    return {
      success: true,
      data: {
        sessionKey,
        history: history.slice(-limit),
        totalMessages: history.length,
        metadata: includeMetadata ? {
          createdAt: sessionData.createdAt,
          updatedAt: sessionData.updatedAt,
          model: sessionData.model,
          agentId: sessionData.agentId,
          tokenUsage: sessionData.tokenUsage,
        } : undefined,
      },
    }
  } catch (parseError) {
    return {
      success: false,
      error: `Failed to parse session data: ${parseError.message}`,
      sessionKey,
    }
  }
}

/**
 * 获取会话详情
 * @param {string} sessionKey - 会话键
 * @returns {Promise<Object>} 会话详情
 */
export async function getSession(sessionKey) {
  const { readFile } = await import('./tools.js')
  
  const sessionPath = `~/.openclaw/sessions/${sessionKey}.json`
  const result = await readFile(sessionPath, { limit: 500 })

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Session not found',
      sessionKey,
    }
  }

  try {
    let sessionData
    if (typeof result.data === 'string') {
      sessionData = JSON.parse(result.data)
    } else {
      sessionData = result.data
    }

    return {
      success: true,
      data: {
        sessionKey,
        ...sessionData,
      },
    }
  } catch (parseError) {
    return {
      success: false,
      error: `Failed to parse session data: ${parseError.message}`,
      sessionKey,
    }
  }
}

/**
 * 删除会话
 * @param {string} sessionKey - 会话键
 * @returns {Promise<Object>} 执行结果
 */
export async function deleteSession(sessionKey) {
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execPromise = promisify(exec)

  try {
    const sessionPath = `~/.openclaw/sessions/${sessionKey}.json`
    await execPromise(`rm -f "${sessionPath}"`, { timeout: 5000 })

    return {
      success: true,
      data: {
        sessionKey,
        deleted: true,
        deletedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to delete session',
      sessionKey,
    }
  }
}

/**
 * 清理过期会话
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 清理结果
 */
export async function cleanupSessions(options = {}) {
  const { olderThanDays = 30, dryRun = false } = options

  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execPromise = promisify(exec)

  try {
    // 查找过期会话文件
    const sessionDir = '~/.openclaw/sessions/'
    const findCmd = `find ${sessionDir} -name "*.json" -mtime +${olderThanDays} -type f`
    
    const { stdout } = await execPromise(findCmd, { timeout: 10000 })
    
    const expiredFiles = stdout.trim().split('\n').filter(f => f.trim())
    
    if (dryRun) {
      return {
        success: true,
        data: {
          dryRun: true,
          expiredCount: expiredFiles.length,
          expiredFiles: expiredFiles,
        },
      }
    }

    // 删除过期文件
    const deleted = []
    for (const file of expiredFiles) {
      try {
        await execPromise(`rm -f "${file}"`, { timeout: 5000 })
        deleted.push(file)
      } catch (err) {
        console.error(`Failed to delete ${file}:`, err.message)
      }
    }

    return {
      success: true,
      data: {
        expiredCount: expiredFiles.length,
        deletedCount: deleted.length,
        deletedFiles: deleted,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to cleanup sessions',
    }
  }
}

/**
 * 获取活跃会话统计
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 统计信息
 */
export async function getSessionStats(options = {}) {
  const { activeMinutes = 1440 } = options

  const listResult = await listSessions({ activeMinutes })

  if (!listResult.success) {
    return {
      success: false,
      error: listResult.error,
    }
  }

  const sessions = listResult.data?.sessions || []
  
  // 统计信息
  const stats = {
    total: sessions.length,
    activeMinutes,
    byAgent: {},
    byModel: {},
    tokenUsage: {
      total: 0,
      input: 0,
      output: 0,
    },
  }

  for (const session of sessions) {
    // 按 Agent 统计
    const agentId = session.agentId || 'unknown'
    stats.byAgent[agentId] = (stats.byAgent[agentId] || 0) + 1

    // 按 Model 统计
    const model = session.model || 'unknown'
    stats.byModel[model] = (stats.byModel[model] || 0) + 1

    // Token 使用统计
    if (session.inputTokens) stats.tokenUsage.input += session.inputTokens
    if (session.outputTokens) stats.tokenUsage.output += session.outputTokens
    if (session.totalTokens) stats.tokenUsage.total += session.totalTokens
  }

  return {
    success: true,
    data: stats,
  }
}

export default {
  SESSION_COMMANDS,
  listSessions,
  spawnSession,
  sendToSession,
  getSessionHistory,
  getSession,
  deleteSession,
  cleanupSessions,
  getSessionStats,
}
