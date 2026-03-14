/**
 * Log Service - 日志读取服务
 * 提供日志文件读取、解析、过滤、搜索功能
 * @module services/logService
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logInfo, logError, createLogger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logger = createLogger('logService')

/**
 * 日志级别映射
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

/**
 * 日志级别字符串到数值的映射
 */
const LogLevelMap = {
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR,
}

/**
 * 默认日志源配置
 */
const DEFAULT_LOG_SOURCES = {
  application: {
    name: 'Application Log',
    path: '/home/admin/openclaw-dashboard/backend/logs/app.log',
    description: '应用程序主日志',
  },
  error: {
    name: 'Error Log',
    path: '/home/admin/openclaw-dashboard/backend/logs/error.log',
    description: '错误日志',
  },
  access: {
    name: 'Access Log',
    path: '/home/admin/openclaw-dashboard/backend/logs/access.log',
    description: '访问日志',
  },
}

/**
 * 动态注册的日志源（用于测试等场景）
 */
let dynamicLogSources = {}

/**
 * 获取日志源配置（支持扩展）
 * @returns {Object} 日志源配置对象
 */
export function getLogSources() {
  // 允许通过环境变量扩展日志源
  const customSources = process.env.LOG_SOURCES_PATH
  if (customSources) {
    try {
      const customConfig = JSON.parse(fs.readFileSync(customSources, 'utf-8'))
      return { ...DEFAULT_LOG_SOURCES, ...dynamicLogSources, ...customConfig }
    } catch (error) {
      logError('Failed to load custom log sources', error)
    }
  }
  return { ...DEFAULT_LOG_SOURCES, ...dynamicLogSources }
}

/**
 * 注册动态日志源（用于测试等场景）
 * @param {string} id - 日志源 ID
 * @param {Object} config - 日志源配置
 */
export function registerLogSource(id, config) {
  dynamicLogSources[id] = config
}

/**
 * 清除动态日志源（用于测试清理）
 */
export function clearDynamicLogSources() {
  dynamicLogSources = {}
}

/**
 * 解析单行日志
 * @param {string} line - 日志行
 * @returns {Object|null} 解析后的日志对象
 */
export function parseLogLine(line) {
  if (!line || !line.trim()) {
    return null
  }

  // 日志格式：[timestamp] [LEVEL] message {context}
  // 例如：[2026-03-14T00:12:00.000Z] [INFO] Server started {"port":8080}
  const regex = /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)$/
  const match = line.match(regex)

  if (!match) {
    // 无法解析的日志行，返回原始内容
    return {
      timestamp: null,
      level: 'UNKNOWN',
      message: line.trim(),
      context: null,
      raw: line,
    }
  }

  const [, timestamp, level, rest] = match
  let message = rest
  let context = null

  // 尝试提取 JSON 上下文
  const jsonMatch = rest.match(/^(.*)\s+(\{.*\})\s*$/)
  if (jsonMatch) {
    message = jsonMatch[1].trim()
    try {
      context = JSON.parse(jsonMatch[2])
    } catch (e) {
      message = rest
    }
  }

  return {
    timestamp,
    level: level.trim().toUpperCase(),
    message: message.trim(),
    context,
    raw: line,
  }
}

/**
 * 过滤日志级别
 * @param {string} logLevel - 日志级别字符串
 * @param {string} filterLevel - 过滤级别字符串
 * @returns {boolean} 是否通过过滤
 */
export function filterByLevel(logLevel, filterLevel) {
  if (!filterLevel) {
    return true
  }

  const logLevelNum = LogLevelMap[logLevel]
  const filterLevelNum = LogLevelMap[filterLevel.toUpperCase()]

  if (logLevelNum === undefined || filterLevelNum === undefined) {
    return true
  }

  // 返回指定级别及更严重的日志
  return logLevelNum >= filterLevelNum
}

/**
 * 过滤时间范围
 * @param {string} timestamp - 日志时间戳
 * @param {string} from - 起始时间
 * @param {string} to - 结束时间
 * @returns {boolean} 是否通过过滤
 */
export function filterByTime(timestamp, from, to) {
  if (!timestamp) {
    return true
  }

  const logTime = new Date(timestamp).getTime()

  if (from) {
    const fromTime = new Date(from).getTime()
    if (logTime < fromTime) {
      return false
    }
  }

  if (to) {
    const toTime = new Date(to).getTime()
    if (logTime > toTime) {
      return false
    }
  }

  return true
}

/**
 * 搜索日志内容
 * @param {string} message - 日志消息
 * @param {string} query - 搜索关键词
 * @returns {boolean} 是否匹配
 */
export function searchLog(message, query) {
  if (!query) {
    return true
  }
  return message.toLowerCase().includes(query.toLowerCase())
}

/**
 * 读取日志文件
 * @param {string} filePath - 日志文件路径
 * @returns {string[]} 日志行数组
 */
export function readLogFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Log file not found: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  return content.split('\n').filter(line => line.trim())
}

/**
 * 读取日志（支持分页、过滤）
 * @param {string} source - 日志源名称
 * @param {Object} options - 选项
 * @param {number} options.page - 页码（从 1 开始）
 * @param {number} options.limit - 每页数量
 * @param {string} options.level - 日志级别过滤
 * @param {string} options.from - 起始时间
 * @param {string} options.to - 结束时间
 * @returns {Object} 日志数据和分页信息
 */
export async function readLogs(source, options = {}) {
  const {
    page = 1,
    limit = 50,
    level,
    from,
    to,
  } = options

  const sources = getLogSources()
  const sourceConfig = sources[source]

  if (!sourceConfig) {
    const error = new Error(`Unknown log source: ${source}`)
    error.code = 'LOG_SOURCE_NOT_FOUND'
    throw error
  }

  logger.debug(`Reading logs from ${source}`, { page, limit, level, from, to })

  // 读取日志文件
  const lines = readLogFile(sourceConfig.path)

  // 解析和过滤日志
  const filteredLogs = []
  for (const line of lines) {
    const parsed = parseLogLine(line)
    if (!parsed) {
      continue
    }

    // 应用级别过滤
    if (!filterByLevel(parsed.level, level)) {
      continue
    }

    // 应用时间过滤
    if (!filterByTime(parsed.timestamp, from, to)) {
      continue
    }

    filteredLogs.push(parsed)
  }

  // 按时间倒序排序（最新的在前）
  filteredLogs.sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0
    if (!a.timestamp) return 1
    if (!b.timestamp) return -1
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  // 分页
  const total = filteredLogs.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const logs = filteredLogs.slice(startIndex, endIndex)

  logger.info(`Retrieved ${logs.length} logs from ${source}`, {
    total,
    page,
    limit,
    totalPages,
  })

  return {
    source,
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    filters: {
      level,
      from,
      to,
    },
  }
}

/**
 * 搜索日志
 * @param {string} source - 日志源名称
 * @param {string} query - 搜索关键词
 * @param {Object} options - 选项
 * @param {number} options.page - 页码
 * @param {number} options.limit - 每页数量
 * @returns {Object} 搜索结果和分页信息
 */
export async function searchLogs(source, query, options = {}) {
  const {
    page = 1,
    limit = 50,
  } = options

  if (!query || !query.trim()) {
    const error = new Error('Search query is required')
    error.code = 'SEARCH_QUERY_REQUIRED'
    throw error
  }

  const sources = getLogSources()
  const sourceConfig = sources[source]

  if (!sourceConfig) {
    const error = new Error(`Unknown log source: ${source}`)
    error.code = 'LOG_SOURCE_NOT_FOUND'
    throw error
  }

  logger.debug(`Searching logs in ${source}`, { query, page, limit })

  // 读取日志文件
  const lines = readLogFile(sourceConfig.path)

  // 解析和搜索日志
  const matchedLogs = []
  for (const line of lines) {
    const parsed = parseLogLine(line)
    if (!parsed) {
      continue
    }

    // 搜索消息和原始内容
    if (searchLog(parsed.message, query) || searchLog(parsed.raw, query)) {
      matchedLogs.push(parsed)
    }
  }

  // 按时间倒序排序
  matchedLogs.sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0
    if (!a.timestamp) return 1
    if (!b.timestamp) return -1
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  // 分页
  const total = matchedLogs.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const logs = matchedLogs.slice(startIndex, endIndex)

  logger.info(`Found ${logs.length} matching logs for "${query}"`, {
    total,
    page,
    limit,
  })

  return {
    source,
    query,
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * 获取日志统计信息
 * @param {string} source - 日志源名称
 * @returns {Object} 统计信息
 */
export async function getLogStats(source) {
  const sources = getLogSources()
  const sourceConfig = sources[source]

  if (!sourceConfig) {
    const error = new Error(`Unknown log source: ${source}`)
    error.code = 'LOG_SOURCE_NOT_FOUND'
    throw error
  }

  const lines = readLogFile(sourceConfig.path)
  
  const stats = {
    total: lines.length,
    byLevel: {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      UNKNOWN: 0,
    },
  }

  for (const line of lines) {
    const parsed = parseLogLine(line)
    if (parsed) {
      const level = parsed.level
      if (stats.byLevel[level] !== undefined) {
        stats.byLevel[level]++
      } else {
        stats.byLevel.UNKNOWN++
      }
    }
  }

  return stats
}

export default {
  getLogSources,
  parseLogLine,
  readLogs,
  searchLogs,
  getLogStats,
  LogLevel,
}
