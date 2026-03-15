/**
 * 工具执行模块
 * 封装 OpenClaw 工具命令 (exec, read, write, browser, web_search 等)
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { executeCli } from './executor.js'
import type { CliResult } from './types.js'

const execPromise = promisify(exec)

/**
 * 工具命令常量
 */
export const TOOL_COMMANDS = {
  READ: 'openclaw read',
  WRITE: 'openclaw write',
  EDIT: 'openclaw edit',
  EXEC: 'openclaw exec',
  BROWSER: 'openclaw browser',
  PROCESS: 'openclaw process',
  NODES: 'openclaw nodes',
  MESSAGE: 'openclaw message',
  WEB_SEARCH: 'openclaw web_search',
  WEB_FETCH: 'openclaw web_fetch',
  TTS: 'openclaw tts',
  IMAGE: 'openclaw image',
  PDF: 'openclaw pdf',
} as const

/**
 * 执行工具命令并处理结果
 */
async function executeTool(
  toolName: string,
  command: string,
  options: { timeout?: number; parseJson?: boolean } = {}
): Promise<CliResult> {
  const result = await executeCli(command, {
    timeout: options.timeout || 30000,
    parseJson: options.parseJson ?? true,
    retries: 1,
  })

  if (!result.success) {
    console.error(`Tool ${toolName} failed: ${result.error}`)
  }

  return result
}

// ==================== 文件操作 ====================

/**
 * 读取文件
 */
export async function readFile(
  path: string,
  options: { offset?: number; limit?: number } = {}
): Promise<CliResult> {
  const { offset = 0, limit } = options
  let command = `${TOOL_COMMANDS.READ} --path "${path}"`

  if (offset > 0) {
    command += ` --offset ${offset}`
  }
  if (limit) {
    command += ` --limit ${limit}`
  }

  return executeTool('read', command, { parseJson: false })
}

/**
 * 写入文件
 */
export async function writeFile(
  path: string,
  content: string
): Promise<CliResult> {
  const escapedContent = content.replace(/"/g, '\\"').replace(/\n/g, '\\n')
  const command = `echo "${escapedContent}" > "${path}"`

  return executeTool('write', command, { parseJson: false })
}

/**
 * 编辑文件（精确替换）
 */
export async function editFile(
  path: string,
  oldText: string,
  newText: string
): Promise<CliResult> {
  try {
    const fs = await import('fs')
    const content = fs.readFileSync(path, 'utf8')
    const newContent = content.replace(oldText, newText)
    fs.writeFileSync(path, newContent, 'utf8')

    return {
      success: true,
      command: 'editFile',
      data: null,
      rawOutput: null,
      error: null,
      exitCode: 0,
    }
  } catch (error) {
    return {
      success: false,
      command: 'editFile',
      data: null,
      rawOutput: null,
      error: (error as Error).message,
      exitCode: -1,
    }
  }
}

// ==================== Shell 执行 ====================

/**
 * 执行 Shell 命令
 */
export async function execCommand(
  command: string,
  options: { timeout?: number; workdir?: string; env?: Record<string, string> } = {}
): Promise<CliResult> {
  const { timeout = 30000, workdir, env } = options

  try {
    const { stdout, stderr } = await execPromise(command, {
      timeout,
      encoding: 'utf8',
      cwd: workdir,
      env: env ? { ...process.env, ...env } : undefined,
    })

    return {
      success: !stderr || !!stdout,
      command,
      data: stdout,
      rawOutput: stdout,
      error: stderr || null,
      exitCode: 0,
    }
  } catch (error) {
    const err = error as any
    return {
      success: false,
      command,
      data: null,
      rawOutput: null,
      error: err.message || 'Unknown error',
      exitCode: err.code || -1,
    }
  }
}

// ==================== Browser 操作 ====================

/**
 * 获取 Browser 快照
 */
export async function browserSnapshot(
  options: {
    url?: string
    profile?: 'chrome' | 'openclaw'
    refs?: 'role' | 'aria'
    timeout?: number
  } = {}
): Promise<CliResult> {
  const { url, profile = 'openclaw', refs = 'aria', timeout = 30000 } = options

  let command = `${TOOL_COMMANDS.BROWSER} snapshot --profile ${profile} --refs ${refs}`

  if (url) {
    command += ` --url "${url}"`
  }

  command += ` --timeout ${timeout}`

  return executeTool('browser-snapshot', command)
}

/**
 * Browser 点击元素
 */
export async function browserClick(
  ref: string,
  options: { doubleClick?: boolean; timeout?: number } = {}
): Promise<CliResult> {
  const { doubleClick = false, timeout = 10000 } = options

  let command = `${TOOL_COMMANDS.BROWSER} act click --ref "${ref}"`

  if (doubleClick) {
    command += ' --doubleClick'
  }

  command += ` --timeout ${timeout}`

  return executeTool('browser-click', command)
}

/**
 * Browser 输入文本
 */
export async function browserType(
  ref: string,
  text: string,
  options: { slowly?: boolean; timeout?: number } = {}
): Promise<CliResult> {
  const { slowly = false, timeout = 10000 } = options

  let command = `${TOOL_COMMANDS.BROWSER} act type --ref "${ref}" --text "${text.replace(/"/g, '\\"')}"`

  if (slowly) {
    command += ' --slowly'
  }

  command += ` --timeout ${timeout}`

  return executeTool('browser-type', command)
}

/**
 * Browser 导航到 URL
 */
export async function browserNavigate(
  url: string,
  options: { timeout?: number; loadState?: string } = {}
): Promise<CliResult> {
  const { timeout = 30000, loadState = 'domcontentloaded' } = options

  const command = `${TOOL_COMMANDS.BROWSER} navigate --url "${url}" --loadState ${loadState} --timeout ${timeout}`

  return executeTool('browser-navigate', command)
}

// ==================== Process 管理 ====================

/**
 * 列出运行中的进程
 */
export async function processList(): Promise<CliResult> {
  const command = `${TOOL_COMMANDS.PROCESS} list`
  return executeTool('process-list', command)
}

/**
 * 发送按键到进程
 */
export async function processSendKeys(
  sessionId: string,
  options: { keys?: string[]; text?: string; literal?: string } = {}
): Promise<CliResult> {
  const { keys, text, literal } = options

  let command = `${TOOL_COMMANDS.PROCESS} send-keys --sessionId "${sessionId}"`

  if (keys && keys.length > 0) {
    for (const key of keys) {
      command += ` --keys ${key}`
    }
  }

  if (text) {
    command += ` --text "${text.replace(/"/g, '\\"')}"`
  }

  if (literal) {
    command += ` --literal "${literal.replace(/"/g, '\\"')}"`
  }

  return executeTool('process-send-keys', command)
}

/**
 * 终止进程
 */
export async function processKill(
  sessionId: string
): Promise<CliResult> {
  const command = `${TOOL_COMMANDS.PROCESS} kill --sessionId "${sessionId}"`
  return executeTool('process-kill', command)
}

// ==================== Nodes 管理 ====================

/**
 * 获取 Nodes 状态
 */
export async function nodesStatus(): Promise<CliResult> {
  const command = `${TOOL_COMMANDS.NODES} status`
  return executeTool('nodes-status', command)
}

/**
 * 发送 Node 通知
 */
export async function nodesNotify(
  nodeId: string,
  title: string,
  body: string,
  options: { priority?: string; delivery?: string } = {}
): Promise<CliResult> {
  const { priority = 'active', delivery = 'auto' } = options

  const command = `${TOOL_COMMANDS.NODES} notify --node "${nodeId}" --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --priority ${priority} --delivery ${delivery}`

  return executeTool('nodes-notify', command)
}

// ==================== Message 发送 ====================

/**
 * 发送消息
 */
export async function messageSend(
  target: string,
  message: string,
  options: { channel?: string; replyTo?: string; silent?: boolean } = {}
): Promise<CliResult> {
  const { channel, replyTo, silent = false } = options

  let command = `${TOOL_COMMANDS.MESSAGE} send --target "${target}" --message "${message.replace(/"/g, '\\"')}"`

  if (channel) {
    command += ` --channel "${channel}"`
  }

  if (replyTo) {
    command += ` --replyTo "${replyTo}"`
  }

  if (silent) {
    command += ' --silent'
  }

  return executeTool('message-send', command)
}

// ==================== Web 操作 ====================

/**
 * Web 搜索
 */
export async function webSearch(
  query: string,
  options: {
    count?: number
    country?: string
    freshness?: string
    ui_lang?: string
    search_lang?: string
  } = {}
): Promise<CliResult> {
  const {
    count = 10,
    country = 'US',
    freshness,
    ui_lang,
    search_lang,
  } = options

  let command = `${TOOL_COMMANDS.WEB_SEARCH} --query "${query.replace(/"/g, '\\"')}" --count ${count} --country ${country}`

  if (freshness) {
    command += ` --freshness "${freshness}"`
  }

  if (ui_lang) {
    command += ` --ui_lang "${ui_lang}"`
  }

  if (search_lang) {
    command += ` --search_lang "${search_lang}"`
  }

  return executeTool('web-search', command)
}

/**
 * Web 抓取
 */
export async function webFetch(
  url: string,
  options: { extractMode?: string; maxChars?: number } = {}
): Promise<CliResult> {
  const { extractMode = 'markdown', maxChars = 10000 } = options

  let command = `${TOOL_COMMANDS.WEB_FETCH} --url "${url}" --extractMode ${extractMode} --maxChars ${maxChars}`

  return executeTool('web-fetch', command)
}

// ==================== TTS ====================

/**
 * 文本转语音
 */
export async function tts(
  text: string,
  channel?: string
): Promise<CliResult> {
  let command = `${TOOL_COMMANDS.TTS} --text "${text.replace(/"/g, '\\"')}"`

  if (channel) {
    command += ` --channel "${channel}"`
  }

  return executeTool('tts', command)
}

// ==================== 图像分析 ====================

/**
 * 分析图像
 */
export async function imageAnalyze(
  imagePath: string,
  prompt: string
): Promise<CliResult> {
  const command = `${TOOL_COMMANDS.IMAGE} --image "${imagePath}" --prompt "${prompt.replace(/"/g, '\\"')}"`
  return executeTool('image-analyze', command)
}

// ==================== PDF 分析 ====================

/**
 * 分析 PDF 文档
 */
export async function pdfAnalyze(
  pdfPath: string,
  prompt: string,
  pages?: string
): Promise<CliResult> {
  let command = `${TOOL_COMMANDS.PDF} --pdf "${pdfPath}" --prompt "${prompt.replace(/"/g, '\\"')}"`

  if (pages) {
    command += ` --pages "${pages}"`
  }

  return executeTool('pdf-analyze', command)
}

const toolsDefault = {
  readFile,
  writeFile,
  editFile,
  execCommand,
  browserSnapshot,
  browserClick,
  browserType,
  browserNavigate,
  processList,
  processSendKeys,
  processKill,
  nodesStatus,
  nodesNotify,
  messageSend,
  webSearch,
  webFetch,
  tts,
  imageAnalyze,
  pdfAnalyze,
  TOOL_COMMANDS,
}

export default toolsDefault
