/**
 * CLI 适配层
 * OpenClaw CLI 命令封装，提供稳定的 API 接口
 */

// 导出命令执行器
export { executeCli, executeCliBatch } from './executor.js'

// 导出 Schema 校验
export {
  validateCliOutput,
  formatValidationError,
} from './schema.js'

// 导出 CLI 命令
export {
  getStatus,
  getAgentsList,
  getSessionsList,
  getCronList,
  getConfig,
  executeCustomCommand,
} from './commands.js'

// 导出文本解析器
export {
  parseAgentsOutput,
  parseCronOutput,
  parseStatusOutput,
  parseKeyValueOutput,
} from './parsers.js'

// 导出命令常量
export { default as cliCommands } from './commands.js'

// 导出 Schema 定义
export { default as cliSchemas } from './schema.js'

// 导出执行器
export { default as cliExecutor } from './executor.js'

// 导出解析器
export { default as cliParsers } from './parsers.js'
