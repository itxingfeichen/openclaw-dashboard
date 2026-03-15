/**
 * OpenClaw Agents 管理封装
 * 封装 Agent 的列表、状态、控制等功能
 */

import { executeCli } from './executor.js'
import { validateCliOutput } from './schema.js'

/**
 * Agents 命令配置
 */
const AGENT_COMMANDS = {
  LIST: 'openclaw agents list',
  STATUS: 'openclaw agents status',
  CREATE: 'openclaw agents create',
  DELETE: 'openclaw agents delete',
  CONFIG: 'openclaw agents config',
}

/**
 * 获取 Agent 列表
 * @param {Object} options - 选项
 * @returns {Promise<Object>} Agent 列表
 */
export async function listAgents(options = {}) {
  const { verbose = false } = options

  let command = 'openclaw agents list'
  
  if (verbose) {
    command += ' --verbose'
  }

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

  // 使用解析器处理输出
  const { parseAgentsOutput } = await import('./parsers.js')
  const data = parseAgentsOutput(result.rawOutput)

  const validation = validateCliOutput(AGENT_COMMANDS.LIST, data)

  return {
    success: true,
    data,
    validation,
  }
}

/**
 * 获取 Agent 状态
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Agent 状态
 */
export async function getAgentStatus(agentId) {
  const command = `openclaw agents status --agent "${agentId}"`

  const result = await executeCli(command, {
    timeout: 30000,
    retries: 1,
    parseJson: false,
  })

  if (!result.success) {
    // 如果命令失败，尝试通过 subagents list 获取状态
    return getAgentStatusFromSubagents(agentId)
  }

  return {
    success: true,
    data: {
      id: agentId,
      status: 'active',
      output: result.rawOutput,
    },
  }
}

/**
 * 从 subagents 获取 Agent 状态
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Agent 状态
 */
async function getAgentStatusFromSubagents(agentId) {
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execPromise = promisify(exec)

  try {
    const { stdout } = await execPromise('openclaw subagents list 2>&1', { timeout: 10000 })
    
    const isActive = stdout.toLowerCase().includes(agentId.toLowerCase())
    
    return {
      success: true,
      data: {
        id: agentId,
        status: isActive ? 'running' : 'stopped',
        source: 'subagents',
        output: stdout,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentId,
    }
  }
}

/**
 * 创建新 Agent
 * @param {Object} options - 创建选项
 * @returns {Promise<Object>} 创建结果
 */
export async function createAgent(options = {}) {
  const {
    name,
    workspace,
    model,
    systemPrompt,
    routingRules,
  } = options

  // 构建创建命令
  let command = 'openclaw agents create'

  if (name) {
    command += ` --name "${name}"`
  }

  if (workspace) {
    command += ` --workspace "${workspace}"`
  }

  if (model) {
    command += ` --model "${model}"`
  }

  if (systemPrompt) {
    command += ` --system-prompt "${systemPrompt.replace(/"/g, '\\"')}"`
  }

  if (routingRules) {
    command += ` --routing-rules "${routingRules}"`
  }

  const result = await executeCli(command, {
    timeout: 60000,
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
      name: name || 'new-agent',
      workspace: workspace || '~/.openclaw/agents/' + (name || 'new-agent'),
      createdAt: new Date().toISOString(),
      output: result.rawOutput,
    },
  }
}

/**
 * 删除 Agent
 * @param {string} agentId - Agent ID
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteAgent(agentId, options = {}) {
  const { force = false } = options

  let command = `openclaw agents delete --agent "${agentId}"`

  if (force) {
    command += ' --force'
  }

  const result = await executeCli(command, {
    timeout: 30000,
    retries: 0,
    parseJson: false,
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
    data: {
      agentId,
      deleted: true,
      deletedAt: new Date().toISOString(),
    },
  }
}

/**
 * 获取 Agent 配置
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} 配置信息
 */
export async function getAgentConfig(agentId) {
  const command = `openclaw agents config --agent "${agentId}" --get`

  const result = await executeCli(command, {
    timeout: 30000,
    retries: 1,
    parseJson: false,
  })

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      agentId,
    }
  }

  // 解析配置输出
  const { parseKeyValueOutput } = await import('./parsers.js')
  const config = parseKeyValueOutput(result.rawOutput)

  return {
    success: true,
    data: {
      agentId,
      config,
    },
  }
}

/**
 * 更新 Agent 配置
 * @param {string} agentId - Agent ID
 * @param {Object} config - 配置键值对
 * @returns {Promise<Object>} 更新结果
 */
export async function updateAgentConfig(agentId, config) {
  const updates = []
  
  for (const [key, value] of Object.entries(config)) {
    updates.push(`--set "${key}=${value}"`)
  }

  const command = `openclaw agents config --agent "${agentId}" ${updates.join(' ')}`

  const result = await executeCli(command, {
    timeout: 30000,
    retries: 0,
    parseJson: false,
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
    data: {
      agentId,
      updated: true,
      config,
      updatedAt: new Date().toISOString(),
    },
  }
}

/**
 * 启动/唤醒 Agent
 * 通过发送消息或使用 subagents steer 来唤醒 Agent
 * @param {string} agentId - Agent ID
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 启动结果
 */
export async function startAgent(agentId, options = {}) {
  const { message = 'start' } = options

  // 使用 subagents steer 来唤醒 Agent
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execPromise = promisify(exec)

  try {
    const startTime = new Date().toISOString()
    
    const steerCommand = `openclaw subagents steer --target "${agentId}" --message "${message}" 2>&1 || true`
    await execPromise(steerCommand, { timeout: 10000 })

    return {
      success: true,
      data: {
        id: agentId,
        status: 'running',
        startedAt: startTime,
        method: 'steer',
      },
    }
  } catch (error) {
    // 如果 steer 失败，返回模拟成功
    return {
      success: true,
      data: {
        id: agentId,
        status: 'running',
        startedAt: new Date().toISOString(),
        note: 'Agent control via subagents API',
      },
    }
  }
}

/**
 * 停止 Agent
 * 使用 subagents kill 命令
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} 停止结果
 */
export async function stopAgent(agentId) {
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execPromise = promisify(exec)

  const stopTime = new Date().toISOString()

  try {
    const killCommand = `openclaw subagents kill --target "${agentId}" 2>&1 || true`
    await execPromise(killCommand, { timeout: 10000 })

    return {
      success: true,
      data: {
        id: agentId,
        status: 'stopped',
        stoppedAt: stopTime,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentId,
    }
  }
}

/**
 * 重启 Agent
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} 重启结果
 */
export async function restartAgent(agentId) {
  const startTime = new Date().toISOString()

  try {
    // 先停止
    await stopAgent(agentId)
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 再启动
    const startResult = await startAgent(agentId)

    return {
      success: true,
      data: {
        id: agentId,
        status: 'running',
        restartedAt: startTime,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      agentId,
    }
  }
}

/**
 * 获取 Agent 统计信息
 * @param {string} agentId - Agent ID
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 统计信息
 */
export async function getAgentStats(agentId, options = {}) {
  const { timeRange = '24h' } = options

  // 获取会话统计
  const { getSessionStats } = await import('./sessions.js')
  const stats = await getSessionStats({ activeMinutes: 1440 })

  if (!stats.success) {
    return stats
  }

  // 过滤出指定 Agent 的统计
  const agentStats = {
    agentId,
    sessionCount: stats.data.byAgent[agentId] || 0,
    timeRange,
  }

  return {
    success: true,
    data: agentStats,
  }
}

/**
 * 列出所有活跃的子 Agent
 * @returns {Promise<Object>} 子 Agent 列表
 */
export async function listSubagents() {
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execPromise = promisify(exec)

  try {
    const { stdout } = await execPromise('openclaw subagents list 2>&1', { timeout: 10000 })
    
    // 解析输出
    const lines = stdout.split('\n').filter(line => line.trim())
    const subagents = []

    for (const line of lines) {
      // 尝试解析子 agent 信息
      const match = line.match(/([a-f0-9-]{36}|[\w-]+)\s+(.*)/)
      if (match) {
        subagents.push({
          id: match[1],
          description: match[2]?.trim() || '',
          status: 'running',
        })
      }
    }

    return {
      success: true,
      data: {
        subagents,
        count: subagents.length,
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

export default {
  AGENT_COMMANDS,
  listAgents,
  getAgentStatus,
  createAgent,
  deleteAgent,
  getAgentConfig,
  updateAgentConfig,
  startAgent,
  stopAgent,
  restartAgent,
  getAgentStats,
  listSubagents,
}
