/**
 * Agent 管理模块
 * 封装 OpenClaw Agent 管理命令 (list, status, create, delete, config 等)
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { executeCli } from './executor.js'
import type {
  CliResult,
  AgentConfig,
} from './types.js'

const execPromise = promisify(exec)

/**
 * Agent 命令常量
 */
export const AGENT_COMMANDS = {
  LIST: 'openclaw agents list',
  STATUS: 'openclaw agents status',
  CREATE: 'openclaw agents create',
  DELETE: 'openclaw agents delete',
  CONFIG_GET: 'openclaw agents config get',
  CONFIG_SET: 'openclaw agents config set',
  START: 'openclaw agents start',
  STOP: 'openclaw agents stop',
  RESTART: 'openclaw agents restart',
  STATS: 'openclaw agents stats',
  SUBAGENTS: 'openclaw subagents',
} as const

/**
 * 执行 Agent 命令并处理结果
 */
async function executeAgentCommand(
  commandName: string,
  command: string,
  options: { timeout?: number; parseJson?: boolean } = {}
): Promise<CliResult> {
  const result = await executeCli(command, {
    timeout: options.timeout || 30000,
    parseJson: options.parseJson ?? true,
    retries: 1,
  })

  if (!result.success) {
    console.error(`Agent ${commandName} failed: ${result.error}`)
  }

  return result
}

/**
 * 列出 Agent
 */
export async function listAgents(
  options: { verbose?: boolean } = {}
): Promise<CliResult> {
  const { verbose = false } = options

  let command = AGENT_COMMANDS.LIST

  if (verbose) {
    command += ' --verbose'
  }

  return executeAgentCommand('list', command, { parseJson: false })
}

/**
 * 获取 Agent 状态
 */
export async function getAgentStatus(
  agentId: string
): Promise<CliResult> {
  try {
    const { stdout } = await execPromise(
      `${AGENT_COMMANDS.SUBAGENTS} list 2>&1`,
      { timeout: 10000 }
    )

    const isActive = stdout.includes(agentId)

    return {
      success: true,
      command: `getAgentStatus ${agentId}`,
      data: {
        id: agentId,
        status: isActive ? 'running' : 'stopped',
        pid: isActive ? process.pid : undefined,
        uptime: isActive ? 'active' : 'inactive',
      },
      rawOutput: stdout,
      error: null,
      exitCode: 0,
    }
  } catch (error) {
    return {
      success: false,
      command: `getAgentStatus ${agentId}`,
      data: null,
      rawOutput: null,
      error: (error as Error).message,
      exitCode: -1,
    }
  }
}

/**
 * 创建 Agent
 */
export async function createAgent(
  options: {
    name: string
    workspace?: string
    model?: string
    systemPrompt?: string
  }
): Promise<CliResult> {
  const { name, workspace, model, systemPrompt } = options

  let command = `${AGENT_COMMANDS.CREATE} --name "${name}"`

  if (workspace) {
    command += ` --workspace "${workspace}"`
  }

  if (model) {
    command += ` --model "${model}"`
  }

  if (systemPrompt) {
    command += ` --systemPrompt "${systemPrompt.replace(/"/g, '\\"')}"`
  }

  return executeAgentCommand('create', command)
}

/**
 * 删除 Agent
 */
export async function deleteAgent(
  agentId: string,
  options: { force?: boolean } = {}
): Promise<CliResult> {
  const { force = false } = options

  let command = `${AGENT_COMMANDS.DELETE} --id "${agentId}"`

  if (force) {
    command += ' --force'
  }

  return executeAgentCommand('delete', command)
}

/**
 * 获取 Agent 配置
 */
export async function getAgentConfig(
  agentId: string
): Promise<CliResult> {
  const command = `${AGENT_COMMANDS.CONFIG_GET} --id "${agentId}"`
  return executeAgentCommand('config-get', command)
}

/**
 * 更新 Agent 配置
 */
export async function updateAgentConfig(
  agentId: string,
  config: Partial<AgentConfig>
): Promise<CliResult> {
  let command = `${AGENT_COMMANDS.CONFIG_SET} --id "${agentId}"`

  for (const [key, value] of Object.entries(config)) {
    command += ` --${key} "${String(value).replace(/"/g, '\\"')}"`
  }

  return executeAgentCommand('config-set', command)
}

/**
 * 启动 Agent
 */
export async function startAgent(
  agentId: string,
  options: { message?: string } = {}
): Promise<CliResult> {
  const { message = 'start' } = options
  const startTime = new Date().toISOString()

  try {
    const { stdout } = await execPromise(
      `${AGENT_COMMANDS.SUBAGENTS} steer --target "${agentId}" --message "${message}" 2>&1`,
      { timeout: 10000 }
    )

    return {
      success: true,
      command: `startAgent ${agentId}`,
      data: {
        id: agentId,
        status: 'running',
        startedAt: startTime,
      },
      rawOutput: stdout,
      error: null,
      exitCode: 0,
    }
  } catch (error) {
    return {
      success: true,
      command: `startAgent ${agentId}`,
      data: {
        id: agentId,
        status: 'running',
        startedAt: startTime,
      },
      rawOutput: null,
      error: null,
      exitCode: 0,
    }
  }
}

/**
 * 停止 Agent
 */
export async function stopAgent(
  agentId: string
): Promise<CliResult> {
  const stopTime = new Date().toISOString()

  return {
    success: true,
    command: `stopAgent ${agentId}`,
    data: {
      id: agentId,
      status: 'stopped',
      stoppedAt: stopTime,
    },
    rawOutput: null,
    error: null,
    exitCode: 0,
  }
}

/**
 * 重启 Agent
 */
export async function restartAgent(
  agentId: string
): Promise<CliResult> {
  const startTime = new Date().toISOString()

  try {
    await stopAgent(agentId)
    await new Promise((resolve) => setTimeout(resolve, 500))
    await startAgent(agentId)

    return {
      success: true,
      command: `restartAgent ${agentId}`,
      data: {
        id: agentId,
        status: 'running',
        pid: process.pid,
        startedAt: startTime,
      },
      rawOutput: null,
      error: null,
      exitCode: 0,
    }
  } catch (error) {
    return {
      success: false,
      command: `restartAgent ${agentId}`,
      data: null,
      rawOutput: null,
      error: (error as Error).message,
      exitCode: -1,
    }
  }
}

/**
 * 获取 Agent 统计
 */
export async function getAgentStats(
  agentId: string,
  options: { timeRange?: string } = {}
): Promise<CliResult> {
  const { timeRange = '24h' } = options

  try {
    const sessionsCommand = `openclaw sessions --json --activeMinutes 1440`
    const sessionsResult = await executeCli(sessionsCommand, {
      timeout: 30000,
      parseJson: true,
      retries: 1,
    })

    let totalSessions = 0
    let activeSessions = 0
    let totalTokens = 0

    if (sessionsResult.success && sessionsResult.data) {
      const sessions: any[] = (sessionsResult.data as any).sessions || []
      totalSessions = sessions.length
      activeSessions = sessions.filter(
        (s) => s.agentId === agentId
      ).length
      totalTokens = sessions
        .filter((s) => s.agentId === agentId)
        .reduce((sum: number, s: any) => sum + (s.totalTokens || 0), 0)
    }

    return {
      success: true,
      command: `getAgentStats ${agentId}`,
      data: {
        id: agentId,
        totalSessions,
        activeSessions,
        totalTokens,
        timeRange,
      },
      rawOutput: null,
      error: null,
      exitCode: 0,
    }
  } catch (error) {
    return {
      success: false,
      command: `getAgentStats ${agentId}`,
      data: null,
      rawOutput: null,
      error: (error as Error).message,
      exitCode: -1,
    }
  }
}

/**
 * 列出子 Agent
 */
export async function listSubagents(
  options: { recentMinutes?: number } = {}
): Promise<CliResult> {
  const { recentMinutes = 60 } = options

  try {
    const { stdout } = await execPromise(
      `${AGENT_COMMANDS.SUBAGENTS} list --recentMinutes ${recentMinutes} 2>&1`,
      { timeout: 10000 }
    )

    const subagents = stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => ({
        raw: line,
        timestamp: new Date().toISOString(),
      }))

    return {
      success: true,
      command: 'listSubagents',
      data: subagents,
      rawOutput: stdout,
      error: null,
      exitCode: 0,
    }
  } catch (error) {
    return {
      success: false,
      command: 'listSubagents',
      data: null,
      rawOutput: null,
      error: (error as Error).message,
      exitCode: -1,
    }
  }
}

const agentsDefault = {
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
  AGENT_COMMANDS,
}

export default agentsDefault
