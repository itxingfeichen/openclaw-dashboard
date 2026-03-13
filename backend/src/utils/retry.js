/**
 * 重试机制工具函数
 * 支持指数退避、可配置重试次数、错误过滤
 */

import { logInfo, logWarn, logError } from './logger.js'

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 计算指数退避延迟
 * @param {number} attempt - 当前尝试次数（从 0 开始）
 * @param {number} baseDelay - 基础延迟（毫秒）
 * @param {number} maxDelay - 最大延迟（毫秒）
 * @param {number} multiplier - 退避乘数
 * @returns {number} 计算后的延迟（毫秒）
 */
export function calculateExponentialBackoff(attempt, baseDelay = 1000, maxDelay = 30000, multiplier = 2) {
  const exponentialDelay = baseDelay * Math.pow(multiplier, attempt)
  // 添加随机抖动（±10%），避免多个请求同时重试
  const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1)
  return Math.min(exponentialDelay + jitter, maxDelay)
}

/**
 * 重试配置选项
 * @typedef {Object} RetryOptions
 * @property {number} [maxRetries=3] - 最大重试次数
 * @property {number} [baseDelay=1000] - 基础延迟（毫秒）
 * @property {number} [maxDelay=30000] - 最大延迟（毫秒）
 * @property {number} [multiplier=2] - 退避乘数
 * @property {Function} [shouldRetry] - 自定义重试判断函数
 * @property {Function} [onRetry] - 重试回调函数
 * @property {boolean} [useExponentialBackoff=true] - 是否使用指数退避
 */

/**
 * 默认应该重试的错误
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否应该重试
 */
function defaultShouldRetry(error) {
  // 网络相关错误应该重试
  const retryableCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN']
  if (error.code && retryableCodes.includes(error.code)) {
    return true
  }

  // HTTP 5xx 错误应该重试
  if (error.httpStatus && error.httpStatus >= 500 && error.httpStatus < 600) {
    return true
  }

  // 429 限流错误应该重试
  if (error.httpStatus === 429) {
    return true
  }

  // 特定错误名称
  const retryableNames = [
    'ExternalServiceError',
    'ServiceUnavailableError',
    'DatabaseError',
    'TimeoutError',
  ]
  if (error.name && retryableNames.includes(error.name)) {
    return true
  }

  return false
}

/**
 * 带重试的异步函数执行
 * @param {Function} fn - 要执行的异步函数
 * @param {RetryOptions} [options] - 重试配置
 * @returns {Promise<any>} 函数执行结果
 * @throws {Error} 当所有重试都失败时抛出错误
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    shouldRetry: customShouldRetry,
    onRetry,
    useExponentialBackoff = true,
  } = options

  const shouldRetry = customShouldRetry || defaultShouldRetry
  let lastError
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      const result = await fn()
      return result
    } catch (error) {
      lastError = error
      attempt++

      // 检查是否应该重试
      if (attempt > maxRetries || !shouldRetry(error)) {
        logError('Retry failed', {
          error: error.message,
          attempt,
          maxRetries,
          willRetry: false,
        })
        throw error
      }

      // 计算延迟
      const delayMs = useExponentialBackoff
        ? calculateExponentialBackoff(attempt - 1, baseDelay, maxDelay, multiplier)
        : baseDelay

      logWarn('Retrying operation', {
        error: error.message,
        attempt,
        maxRetries,
        delayMs: Math.round(delayMs),
      })

      // 执行重试回调
      if (onRetry) {
        await onRetry({ error, attempt, maxRetries, delayMs })
      }

      // 等待后重试
      await delay(delayMs)
    }
  }

  throw lastError
}

/**
 * 带重试的 HTTP 请求
 * @param {Function} requestFn - HTTP 请求函数
 * @param {RetryOptions} [options] - 重试配置
 * @returns {Promise<any>} 请求结果
 */
export async function retryableRequest(requestFn, options = {}) {
  return withRetry(requestFn, {
    ...options,
    shouldRetry: options.shouldRetry || ((error) => {
      // HTTP 请求特定的重试逻辑
      if (error.httpStatus) {
        return error.httpStatus >= 500 || error.httpStatus === 429
      }
      return defaultShouldRetry(error)
    }),
  })
}

/**
 * 创建可重试的函数
 * @param {Function} fn - 原始函数
 * @param {RetryOptions} [options] - 重试配置
 * @returns {Function} 包装后的可重试函数
 */
export function createRetryableFunction(fn, options = {}) {
  return (...args) => withRetry(() => fn(...args), options)
}

export default {
  withRetry,
  retryableRequest,
  createRetryableFunction,
  calculateExponentialBackoff,
}
