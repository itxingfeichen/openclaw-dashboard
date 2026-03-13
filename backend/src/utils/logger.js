/**
 * 统一日志记录工具
 * 支持不同级别、格式化输出、错误上下文
 */

/**
 * 日志级别
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
}

/**
 * 当前日志级别（可通过环境变量配置）
 */
const currentLevel = (() => {
  const level = process.env.LOG_LEVEL?.toUpperCase()
  switch (level) {
    case 'DEBUG': return LogLevel.DEBUG
    case 'INFO': return LogLevel.INFO
    case 'WARN': return LogLevel.WARN
    case 'ERROR': return LogLevel.ERROR
    case 'SILENT': return LogLevel.SILENT
    default: return LogLevel.INFO
  }
})()

/**
 * 格式化时间戳
 * @returns {string} ISO 格式时间戳
 */
function getTimestamp() {
  return new Date().toISOString()
}

/**
 * 格式化日志消息
 * @param {string} level - 日志级别
 * @param {string} message - 消息
 * @param {Object} [context] - 上下文信息
 * @returns {string} 格式化的日志消息
 */
function formatLog(level, message, context = {}) {
  const timestamp = getTimestamp()
  const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level}] ${message}${contextStr}`
}

/**
 * 输出日志
 * @param {string} level - 日志级别
 * @param {number} levelNum - 日志级别数值
 * @param {string} message - 消息
 * @param {Object} [context] - 上下文信息
 */
function log(level, levelNum, message, context = {}) {
  if (levelNum < currentLevel) {
    return
  }

  const logMessage = formatLog(level, message, context)

  switch (levelNum) {
    case LogLevel.DEBUG:
      console.debug(logMessage)
      break
    case LogLevel.INFO:
      console.info(logMessage)
      break
    case LogLevel.WARN:
      console.warn(logMessage)
      break
    case LogLevel.ERROR:
      console.error(logMessage)
      break
  }
}

/**
 * 调试日志
 * @param {string} message - 消息
 * @param {Object} [context] - 上下文信息
 */
export function logDebug(message, context = {}) {
  log('DEBUG', LogLevel.DEBUG, message, context)
}

/**
 * 信息日志
 * @param {string} message - 消息
 * @param {Object} [context] - 上下文信息
 */
export function logInfo(message, context = {}) {
  log('INFO', LogLevel.INFO, message, context)
}

/**
 * 警告日志
 * @param {string} message - 消息
 * @param {Object} [context] - 上下文信息
 */
export function logWarn(message, context = {}) {
  log('WARN', LogLevel.WARN, message, context)
}

/**
 * 错误日志
 * @param {Error|string} errorOrMessage - 错误或消息
 * @param {Object} [context] - 上下文信息
 */
export function logError(errorOrMessage, context = {}) {
  let message
  let errorContext = { ...context }

  if (errorOrMessage instanceof Error) {
    message = errorOrMessage.message
    errorContext.error = {
      name: errorOrMessage.name,
      code: errorOrMessage.code,
      stack: errorOrMessage.stack,
    }
  } else {
    message = errorOrMessage
  }

  log('ERROR', LogLevel.ERROR, message, errorContext)
}

/**
 * 请求日志
 * @param {Object} req - Express 请求对象
 * @param {number} statusCode - HTTP 状态码
 * @param {number} duration - 请求耗时（毫秒）
 */
export function logRequest(req, statusCode, duration) {
  const context = {
    method: req.method,
    url: req.url,
    statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userId: req.user?.id,
  }

  if (statusCode >= 500) {
    logWarn('HTTP Error', context)
  } else if (statusCode >= 400) {
    logInfo('HTTP Client Error', context)
  } else {
    logDebug('HTTP Request', context)
  }
}

/**
 * 性能日志
 * @param {string} operation - 操作名称
 * @param {number} duration - 耗时（毫秒）
 * @param {Object} [context] - 上下文信息
 */
export function logPerformance(operation, duration, context = {}) {
  const perfContext = {
    operation,
    duration: `${duration}ms`,
    ...context,
  }

  if (duration > 1000) {
    logWarn('Slow operation', perfContext)
  } else {
    logDebug('Performance', perfContext)
  }
}

/**
 * 设置日志级别
 * @param {string} level - 日志级别
 */
export function setLogLevel(level) {
  const levelStr = level.toUpperCase()
  if (LogLevel[levelStr] !== undefined) {
    // 注意：这里不会实际改变 currentLevel，因为它是 const
    // 实际使用时应通过环境变量设置
    logInfo('Log level change requested', { level: levelStr })
  }
}

/**
 * 创建带前缀的日志器
 * @param {string} prefix - 日志前缀
 * @returns {Object} 日志器对象
 */
export function createLogger(prefix) {
  return {
    debug: (message, context = {}) => logDebug(`[${prefix}] ${message}`, context),
    info: (message, context = {}) => logInfo(`[${prefix}] ${message}`, context),
    warn: (message, context = {}) => logWarn(`[${prefix}] ${message}`, context),
    error: (errorOrMessage, context = {}) => logError(errorOrMessage, { prefix, ...context }),
  }
}

export default {
  LogLevel,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logRequest,
  logPerformance,
  createLogger,
}
