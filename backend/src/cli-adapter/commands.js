/**
 * OpenClaw CLI 命令封装
 * 提供常用的 CLI 命令接口
 */

import { executeCli } from './executor.js'
import { validateCliOutput, formatValidationError } from './schema.js'
import { parseAgentsOutput, parseCronOutput, parseStatusOutput } from './parsers.js'

/**
 * CLI 命令配置
 */
const CLI_COMMANDS = {
  STATUS: 'openclaw status',
  AGENTS_LIST: 'openclaw agents list',
  SESSIONS_LIST: 'openclaw sessions --json',
  CRON_LIST: 'openclaw cron list',
  CONFIG_GET: 'openclaw config get',
}

/**
 * 获取系统状态
 * @returns {Promise<Object>} 系统状态信息
 */
export async function getStatus() {
  const result = await executeCli(CLI_COMMANDS.STATUS, {
    timeout: 30000,
    retries: 1,
    parseJson: false,
  })

  if (!result.success) {
    throw new Error(`获取系统状态失败：${result.error}`)
  }

  // 解析文本输出
  const data = parseStatusOutput(result.rawOutput)

  const validation = validateCliOutput(CLI_COMMANDS.STATUS, data)
  if (!validation.valid) {
    console.warn(formatValidationError(validation, CLI_COMMANDS.STATUS))
  }

  return data
}

/**
 * 获取 Agent 列表
 * @returns {Promise<Object>} Agent 列表
 */
export async function getAgentsList() {
  const result = await executeCli(CLI_COMMANDS.AGENTS_LIST, {
    timeout: 30000,
    retries: 1,
    parseJson: false,
  })

  if (!result.success) {
    throw new Error(`获取 Agent 列表失败：${result.error}`)
  }

  // 解析文本输出
  const data = parseAgentsOutput(result.rawOutput)

  const validation = validateCliOutput(CLI_COMMANDS.AGENTS_LIST, data)
  if (!validation.valid) {
    console.warn(formatValidationError(validation, CLI_COMMANDS.AGENTS_LIST))
  }

  return data
}

/**
 * 获取会话列表
 * @returns {Promise<Object>} 会话列表
 */
export async function getSessionsList() {
  const result = await executeCli(CLI_COMMANDS.SESSIONS_LIST, {
    timeout: 30000,
    retries: 1,
    parseJson: true,
  })

  if (!result.success) {
    throw new Error(`获取会话列表失败：${result.error}`)
  }

  const validation = validateCliOutput(CLI_COMMANDS.SESSIONS_LIST, result.data)
  if (!validation.valid) {
    console.warn(formatValidationError(validation, CLI_COMMANDS.SESSIONS_LIST))
  }

  return result.data
}

/**
 * 获取定时任务列表
 * @returns {Promise<Object>} 定时任务列表
 */
export async function getCronList() {
  const result = await executeCli(CLI_COMMANDS.CRON_LIST, {
    timeout: 30000,
    retries: 1,
    parseJson: false,
  })

  if (!result.success) {
    throw new Error(`获取定时任务列表失败：${result.error}`)
  }

  // 解析文本输出
  const data = parseCronOutput(result.rawOutput)

  const validation = validateCliOutput(CLI_COMMANDS.CRON_LIST, data)
  if (!validation.valid) {
    console.warn(formatValidationError(validation, CLI_COMMANDS.CRON_LIST))
  }

  return data
}

/**
 * 获取配置信息
 * @param {string} key - 配置键（可选）
 * @returns {Promise<Object>} 配置信息
 */
export async function getConfig(key = null) {
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

  // 配置输出通常是简单的键值对或文件路径
  const data = {
    value: result.rawOutput?.trim(),
    key: key || null,
  }

  return data
}

/**
 * 执行自定义 CLI 命令
 * @param {string} command - 命令字符串
 * @param {Object} options - 执行选项
 * @returns {Promise<Object>} 执行结果
 */
export async function executeCustomCommand(command, options = {}) {
  const result = await executeCli(command, {
    timeout: 30000,
    retries: 0,
    ...options,
  })

  if (!result.success) {
    throw new Error(`执行命令失败：${result.error}`)
  }

  return result.data
}

export default {
  getStatus,
  getAgentsList,
  getSessionsList,
  getCronList,
  getConfig,
  executeCustomCommand,
  COMMANDS: CLI_COMMANDS,
}
