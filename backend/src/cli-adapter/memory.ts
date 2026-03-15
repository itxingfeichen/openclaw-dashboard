/**
 * 记忆操作模块
 * 封装 OpenClaw 记忆系统命令 (search, get, reindex 等)
 */

import { executeCli } from './executor.js'
import type { CliResult } from './types.js'

/**
 * 记忆命令常量
 */
export const MEMORY_COMMANDS = {
  SEARCH: 'openclaw memory search',
  GET: 'openclaw memory get',
  REINDEX: 'openclaw memory reindex',
  STATUS: 'openclaw memory status',
  DELETE: 'openclaw memory delete',
} as const

/**
 * 执行记忆命令并处理结果
 */
async function executeMemoryCommand(
  commandName: string,
  command: string,
  options: { timeout?: number; parseJson?: boolean } = {}
): Promise<CliResult> {
  const result = await executeCli(command, {
    timeout: options.timeout || 60000,
    parseJson: options.parseJson ?? true,
    retries: 1,
  })

  if (!result.success) {
    console.error(`Memory ${commandName} failed: ${result.error}`)
  }

  return result
}

/**
 * 搜索记忆
 */
export async function searchMemory(
  query: string,
  options: {
    limit?: number
    threshold?: number
    agentId?: string
    sessionKey?: string
  } = {}
): Promise<CliResult> {
  const {
    limit = 20,
    threshold = 0.5,
    agentId,
    sessionKey,
  } = options

  let command = `${MEMORY_COMMANDS.SEARCH} --query "${query.replace(/"/g, '\\"')}" --limit ${limit} --threshold ${threshold}`

  if (agentId) {
    command += ` --agentId "${agentId}"`
  }

  if (sessionKey) {
    command += ` --sessionKey "${sessionKey}"`
  }

  return executeMemoryCommand('search', command)
}

/**
 * 获取记忆详情
 */
export async function getMemory(
  memoryId: string
): Promise<CliResult> {
  const command = `${MEMORY_COMMANDS.GET} --id "${memoryId}"`
  return executeMemoryCommand('get', command)
}

/**
 * 重新索引记忆
 */
export async function reindexMemory(
  options: { agentId?: string; force?: boolean } = {}
): Promise<CliResult> {
  const { agentId, force = false } = options

  let command = MEMORY_COMMANDS.REINDEX

  if (agentId) {
    command += ` --agentId "${agentId}"`
  }

  if (force) {
    command += ' --force'
  }

  return executeMemoryCommand('reindex', command, { timeout: 120000 })
}

/**
 * 获取记忆系统状态
 */
export async function getMemoryStatus(): Promise<CliResult> {
  const command = MEMORY_COMMANDS.STATUS
  return executeMemoryCommand('status', command)
}

/**
 * 按会话获取记忆
 */
export async function getMemoriesBySession(
  sessionKey: string,
  options: { limit?: number } = {}
): Promise<CliResult> {
  const { limit = 50 } = options

  const command = `${MEMORY_COMMANDS.SEARCH} --sessionKey "${sessionKey}" --limit ${limit}`
  return executeMemoryCommand('get-by-session', command)
}

/**
 * 按 Agent 获取记忆
 */
export async function getMemoriesByAgent(
  agentId: string,
  options: { limit?: number } = {}
): Promise<CliResult> {
  const { limit = 50 } = options

  const command = `${MEMORY_COMMANDS.SEARCH} --agentId "${agentId}" --limit ${limit}`
  return executeMemoryCommand('get-by-agent', command)
}

/**
 * 删除记忆
 */
export async function deleteMemory(
  memoryId: string
): Promise<CliResult> {
  const command = `${MEMORY_COMMANDS.DELETE} --id "${memoryId}"`
  return executeMemoryCommand('delete', command)
}

const memoryDefault = {
  searchMemory,
  getMemory,
  reindexMemory,
  getMemoryStatus,
  getMemoriesBySession,
  getMemoriesByAgent,
  deleteMemory,
  MEMORY_COMMANDS,
}

export default memoryDefault
