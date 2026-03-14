/**
 * Config Editor Service - Agent 配置文件编辑服务
 * 支持配置文件读取、编辑、保存、验证和历史记录管理
 * @module services/configEditorService
 */

import fs from 'fs/promises'
import path from 'path'
import { logInfo, logError, createLogger } from '../utils/logger.js'

const logger = createLogger('configEditorService')

/**
 * 配置文件格式枚举
 */
export const ConfigFormat = {
  YAML: 'yaml',
  JSON: 'json',
}

/**
 * 配置操作类型枚举
 */
export const ConfigOperation = {
  READ: 'read',
  UPDATE: 'update',
  CREATE: 'create',
  DELETE: 'delete',
}

/**
 * 默认工作目录
 */
const DEFAULT_WORKSPACE = '/home/admin/.openclaw/workspace'

/**
 * 配置文件存储目录
 */
const CONFIG_DIR = path.join(DEFAULT_WORKSPACE, 'agents')

/**
 * 历史记录存储目录
 */
const HISTORY_DIR = path.join(DEFAULT_WORKSPACE, '.config-history')

/**
 * 验证 Agent ID 格式
 * @param {string} agentId - Agent ID
 * @returns {boolean} 是否有效
 */
function isValidAgentId(agentId) {
  if (!agentId || typeof agentId !== 'string') {
    return false
  }
  
  // Agent ID 只能包含字母、数字、连字符和下划线
  const regex = /^[a-zA-Z0-9_-]+$/
  return regex.test(agentId) && agentId.length >= 2 && agentId.length <= 50
}

/**
 * 获取配置文件路径
 * @param {string} agentId - Agent ID
 * @param {string} format - 配置文件格式
 * @returns {string} 配置文件路径
 */
function getConfigPath(agentId, format = ConfigFormat.YAML) {
  const agentDir = path.join(CONFIG_DIR, agentId)
  const ext = format === ConfigFormat.YAML ? 'yaml' : 'json'
  return path.join(agentDir, `${agentId}-config.${ext}`)
}

/**
 * 获取历史记录目录路径
 * @param {string} agentId - Agent ID
 * @returns {string} 历史记录目录路径
 */
function getHistoryDir(agentId) {
  return path.join(HISTORY_DIR, agentId)
}

/**
 * 解析配置文件内容
 * @param {string} content - 文件内容
 * @param {string} format - 文件格式
 * @returns {Object} 解析后的配置对象
 */
function parseConfig(content, format) {
  try {
    if (format === ConfigFormat.JSON) {
      return JSON.parse(content)
    } else if (format === ConfigFormat.YAML) {
      // 简单的 YAML 解析（针对基础结构）
      // 生产环境应使用 js-yaml 库
      return parseSimpleYaml(content)
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }
  } catch (error) {
    const parseError = new Error(`配置文件解析失败：${error.message}`)
    parseError.code = 'PARSE_ERROR'
    throw parseError
  }
}

/**
 * 简单的 YAML 解析器（针对基础结构）
 * @param {string} yaml - YAML 内容
 * @returns {Object} 解析后的对象
 */
function parseSimpleYaml(yaml) {
  const result = {}
  const lines = yaml.split('\n')
  let currentSection = null
  let currentArray = null
  
  for (const line of lines) {
    // 跳过空行和注释
    if (!line.trim() || line.trim().startsWith('#')) {
      continue
    }
    
    // 检测顶层节（无缩进）
    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      const match = line.match(/^(\w+):\s*(.*)$/)
      if (match) {
        const [, key, value] = match
        currentSection = key
        currentArray = null
        
        if (value) {
          result[key] = parseYamlValue(value)
        } else {
          result[key] = {}
        }
      }
      continue
    }
    
    // 处理嵌套内容
    if (currentSection) {
      const trimmed = line.trim()
      
      // 数组项
      if (trimmed.startsWith('- ')) {
        if (!Array.isArray(result[currentSection])) {
          result[currentSection] = []
        }
        result[currentSection].push(parseYamlValue(trimmed.substring(2)))
        continue
      }
      
      // 键值对
      const match = trimmed.match(/^(\w+):\s*(.*)$/)
      if (match) {
        const [, key, value] = match
        if (typeof result[currentSection] === 'object' && !Array.isArray(result[currentSection])) {
          result[currentSection][key] = parseYamlValue(value)
        }
      }
    }
  }
  
  return result
}

/**
 * 解析 YAML 值
 * @param {string} value - YAML 值字符串
 * @returns {any} 解析后的值
 */
function parseYamlValue(value) {
  if (!value) {
    return null
  }
  
  // 移除引号
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  
  // 布尔值
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false
  
  // 数字
  if (/^\d+$/.test(value)) return parseInt(value, 10)
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value)
  
  // 日期
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value).toISOString()
  }
  
  return value
}

/**
 * 将配置对象序列化为字符串
 * @param {Object} config - 配置对象
 * @param {string} format - 输出格式
 * @returns {string} 序列化后的字符串
 */
function serializeConfig(config, format) {
  try {
    if (format === ConfigFormat.JSON) {
      return JSON.stringify(config, null, 2)
    } else if (format === ConfigFormat.YAML) {
      return serializeToYaml(config)
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }
  } catch (error) {
    const serializeError = new Error(`配置文件序列化失败：${error.message}`)
    serializeError.code = 'SERIALIZE_ERROR'
    throw serializeError
  }
}

/**
 * 将对象序列化为简单的 YAML 格式
 * @param {Object} obj - 对象
 * @param {number} indent - 缩进级别
 * @returns {string} YAML 字符串
 */
function serializeToYaml(obj, indent = 0) {
  const lines = []
  const prefix = '  '.repeat(indent)
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      lines.push(`${prefix}${key}:`)
    } else if (Array.isArray(value)) {
      lines.push(`${prefix}${key}:`)
      for (const item of value) {
        if (typeof item === 'object') {
          lines.push(`${prefix}  -`)
          lines.push(serializeToYaml(item, indent + 2))
        } else {
          lines.push(`${prefix}  - ${formatYamlValue(item)}`)
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`${prefix}${key}:`)
      lines.push(serializeToYaml(value, indent + 1))
    } else {
      lines.push(`${prefix}${key}: ${formatYamlValue(value)}`)
    }
  }
  
  return lines.join('\n')
}

/**
 * 格式化 YAML 值
 * @param {any} value - 值
 * @returns {string} 格式化后的字符串
 */
function formatYamlValue(value) {
  if (typeof value === 'string') {
    // 包含特殊字符时需要引号
    if (value.includes(':') || value.includes('#') || value.includes('"') || value.startsWith(' ')) {
      return `"${value.replace(/"/g, '\\"')}"`
    }
    return value
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  
  if (value instanceof Date) {
    return value.toISOString()
  }
  
  return String(value)
}

/**
 * 保存配置历史记录
 * @param {string} agentId - Agent ID
 * @param {Object} config - 配置对象
 * @param {string} operation - 操作类型
 * @returns {string} 历史记录文件路径
 */
async function saveHistory(agentId, config, operation) {
  const historyDir = getHistoryDir(agentId)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${timestamp}-${operation}.json`
  const filepath = path.join(historyDir, filename)
  
  try {
    // 确保历史记录目录存在
    await fs.mkdir(historyDir, { recursive: true })
    
    // 保存历史记录
    const historyEntry = {
      timestamp: new Date().toISOString(),
      operation,
      config,
    }
    
    await fs.writeFile(filepath, JSON.stringify(historyEntry, null, 2), 'utf-8')
    
    logInfo(`Saved config history for ${agentId}`, { filepath, operation })
    
    return filepath
  } catch (error) {
    logError(`Failed to save config history for ${agentId}`, error)
    // 历史记录保存失败不应阻止主操作
    return null
  }
}

/**
 * 验证配置对象
 * @param {Object} config - 配置对象
 * @returns {Object} 验证结果
 */
function validateConfig(config) {
  const errors = []
  const warnings = []
  
  // 检查必要字段
  if (!config.agent) {
    errors.push('缺少必要字段：agent')
  } else {
    // 验证 agent.name
    if (!config.agent.name) {
      errors.push('缺少必要字段：agent.name')
    } else if (!isValidAgentId(config.agent.name)) {
      errors.push('agent.name 格式无效，只能包含字母、数字、连字符和下划线（2-50 字符）')
    }
    
    // 验证 agent.model
    if (!config.agent.model) {
      errors.push('缺少必要字段：agent.model')
    }
    
    // 验证 agent.tools
    if (!config.agent.tools || !Array.isArray(config.agent.tools)) {
      errors.push('缺少必要字段：agent.tools 或格式不正确')
    } else if (config.agent.tools.length === 0) {
      warnings.push('agent.tools 为空，Agent 将没有任何工具')
    }
    
    // 验证 agent.workspace
    if (!config.agent.workspace) {
      errors.push('缺少必要字段：agent.workspace')
    } else if (!path.isAbsolute(config.agent.workspace)) {
      errors.push('agent.workspace 必须是绝对路径')
    }
  }
  
  // 检查 metadata
  if (!config.metadata) {
    warnings.push('缺少 metadata 字段（可选）')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 读取 Agent 配置
 * @param {string} agentId - Agent ID
 * @returns {Object} 配置对象和元数据
 */
export async function getConfig(agentId) {
  if (!isValidAgentId(agentId)) {
    const error = new Error('无效的 Agent ID 格式')
    error.code = 'INVALID_AGENT_ID'
    throw error
  }
  
  logInfo('Fetching config', { agentId })
  
  try {
    // 尝试 YAML 格式
    const yamlPath = getConfigPath(agentId, ConfigFormat.YAML)
    let content
    let format = ConfigFormat.YAML
    
    try {
      content = await fs.readFile(yamlPath, 'utf-8')
    } catch (error) {
      // 如果 YAML 不存在，尝试 JSON 格式
      if (error.code === 'ENOENT') {
        const jsonPath = getConfigPath(agentId, ConfigFormat.JSON)
        content = await fs.readFile(jsonPath, 'utf-8')
        format = ConfigFormat.JSON
      } else {
        throw error
      }
    }
    
    const config = parseConfig(content, format)
    
    logInfo(`Retrieved config for ${agentId}`, { format })
    
    return {
      config,
      format,
      path: format === ConfigFormat.YAML ? yamlPath : jsonPath,
    }
  } catch (error) {
    logError(`Failed to fetch config for ${agentId}`, error)
    
    if (error.code === 'ENOENT') {
      const notFoundError = new Error(`Agent 配置不存在：${agentId}`)
      notFoundError.code = 'CONFIG_NOT_FOUND'
      notFoundError.agentId = agentId
      throw notFoundError
    }
    
    if (error.code === 'PARSE_ERROR') {
      throw error
    }
    
    const ioError = new Error(`读取配置文件失败：${error.message}`)
    ioError.code = 'IO_ERROR'
    throw ioError
  }
}

/**
 * 保存 Agent 配置
 * @param {string} agentId - Agent ID
 * @param {Object} config - 配置对象
 * @param {Object} options - 选项
 * @param {string} options.format - 配置文件格式
 * @param {boolean} options.saveHistory - 是否保存历史记录
 * @returns {Object} 保存结果
 */
export async function saveConfig(agentId, config, options = {}) {
  const {
    format = ConfigFormat.YAML,
    saveHistory: shouldSaveHistory = true,
  } = options
  
  if (!isValidAgentId(agentId)) {
    const error = new Error('无效的 Agent ID 格式')
    error.code = 'INVALID_AGENT_ID'
    throw error
  }
  
  if (!config || typeof config !== 'object') {
    const error = new Error('配置必须是非空对象')
    error.code = 'INVALID_CONFIG'
    throw error
  }
  
  logInfo('Saving config', { agentId, format, saveHistory: shouldSaveHistory })
  
  try {
    // 验证配置
    const validation = validateConfig(config)
    if (!validation.valid) {
      const validationError = new Error('配置验证失败')
      validationError.code = 'VALIDATION_ERROR'
      validationError.details = validation.errors
      throw validationError
    }
    
    // 确保 Agent 目录存在
    const configPath = getConfigPath(agentId, format)
    const agentDir = path.dirname(configPath)
    await fs.mkdir(agentDir, { recursive: true })
    
    // 保存历史记录（如果需要）
    if (shouldSaveHistory) {
      // 尝试读取旧配置用于历史对比
      let oldConfig = null
      try {
        const existing = await getConfig(agentId)
        oldConfig = existing.config
      } catch (error) {
        // 配置不存在，无需保存旧配置
      }
      
      if (oldConfig) {
        await saveHistory(agentId, oldConfig, ConfigOperation.UPDATE)
      } else {
        await saveHistory(agentId, config, ConfigOperation.CREATE)
      }
    }
    
    // 序列化并保存配置
    const content = serializeConfig(config, format)
    await fs.writeFile(configPath, content, 'utf-8')
    
    logInfo(`Saved config for ${agentId}`, { path: configPath, format })
    
    return {
      success: true,
      path: configPath,
      format,
      config,
      warnings: validation.warnings,
    }
  } catch (error) {
    logError(`Failed to save config for ${agentId}`, error)
    
    if (error.code === 'VALIDATION_ERROR' || error.code === 'INVALID_AGENT_ID' || error.code === 'INVALID_CONFIG') {
      throw error
    }
    
    if (error.code === 'SERIALIZE_ERROR') {
      throw error
    }
    
    const ioError = new Error(`保存配置文件失败：${error.message}`)
    ioError.code = 'IO_ERROR'
    throw ioError
  }
}

/**
 * 验证 Agent 配置
 * @param {Object} config - 配置对象
 * @returns {Object} 验证结果
 */
export async function validateConfigEndpoint(config) {
  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      errors: ['配置必须是非空对象'],
      warnings: [],
    }
  }
  
  logInfo('Validating config')
  
  const validation = validateConfig(config)
  
  logInfo(`Validation result: ${validation.valid ? 'passed' : 'failed'}`, {
    errorCount: validation.errors.length,
    warningCount: validation.warnings.length,
  })
  
  return validation
}

/**
 * 获取配置历史记录
 * @param {string} agentId - Agent ID
 * @param {Object} options - 选项
 * @param {number} options.limit - 返回记录数量限制
 * @returns {Array} 历史记录列表
 */
export async function getConfigHistory(agentId, options = {}) {
  const { limit = 20 } = options
  
  if (!isValidAgentId(agentId)) {
    const error = new Error('无效的 Agent ID 格式')
    error.code = 'INVALID_AGENT_ID'
    throw error
  }
  
  logInfo('Fetching config history', { agentId, limit })
  
  try {
    const historyDir = getHistoryDir(agentId)
    
    // 检查历史记录目录是否存在
    try {
      await fs.access(historyDir)
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 历史记录不存在，返回空列表
        return {
          history: [],
          count: 0,
          agentId,
        }
      }
      throw error
    }
    
    // 读取历史记录文件
    const files = await fs.readdir(historyDir)
    
    // 过滤并排序（按时间倒序）
    const historyFiles = files
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a)) // 倒序排列
      .slice(0, limit)
    
    // 读取文件内容
    const history = []
    for (const file of historyFiles) {
      try {
        const filepath = path.join(historyDir, file)
        const content = await fs.readFile(filepath, 'utf-8')
        const entry = JSON.parse(content)
        history.push({
          filename: file,
          ...entry,
        })
      } catch (error) {
        logError(`Failed to read history file ${file}`, error)
        // 跳过损坏的文件
      }
    }
    
    logInfo(`Retrieved ${history.length} history entries for ${agentId}`)
    
    return {
      history,
      count: history.length,
      agentId,
    }
  } catch (error) {
    logError(`Failed to fetch config history for ${agentId}`, error)
    
    if (error.code === 'INVALID_AGENT_ID') {
      throw error
    }
    
    const ioError = new Error(`读取配置历史失败：${error.message}`)
    ioError.code = 'IO_ERROR'
    throw ioError
  }
}

/**
 * 恢复配置到历史版本
 * @param {string} agentId - Agent ID
 * @param {string} historyFilename - 历史记录文件名
 * @returns {Object} 恢复结果
 */
export async function restoreConfigFromHistory(agentId, historyFilename) {
  if (!isValidAgentId(agentId)) {
    const error = new Error('无效的 Agent ID 格式')
    error.code = 'INVALID_AGENT_ID'
    throw error
  }
  
  if (!historyFilename || !historyFilename.endsWith('.json')) {
    const error = new Error('无效的历史记录文件名')
    error.code = 'INVALID_HISTORY_FILE'
    throw error
  }
  
  logInfo('Restoring config from history', { agentId, historyFilename })
  
  try {
    const historyDir = getHistoryDir(agentId)
    const filepath = path.join(historyDir, historyFilename)
    
    // 读取历史记录
    const content = await fs.readFile(filepath, 'utf-8')
    const historyEntry = JSON.parse(content)
    
    if (!historyEntry.config) {
      const error = new Error('历史记录格式无效')
      error.code = 'INVALID_HISTORY_FORMAT'
      throw error
    }
    
    // 保存当前配置到历史（作为回滚点）
    try {
      const current = await getConfig(agentId)
      await saveHistory(agentId, current.config, ConfigOperation.UPDATE)
    } catch (error) {
      // 当前配置可能不存在，继续恢复
    }
    
    // 恢复配置
    const result = await saveConfig(agentId, historyEntry.config, {
      saveHistory: false, // 避免循环保存
    })
    
    logInfo(`Restored config for ${agentId} from ${historyFilename}`)
    
    return {
      success: true,
      restoredFrom: historyFilename,
      timestamp: historyEntry.timestamp,
      config: result.config,
    }
  } catch (error) {
    logError(`Failed to restore config for ${agentId}`, error)
    
    if (error.code === 'INVALID_AGENT_ID' || error.code === 'INVALID_HISTORY_FILE') {
      throw error
    }
    
    if (error.code === 'ENOENT') {
      const notFoundError = new Error(`历史记录文件不存在：${historyFilename}`)
      notFoundError.code = 'HISTORY_FILE_NOT_FOUND'
      throw notFoundError
    }
    
    throw error
  }
}

export default {
  getConfig,
  saveConfig,
  validateConfigEndpoint,
  getConfigHistory,
  restoreConfigFromHistory,
  ConfigFormat,
  ConfigOperation,
}
