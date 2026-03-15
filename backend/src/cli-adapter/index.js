/**
 * CLI 适配层 - 主入口
 * OpenClaw CLI 命令封装，提供稳定的 API 接口
 * 
 * 模块结构:
 * - executor.js: CLI 命令执行器 (超时、重试、错误处理)
 * - schema.js: Schema 校验 (Zod 风格验证)
 * - parsers.js: 文本输出解析器
 * - commands.js: 高级命令封装 (向后兼容)
 * - tools.js: 工具执行 (exec, read, write, browser 等)
 * - memory.js: 记忆操作 (search, get, reindex)
 * - sessions.js: 会话管理 (list, spawn, send, history)
 * - agents.js: Agent 管理 (list, status, create, delete)
 */

// ==================== 核心执行器 ====================
export { executeCli, executeCliBatch } from './executor.js'

// ==================== Schema 校验 ====================
export {
  validateCliOutput,
  formatValidationError,
} from './schema.js'

// ==================== 文本解析器 ====================
export {
  parseAgentsOutput,
  parseCronOutput,
  parseStatusOutput,
  parseKeyValueOutput,
} from './parsers.js'

// ==================== 高级命令封装 (向后兼容) ====================
export {
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
} from './commands.js'

// ==================== 工具执行 ====================
export {
  // 文件操作
  readFile,
  writeFile,
  editFile,
  // Shell 执行
  execCommand,
  // Browser 操作
  browserSnapshot,
  browserClick,
  browserType,
  browserNavigate,
  // Process 管理
  processList,
  processSendKeys,
  processKill,
  // Nodes 管理
  nodesStatus,
  nodesNotify,
  // Message 发送
  messageSend,
  // Web 操作
  webSearch,
  webFetch,
  // 工具命令常量
  TOOL_COMMANDS,
} from './tools.js'

// ==================== 记忆操作 ====================
export {
  searchMemory,
  getMemory,
  reindexMemory,
  getMemoryStatus,
  getMemoriesBySession,
  getMemoriesByAgent,
  deleteMemory,
  // 记忆命令常量
  MEMORY_COMMANDS,
} from './memory.js'

// ==================== 会话管理 ====================
export {
  listSessions,
  spawnSession,
  sendToSession,
  getSessionHistory,
  getSession,
  deleteSession,
  cleanupSessions,
  getSessionStats,
  // 会话命令常量
  SESSION_COMMANDS,
} from './sessions.js'

// ==================== Agent 管理 ====================
export {
  listAgents,
  getAgentStatus,
  createAgent,
  deleteAgent,
  getAgentConfig,
  updateAgentConfig,
  startAgent as startAgentFull,
  stopAgent as stopAgentFull,
  restartAgent as restartAgentFull,
  getAgentStats,
  listSubagents,
  // Agent 命令常量
  AGENT_COMMANDS,
} from './agents.js'

// ==================== 默认导出 ====================
import * as executor from './executor.js'
import * as schema from './schema.js'
import * as parsers from './parsers.js'
import * as commands from './commands.js'
import * as tools from './tools.js'
import * as memory from './memory.js'
import * as sessions from './sessions.js'
import * as agents from './agents.js'

export default {
  // 核心
  ...executor,
  // 校验
  ...schema,
  // 解析
  ...parsers,
  // 命令
  ...commands,
  // 工具
  ...tools,
  // 记忆
  ...memory,
  // 会话
  ...sessions,
  // Agent
  ...agents,
  // 模块引用
  executor,
  schema,
  parsers,
  commands,
  tools,
  memory,
  sessions,
  agents,
}

// ==================== 版本信息 ====================
export const CLI_ADAPTER_VERSION = '1.0.0'
export const SUPPORTED_OPENCLAW_VERSION = '2026.3.2'
