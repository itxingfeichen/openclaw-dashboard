/**
 * 全局错误处理中间件
 * 捕获并处理所有未处理的错误
 */

import AppError from '../errors/AppError.js'
import { formatError, formatValidationErrors } from './error-formatter.js'
import { ERROR_CODES } from '../errors/error-codes.js'
import { logError } from '../utils/logger.js'
import { trackError } from '../utils/error-tracker.js'

/**
 * 全局错误处理中间件
 * 应该作为最后一个中间件注册
 */
export function errorHandler() {
  return async (err, req, res, next) => {
    // 确保错误是 Error 对象
    if (!(err instanceof Error)) {
      err = new Error(String(err))
    }

    // 记录错误日志
    logError(err, {
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      ip: req.ip,
    })

    // 追踪错误
    trackError(err, {
      method: req.method,
      url: req.url,
      userId: req.user?.id,
    })

    // 确定 HTTP 状态码
    let statusCode = err.httpStatus || 500

    // 处理特定类型的错误
    if (err.name === 'ValidationError') {
      statusCode = 400
      // 如果是 express-validator 的验证错误
      if (err.errors && Array.isArray(err.errors)) {
        const response = formatValidationErrors(err.errors)
        return res.status(statusCode).json(response)
      }
    } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
      // JSON 解析错误
      statusCode = 400
      err = new AppError(ERROR_CODES.ERR_INVALID_REQUEST, '无效的 JSON 格式')
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      // 网络连接错误
      statusCode = 503
      err = new AppError(ERROR_CODES.ERR_SERVICE_UNAVAILABLE, '服务暂时不可用')
    } else if (err.name === 'TokenExpiredError') {
      // JWT 令牌过期
      statusCode = 401
      err = AppError.fromConfig(ERROR_CODES.ERR_AUTH_TOKEN_EXPIRED)
    } else if (err.name === 'JsonWebTokenError') {
      // JWT 令牌无效
      statusCode = 401
      err = AppError.fromConfig(ERROR_CODES.ERR_AUTH_TOKEN_INVALID)
    }

    // 格式化错误响应
    const isDev = process.env.NODE_ENV === 'development'
    const formattedError = formatError(err, {
      includeStack: isDev,
      includeMetadata: true,
    })

    // 发送响应
    res.status(statusCode).json(formattedError)
  }
}

/**
 * 异步处理器包装器
 * 自动捕获异步错误并传递给错误处理中间件
 * @param {Function} fn - 异步处理函数
 * @returns {Function} 包装后的处理函数
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 创建路由处理函数（自动错误处理）
 * @param {Function} handler - 路由处理函数
 * @returns {Function} 包装后的处理函数
 */
export function createHandler(handler) {
  return asyncHandler(handler)
}

/**
 * 404 错误处理中间件
 */
export function notFoundHandler() {
  return (req, res, next) => {
    const err = AppError.fromConfig(ERROR_CODES.ERR_NOT_FOUND, `无法找到资源：${req.method} ${req.url}`)
    next(err)
  }
}

export default {
  errorHandler,
  asyncHandler,
  createHandler,
  notFoundHandler,
}
