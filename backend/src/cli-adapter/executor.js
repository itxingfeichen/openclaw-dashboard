/**
 * CLI 命令执行器
 * 封装 Node.js child_process.exec，提供超时控制、错误处理和重试机制
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

/**
 * CLI 执行结果
 * @typedef {Object} CliResult
 * @property {boolean} success - 执行是否成功
 * @property {string} command - 执行的命令
 * @property {any} data - 解析后的数据
 * @property {string} rawOutput - 原始输出
 * @property {string} error - 错误信息（如果有）
 * @property {number} exitCode - 退出码
 */

/**
 * 执行 CLI 命令
 * @param {string} command - 要执行的命令
 * @param {Object} options - 执行选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 30000
 * @param {number} options.retries - 重试次数，默认 0
 * @param {boolean} options.parseJson - 是否自动解析 JSON 输出，默认 true
 * @returns {Promise<CliResult>} 执行结果
 */
export async function executeCli(command, options = {}) {
  const {
    timeout = 30000,
    retries = 0,
    parseJson = true,
  } = options

  let lastError = null
  let attempt = 0

  while (attempt <= retries) {
    try {
      const { stdout, stderr } = await execPromise(command, {
        timeout,
        encoding: 'utf8',
      })

      // 如果有 stderr 但无 stdout，视为错误
      if (stderr && !stdout) {
        throw new Error(stderr)
      }

      // 解析 JSON 输出
      let data = stdout
      if (parseJson && stdout.trim()) {
        try {
          data = JSON.parse(stdout.trim())
        } catch (parseError) {
          // 如果不是有效 JSON，保留原始字符串
          console.warn(`Failed to parse CLI output as JSON: ${parseError.message}`)
        }
      }

      return {
        success: true,
        command,
        data,
        rawOutput: stdout,
        error: null,
        exitCode: 0,
      }
    } catch (error) {
      lastError = error
      attempt++

      // 如果是超时错误，直接返回
      if (error.killed || error.code === 'ETIMEDOUT') {
        break
      }

      // 如果还有重试次数，等待后重试
      if (attempt <= retries) {
        console.warn(`CLI command failed (attempt ${attempt}/${retries}), retrying...`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  // 所有重试失败
  return {
    success: false,
    command,
    data: null,
    rawOutput: null,
    error: lastError?.message || 'Unknown error',
    exitCode: lastError?.code || -1,
  }
}

/**
 * 批量执行 CLI 命令
 * @param {string[]} commands - 命令列表
 * @param {Object} options - 执行选项
 * @returns {Promise<CliResult[]>} 执行结果列表
 */
export async function executeCliBatch(commands, options = {}) {
  const results = []
  for (const command of commands) {
    const result = await executeCli(command, options)
    results.push(result)
  }
  return results
}

export default { executeCli, executeCliBatch }
