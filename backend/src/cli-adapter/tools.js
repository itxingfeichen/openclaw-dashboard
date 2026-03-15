/**
 * OpenClaw Tools 执行器
 * 封装 OpenClaw CLI 的工具执行命令 (exec, read, write, browser 等)
 */

import { executeCli } from './executor.js'
import { validateCliOutput } from './schema.js'

/**
 * 工具命令配置
 */
const TOOL_COMMANDS = {
  // 文件操作
  READ_FILE: 'openclaw read',
  WRITE_FILE: 'openclaw write',
  EDIT_FILE: 'openclaw edit',
  
  // Shell 执行
  EXEC_COMMAND: 'openclaw exec',
  
  // Browser 操作
  BROWSER_SNAPSHOT: 'openclaw browser snapshot',
  BROWSER_CLICK: 'openclaw browser act',
  BROWSER_TYPE: 'openclaw browser act',
  BROWSER_NAVIGATE: 'openclaw browser navigate',
  
  // Process 管理
  PROCESS_LIST: 'openclaw process list',
  PROCESS_SEND: 'openclaw process send-keys',
  PROCESS_KILL: 'openclaw process kill',
  
  // Nodes 管理
  NODES_STATUS: 'openclaw nodes status',
  NODES_NOTIFY: 'openclaw nodes notify',
  
  // Message 发送
  MESSAGE_SEND: 'openclaw message send',
  
  // Web 操作
  WEB_SEARCH: 'openclaw web_search',
  WEB_FETCH: 'openclaw web_fetch',
}

/**
 * 执行工具命令的通用包装器
 * @param {string} toolName - 工具名称
 * @param {string} command - 完整命令
 * @param {Object} options - 执行选项
 * @returns {Promise<Object>} 执行结果
 */
async function executeTool(toolName, command, options = {}) {
  const result = await executeCli(command, {
    timeout: 60000,
    retries: 1,
    parseJson: true,
    ...options,
  })

  if (!result.success) {
    return {
      success: false,
      tool: toolName,
      error: result.error,
      exitCode: result.exitCode,
    }
  }

  const validation = validateCliOutput(command, result.data)
  
  return {
    success: true,
    tool: toolName,
    data: result.data,
    rawOutput: result.rawOutput,
    validation,
  }
}

/**
 * 读取文件内容
 * @param {string} path - 文件路径
 * @param {Object} options - 选项 (offset, limit)
 * @returns {Promise<Object>} 文件内容
 */
export async function readFile(path, options = {}) {
  const { offset = 0, limit = 2000 } = options
  const command = `openclaw read --path "${path}" --offset ${offset} --limit ${limit}`
  
  return executeTool('read', command, { parseJson: false })
}

/**
 * 写入文件内容
 * @param {string} path - 文件路径
 * @param {string} content - 文件内容
 * @returns {Promise<Object>} 执行结果
 */
export async function writeFile(path, content) {
  // 使用临时文件方式写入，避免命令行转义问题
  const command = `openclaw write --path "${path}"`
  
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execPromise = promisify(exec)
  
  try {
    // 通过 stdin 传递内容
    const child = exec(command, { timeout: 30000 })
    child.stdin.write(content)
    child.stdin.end()
    
    return new Promise((resolve, reject) => {
      let stdout = ''
      let stderr = ''
      
      child.stdout.on('data', (data) => { stdout += data })
      child.stderr.on('data', (data) => { stderr += data })
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            tool: 'write',
            data: { path, bytesWritten: content.length },
          })
        } else {
          resolve({
            success: false,
            tool: 'write',
            error: stderr || 'Write failed',
          })
        }
      })
      
      child.on('error', (err) => {
        resolve({
          success: false,
          tool: 'write',
          error: err.message,
        })
      })
    })
  } catch (error) {
    return {
      success: false,
      tool: 'write',
      error: error.message,
    }
  }
}

/**
 * 编辑文件 (精确替换)
 * @param {string} path - 文件路径
 * @param {string} oldText - 要替换的原文本
 * @param {string} newText - 新文本
 * @returns {Promise<Object>} 执行结果
 */
export async function editFile(path, oldText, newText) {
  // 编辑命令需要通过 JSON 传递参数
  const params = {
    path,
    oldText,
    newText,
  }
  
  const command = `echo '${JSON.stringify(params)}' | openclaw edit --path "${path}"`
  
  return executeTool('edit', command, { parseJson: false })
}

/**
 * 执行 Shell 命令
 * @param {string} command - Shell 命令
 * @param {Object} options - 选项 (timeout, workdir, env)
 * @returns {Promise<Object>} 执行结果
 */
export async function execCommand(command, options = {}) {
  const { timeout = 30000, workdir, env } = options
  
  let execCmd = `openclaw exec --command "${command.replace(/"/g, '\\"')}" --timeout ${timeout}`
  
  if (workdir) {
    execCmd += ` --workdir "${workdir}"`
  }
  
  if (env && typeof env === 'object') {
    for (const [key, value] of Object.entries(env)) {
      execCmd += ` --env ${key}="${value}"`
    }
  }
  
  return executeTool('exec', execCmd)
}

/**
 * 获取 Browser 快照
 * @param {Object} options - 选项 (url, profile, target)
 * @returns {Promise<Object>} 快照数据
 */
export async function browserSnapshot(options = {}) {
  const { url, profile = 'openclaw', target = 'host', refs = 'aria' } = options
  
  let command = `openclaw browser snapshot --profile "${profile}" --target "${target}" --refs "${refs}"`
  
  if (url) {
    command += ` --url "${url}"`
  }
  
  return executeTool('browser.snapshot', command)
}

/**
 * Browser 点击操作
 * @param {string} ref - 元素引用
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 执行结果
 */
export async function browserClick(ref, options = {}) {
  const { profile = 'openclaw', target = 'host' } = options
  
  const command = `openclaw browser act --action click --ref "${ref}" --profile "${profile}" --target "${target}"`
  
  return executeTool('browser.click', command)
}

/**
 * Browser 输入操作
 * @param {string} ref - 元素引用
 * @param {string} text - 输入文本
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 执行结果
 */
export async function browserType(ref, text, options = {}) {
  const { profile = 'openclaw', target = 'host' } = options
  
  const command = `openclaw browser act --action type --ref "${ref}" --text "${text}" --profile "${profile}" --target "${target}"`
  
  return executeTool('browser.type', command)
}

/**
 * Browser 导航
 * @param {string} url - 目标 URL
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 执行结果
 */
export async function browserNavigate(url, options = {}) {
  const { profile = 'openclaw', target = 'host', loadState = 'load' } = options
  
  const command = `openclaw browser navigate --url "${url}" --profile "${profile}" --target "${target}" --load-state "${loadState}"`
  
  return executeTool('browser.navigate', command)
}

/**
 * 列出进程
 * @returns {Promise<Object>} 进程列表
 */
export async function processList() {
  const command = 'openclaw process list'
  return executeTool('process.list', command)
}

/**
 * 发送按键到进程
 * @param {string} sessionId - 会话 ID
 * @param {Object} keys - 按键数据
 * @returns {Promise<Object>} 执行结果
 */
export async function processSendKeys(sessionId, keys) {
  const command = `openclaw process send-keys --sessionId "${sessionId}" --keys "${JSON.stringify(keys).replace(/"/g, '\\"')}"`
  return executeTool('process.send-keys', command)
}

/**
 * 终止进程
 * @param {string} sessionId - 会话 ID
 * @returns {Promise<Object>} 执行结果
 */
export async function processKill(sessionId) {
  const command = `openclaw process kill --sessionId "${sessionId}"`
  return executeTool('process.kill', command)
}

/**
 * 获取 Nodes 状态
 * @returns {Promise<Object>} Nodes 状态
 */
export async function nodesStatus() {
  const command = 'openclaw nodes status'
  return executeTool('nodes.status', command)
}

/**
 * 发送通知到 Node
 * @param {string} nodeId - Node ID
 * @param {string} title - 通知标题
 * @param {string} body - 通知内容
 * @returns {Promise<Object>} 执行结果
 */
export async function nodesNotify(nodeId, title, body) {
  const command = `openclaw nodes notify --node "${nodeId}" --title "${title}" --body "${body}"`
  return executeTool('nodes.notify', command)
}

/**
 * 发送消息
 * @param {string} target - 目标频道/用户
 * @param {string} message - 消息内容
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 执行结果
 */
export async function messageSend(target, message, options = {}) {
  const { channel, replyTo, silent = false } = options
  
  let command = `openclaw message send --target "${target}" --message "${message.replace(/"/g, '\\"')}"`
  
  if (channel) {
    command += ` --channel "${channel}"`
  }
  
  if (replyTo) {
    command += ` --reply-to "${replyTo}"`
  }
  
  if (silent) {
    command += ' --silent'
  }
  
  return executeTool('message.send', command)
}

/**
 * Web 搜索
 * @param {string} query - 搜索关键词
 * @param {Object} options - 选项 (count, country, freshness)
 * @returns {Promise<Object>} 搜索结果
 */
export async function webSearch(query, options = {}) {
  const { count = 10, country = 'US', freshness } = options
  
  let command = `openclaw web_search --query "${query}" --count ${count} --country "${country}"`
  
  if (freshness) {
    command += ` --freshness "${freshness}"`
  }
  
  return executeTool('web_search', command)
}

/**
 * Web 抓取
 * @param {string} url - 目标 URL
 * @param {Object} options - 选项 (extractMode, maxChars)
 * @returns {Promise<Object>} 页面内容
 */
export async function webFetch(url, options = {}) {
  const { extractMode = 'markdown', maxChars = 10000 } = options
  
  const command = `openclaw web_fetch --url "${url}" --extract-mode "${extractMode}" --max-chars ${maxChars}`
  
  return executeTool('web_fetch', command, { parseJson: false })
}

export default {
  TOOL_COMMANDS,
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
}
