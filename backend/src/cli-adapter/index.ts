/**
 * CLI 适配层 - 主入口
 * OpenClaw CLI 命令封装，提供稳定的 API 接口
 */

// ==================== 类型导出 ====================
export * from './types.js'

// ==================== 核心执行器 ====================
export { executeCli, executeCliBatch } from './executor.js'

// ==================== Schema 校验 ====================
export {
  validateCliOutput,
  formatValidationError,
  getSchemas,
  registerSchema,
} from './schema.js'

// ==================== 文本解析器 ====================
export {
  parseAgentsOutput,
  parseCronOutput,
  parseStatusOutput,
  parseKeyValueOutput,
} from './parsers.js'

// ==================== 高级命令封装 ====================
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
  CLI_COMMANDS,
} from './commands.js'

// ==================== 工具执行 ====================
export {
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
  SESSION_COMMANDS,
} from './sessions.js'

// ==================== Agent 管理 ====================
export {
  listAgents,
  getAgentStatus as getAgentStatusDetail,
  createAgent,
  deleteAgent,
  getAgentConfig,
  updateAgentConfig,
  startAgent as startAgentFull,
  stopAgent as stopAgentFull,
  restartAgent as restartAgentFull,
  getAgentStats,
  listSubagents,
  AGENT_COMMANDS,
} from './agents.js'

// ==================== 版本信息 ====================
export const CLI_ADAPTER_VERSION = '2.0.0'
export const SUPPORTED_OPENCLAW_VERSION = '2026.3.2'
