/**
 * CLI 命令执行器
 * 封装 Node.js child_process.exec，提供超时控制、错误处理和重试机制
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import type { CliResult, CliOptions } from './types.js'

const execPromise = promisify(exec)

/**
 * 执行 CLI 命令
 * @param command - 要执行的命令
 * @param options - 执行选项
 * @returns 执行结果
 */
export async function executeCli(
  command: string,
  options: CliOptions = {}
): Promise<CliResult> {
  const {
    timeout = 30000,
    retries = 0,
    parseJson = true,
    workdir,
    env,
  } = options

  let lastError: Error | null = null
  let attempt = 0

  while (attempt <= retries) {
    try {
      const { stdout, stderr } = await execPromise(command, {
        timeout,
        encoding: 'utf8',
        cwd: workdir,
        env: env ? { ...process.env, ...env } : undefined,
      })

      // 如果有 stderr 但无 stdout，视为错误
      if (stderr && !stdout) {
        throw new Error(stderr)
      }

      // 解析 JSON 输出
      let data: any = stdout
      if (parseJson && stdout.trim()) {
        try {
          data = JSON.parse(stdout.trim())
        } catch (parseError) {
          // 如果不是有效 JSON，保留原始字符串
          console.warn(
            `Failed to parse CLI output as JSON: ${(parseError as Error).message}`
          )
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
      lastError = error as Error
      attempt++

      // 如果是超时错误，直接返回
      const err = error as any
      if (err.killed || err.code === 'ETIMEDOUT') {
        break
      }

      // 如果还有重试次数，等待后重试
      if (attempt <= retries) {
        console.warn(
          `CLI command failed (attempt ${attempt}/${retries}), retrying...`
        )
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  // 所有重试失败
  const err = lastError as any
  return {
    success: false,
    command,
    data: null,
    rawOutput: null,
    error: lastError?.message || 'Unknown error',
    exitCode: err?.code || -1,
  }
}

/**
 * 批量执行 CLI 命令
 * @param commands - 命令列表
 * @param options - 执行选项
 * @returns 执行结果列表
 */
export async function executeCliBatch(
  commands: string[],
  options: CliOptions = {}
): Promise<CliResult[]> {
  const results: CliResult[] = []
  for (const command of commands) {
    const result = await executeCli(command, options)
    results.push(result)
  }
  return results
}

const executorDefault = { executeCli, executeCliBatch }
export default executorDefault
