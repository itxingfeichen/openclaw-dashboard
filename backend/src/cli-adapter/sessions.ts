/**
 * 会话管理模块
 * 封装 OpenClaw 会话管理命令 (list, spawn, send, history 等)
 */

import { executeCli } from './executor.js'
import type { CliResult } from './types.js'

/**
 * 会话命令常量
 */
export const SESSION_COMMANDS = {
  LIST: 'openclaw sessions --json',
  SPAWN: 'openclaw sessions spawn',
  SEND: 'openclaw sessions send',
  HISTORY: 'openclaw sessions history',
  DELETE: 'openclaw sessions delete',
  STATS: 'openclaw sessions stats',
} as const

/**
 * 执行会话命令并处理结果
 */
async function executeSessionCommand(
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
    console.error(`Session ${commandName} failed: ${result.error}`)
  }

  return result
}

/**
 * 列出会话
 */
export async function listSessions(
  options: { activeMinutes?: number; limit?: number } = {}
): Promise<CliResult> {
  const { activeMinutes = 1440, limit = 100 } = options

  let command = `${SESSION_COMMANDS.LIST} --activeMinutes ${activeMinutes}`

  if (limit) {
    command += ` --limit ${limit}`
  }

  return executeSessionCommand('list', command)
}

/**
 * 生成/唤醒会话
 */
export async function spawnSession(
  options: {
    message: string
    target?: string
    agentId?: string
    model?: string
    deliver?: boolean
  }
): Promise<CliResult> {
  const {
    message,
    target,
    agentId = 'main',
    model = 'qwen3.5-plus',
    deliver = false,
  } = options

  let command = `${SESSION_COMMANDS.SPAWN} --agentId "${agentId}" --model "${model}" --message "${message.replace(/"/g, '\\"')}"`

  if (target) {
    command += ` --target "${target}"`
  }

  if (deliver) {
    command += ' --deliver'
  }

  return executeSessionCommand('spawn', command)
}

/**
 * 发送消息到会话
 */
export async function sendToSession(
  sessionKey: string,
  message: string,
  options: {
    agentId?: string
    model?: string
    deliver?: boolean
  } = {}
): Promise<CliResult> {
  const { agentId = 'main', model = 'qwen3.5-plus', deliver = false } = options

  let command = `${SESSION_COMMANDS.SEND} --key "${sessionKey}" --agentId "${agentId}" --model "${model}" --message "${message.replace(/"/g, '\\"')}"`

  if (deliver) {
    command += ' --deliver'
  }

  return executeSessionCommand('send', command)
}

/**
 * 获取会话历史记录
 */
export async function getSessionHistory(
  sessionKey: string,
  options: { limit?: number; includeMetadata?: boolean } = {}
): Promise<CliResult> {
  const { limit = 50, includeMetadata = true } = options

  let command = `${SESSION_COMMANDS.HISTORY} --key "${sessionKey}" --limit ${limit}`

  if (includeMetadata) {
    command += ' --includeMetadata'
  }

  return executeSessionCommand('history', command)
}

/**
 * 获取会话详情
 */
export async function getSession(
  sessionKey: string
): Promise<CliResult> {
  const listResult = await listSessions({ limit: 1000 })

  if (!listResult.success || !listResult.data) {
    return {
      success: false,
      command: `getSession ${sessionKey}`,
      data: null,
      rawOutput: null,
      error: 'Failed to list sessions',
      exitCode: -1,
    }
  }

  const sessions: any[] = (listResult.data as any).sessions || []
  const session = sessions.find((s) => s.key === sessionKey)

  if (!session) {
    return {
      success: false,
      command: `getSession ${sessionKey}`,
      data: null,
      rawOutput: null,
      error: `Session not found: ${sessionKey}`,
      exitCode: -1,
    }
  }

  return {
    success: true,
    command: `getSession ${sessionKey}`,
    data: session,
    rawOutput: null,
    error: null,
    exitCode: 0,
  }
}

/**
 * 删除会话
 */
export async function deleteSession(
  sessionKey: string
): Promise<CliResult> {
  const command = `${SESSION_COMMANDS.DELETE} --key "${sessionKey}"`
  return executeSessionCommand('delete', command)
}

/**
 * 清理过期会话
 */
export async function cleanupSessions(
  options: { olderThanDays?: number; dryRun?: boolean } = {}
): Promise<CliResult> {
  const { olderThanDays = 30, dryRun = false } = options

  try {
    const fs = await import('fs')
    const path = await import('path')

    const workspaceDir = process.env.OPENCLAW_WORKSPACE || '/home/admin/.openclaw/workspace'
    const sessionsDir = path.join(workspaceDir, 'sessions')

    if (!fs.existsSync(sessionsDir)) {
      return {
        success: true,
        command: 'cleanupSessions',
        data: { deleted: 0, dryRun },
        rawOutput: null,
        error: null,
        exitCode: 0,
      }
    }

    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    let deletedCount = 0

    const files = fs.readdirSync(sessionsDir)
    for (const file of files) {
      const filePath = path.join(sessionsDir, file)
      const stats = fs.statSync(filePath)

      if (stats.mtimeMs < cutoffTime) {
        if (!dryRun) {
          fs.unlinkSync(filePath)
        }
        deletedCount++
      }
    }

    return {
      success: true,
      command: 'cleanupSessions',
      data: { deleted: deletedCount, dryRun },
      rawOutput: null,
      error: null,
      exitCode: 0,
    }
  } catch (error) {
    return {
      success: false,
      command: 'cleanupSessions',
      data: null,
      rawOutput: null,
      error: (error as Error).message,
      exitCode: -1,
    }
  }
}

/**
 * 获取会话统计
 */
export async function getSessionStats(
  options: { activeMinutes?: number } = {}
): Promise<CliResult> {
  const { activeMinutes = 1440 } = options

  try {
    const listResult = await listSessions({ activeMinutes, limit: 1000 })

    if (!listResult.success || !listResult.data) {
      return {
        success: false,
        command: 'getSessionStats',
        data: null,
        rawOutput: null,
        error: 'Failed to list sessions',
        exitCode: -1,
      }
    }

    const sessions: any[] = (listResult.data as any).sessions || []

    const totalSessions = sessions.length
    const activeSessions = sessions.filter(
      (s) => s.ageMs && s.ageMs < activeMinutes * 60 * 1000
    ).length

    const totalTokens = sessions.reduce(
      (sum: number, s: any) => sum + (s.totalTokens || 0),
      0
    )

    const totalMessages = Math.round(totalTokens / 50)

    return {
      success: true,
      command: 'getSessionStats',
      data: {
        totalSessions,
        activeSessions,
        totalMessages,
        totalTokens,
        timeRange: `${activeMinutes}m`,
      },
      rawOutput: null,
      error: null,
      exitCode: 0,
    }
  } catch (error) {
    return {
      success: false,
      command: 'getSessionStats',
      data: null,
      rawOutput: null,
      error: (error as Error).message,
      exitCode: -1,
    }
  }
}

const sessionsDefault = {
  listSessions,
  spawnSession,
  sendToSession,
  getSessionHistory,
  getSession,
  deleteSession,
  cleanupSessions,
  getSessionStats,
  SESSION_COMMANDS,
}

export default sessionsDefault
