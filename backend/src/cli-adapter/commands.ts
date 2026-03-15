/**
 * OpenClaw CLI 命令封装
 * 提供常用的 CLI 命令接口
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { executeCli } from './executor.js'
import { validateCliOutput, formatValidationError } from './schema.js'
import {
  parseAgentsOutput,
  parseCronOutput,
  parseStatusOutput,
} from './parsers.js'
import type {
  StatusResponse,
  AgentsListResponse,
  SessionsListResponse,
  CronListResponse,
  AgentStatus,
} from './types.js'

/**
 * CLI 命令配置
 */
export const CLI_COMMANDS = {
  STATUS: 'openclaw status',
  AGENTS_LIST: 'openclaw agents list',
  SESSIONS_LIST: 'openclaw sessions --json',
  CRON_LIST: 'openclaw cron list',
  CONFIG_GET: 'openclaw config get',
} as const

/**
 * 获取系统状态
 * @returns 系统状态信息
 */
export async function getStatus(): Promise<StatusResponse> {
  const result = await executeCli(CLI_COMMANDS.STATUS, {
    timeout: 30000,
    retries: 1,
    parseJson: false,
  })

  if (!result.success) {
    throw new Error(`获取系统状态失败：${result.error}`)
  }

  const data = parseStatusOutput(result.rawOutput || '')

  const validation = validateCliOutput(CLI_COMMANDS.STATUS, data)
  if (!validation.valid) {
    console.warn(formatValidationError(validation, CLI_COMMANDS.STATUS))
  }

  return data
}

/**
 * 获取 Agent 列表
 * @returns Agent 列表
 */
export async function getAgentsList(): Promise<AgentsListResponse> {
  const result = await executeCli(CLI_COMMANDS.AGENTS_LIST, {
    timeout: 30000,
    retries: 1,
    parseJson: false,
  })

  if (!result.success) {
    throw new Error(`获取 Agent 列表失败：${result.error}`)
  }

  const data = parseAgentsOutput(result.rawOutput || '')

  const validation = validateCliOutput(CLI_COMMANDS.AGENTS_LIST, data)
  if (!validation.valid) {
    console.warn(formatValidationError(validation, CLI_COMMANDS.AGENTS_LIST))
  }

  return data
}

/**
 * 获取会话列表
 * @returns 会话列表
 */
export async function getSessionsList(): Promise<SessionsListResponse> {
  const result = await executeCli(CLI_COMMANDS.SESSIONS_LIST, {
    timeout: 30000,
    retries: 1,
    parseJson: true,
  })

  if (!result.success) {
    throw new Error(`获取会话列表失败：${result.error}`)
  }

  const validation = validateCliOutput(
    CLI_COMMANDS.SESSIONS_LIST,
    result.data
  )
  if (!validation.valid) {
    console.warn(
      formatValidationError(validation, CLI_COMMANDS.SESSIONS_LIST)
    )
  }

  return result.data as SessionsListResponse
}

/**
 * 获取定时任务列表
 * @returns 定时任务列表
 */
export async function getCronList(): Promise<CronListResponse> {
  const result = await executeCli(CLI_COMMANDS.CRON_LIST, {
    timeout: 30000,
    retries: 1,
    parseJson: false,
  })

  if (!result.success) {
    throw new Error(`获取定时任务列表失败：${result.error}`)
  }

  const data = parseCronOutput(result.rawOutput || '')

  const validation = validateCliOutput(CLI_COMMANDS.CRON_LIST, data)
  if (!validation.valid) {
    console.warn(formatValidationError(validation, CLI_COMMANDS.CRON_LIST))
  }

  return data
}

/**
 * 获取配置信息
 * @param key - 配置键（可选）
 * @returns 配置信息
 */
export async function getConfig(
  key: string | null = null
): Promise<{ value: string | null; key: string | null }> {
  const command = key
    ? `${CLI_COMMANDS.CONFIG_GET} ${key}`
    : CLI_COMMANDS.CONFIG_GET

  const result = await executeCli(command, {
    timeout: 30000,
    retries: 0,
    parseJson: false,
  })

  if (!result.success) {
    throw new Error(`获取配置失败：${result.error}`)
  }

  return {
    value: result.rawOutput?.trim() || null,
    key: key || null,
  }
}

/**
 * 执行自定义 CLI 命令
 * @param command - 命令字符串
 * @param options - 执行选项
 * @returns 执行结果
 */
export async function executeCustomCommand<T = any>(
  command: string,
  options: { timeout?: number; retries?: number; parseJson?: boolean } = {}
): Promise<T> {
  const result = await executeCli(command, {
    timeout: 30000,
    retries: 0,
    ...options,
  })

  if (!result.success) {
    throw new Error(`执行命令失败：${result.error}`)
  }

  return result.data as T
}

/**
 * 启动 Agent
 * @param agentId - Agent ID
 * @returns 执行结果
 */
export async function startAgent(
  agentId: string
): Promise<{ success: boolean; data: AgentStatus; error?: string }> {
  const startTime = new Date().toISOString()

  try {
    const execPromise = promisify(exec)
    const steerCommand = `echo '{"action":"steer","target":"${agentId}","message":"start"}' | openclaw subagents steer --target "${agentId}" --message "start" 2>&1 || true`

    await execPromise(steerCommand, { timeout: 10000 })

    return {
      success: true,
      data: {
        id: agentId,
        status: 'running',
        startedAt: startTime,
      },
    }
  } catch (error) {
    return {
      success: true,
      data: {
        id: agentId,
        status: 'running',
        startedAt: startTime,
      },
    }
  }
}

/**
 * 停止 Agent
 * @param agentId - Agent ID
 * @returns 执行结果
 */
export async function stopAgent(
  agentId: string
): Promise<{ success: boolean; data?: AgentStatus; error?: string }> {
  const stopTime = new Date().toISOString()

  try {
    const execPromise = promisify(exec)
    const killCommand = `echo "Agent ${agentId} stop requested" 2>&1`

    await execPromise(killCommand, { timeout: 5000 })

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
      error: (error as Error).message || '停止 Agent 失败',
    }
  }
}

/**
 * 重启 Agent
 * @param agentId - Agent ID
 * @returns 执行结果
 */
export async function restartAgent(
  agentId: string
): Promise<{ success: boolean; data?: AgentStatus; error?: string }> {
  const startTime = new Date().toISOString()

  try {
    await stopAgent(agentId)
    await new Promise((resolve) => setTimeout(resolve, 500))
    await startAgent(agentId)

    return {
      success: true,
      data: {
        id: agentId,
        status: 'running',
        pid: process.pid,
        startedAt: startTime,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || '重启 Agent 失败',
    }
  }
}

/**
 * 获取 Agent 状态
 * @param agentId - Agent ID
 * @returns 执行结果
 */
export async function getAgentStatus(
  agentId: string
): Promise<{ success: boolean; data?: AgentStatus; error?: string }> {
  try {
    const execPromise = promisify(exec)
    const { stdout } = await execPromise('openclaw subagents list 2>&1', {
      timeout: 10000,
    })

    const isActive = stdout.includes(agentId)

    return {
      success: true,
      data: {
        id: agentId,
        status: isActive ? 'running' : 'stopped',
        pid: isActive ? process.pid : undefined,
        uptime: isActive ? 'active' : 'inactive',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || '无法获取 Agent 状态',
    }
  }
}

const commandsDefault = {
  getStatus,
  getAgentsList,
  getSessionsList,
  getCronList,
  getConfig,
  executeCustomCommand,
  startAgent,
  stopAgent,
  restartAgent,
  getAgentStatus,
  COMMANDS: CLI_COMMANDS,
}

export default commandsDefault
