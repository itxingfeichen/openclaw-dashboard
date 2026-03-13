/**
 * 错误响应格式化器
 * 将错误转换为统一的响应格式
 */

import AppError from '../errors/AppError.js'
import { ERROR_CODES } from '../errors/error-codes.js'

/**
 * 格式化错误响应
 * @param {Error} error - 错误对象
 * @param {Object} options - 格式化选项
 * @param {boolean} options.includeStack - 是否包含堆栈信息（仅开发环境）
 * @param {boolean} options.includeMetadata - 是否包含元数据
 * @returns {Object} 格式化的错误响应
 */
export function formatError(error, options = {}) {
  const { includeStack = false, includeMetadata = true } = options
  const isDev = process.env.NODE_ENV === 'development'

  // 默认响应结构
  const response = {
    success: false,
    error: {
      code: error.code || 'ERR_UNKNOWN',
      message: error.message || '未知错误',
      httpStatus: error.httpStatus || 500,
    },
    timestamp: new Date().toISOString(),
  }

  // 如果是 AppError，包含更多信息
  if (AppError.isAppError(error)) {
    response.error.name = error.name
    response.error.originalMessage = error.originalMessage

    if (includeMetadata && error.metadata && Object.keys(error.metadata).length > 0) {
      response.error.metadata = error.metadata
    }
  }

  // 开发环境包含堆栈信息
  if (isDev && includeStack && error.stack) {
    response.error.stack = error.stack.split('\n')
  }

  return response
}

/**
 * 创建错误响应
 * @param {Error} error - 错误对象
 * @param {number} statusCode - HTTP 状态码
 * @param {Object} options - 格式化选项
 * @returns {Object} 响应对象
 */
export function createErrorResponse(error, statusCode, options = {}) {
  const formattedError = formatError(error, options)
  return {
    statusCode,
    body: formattedError,
  }
}

/**
 * 格式化验证错误详情
 * @param {Array} details - 验证错误详情数组
 * @returns {Object} 格式化的验证错误
 */
export function formatValidationErrors(details) {
  return {
    success: false,
    error: {
      code: ERROR_CODES.ERR_VALIDATION.code,
      message: '验证失败',
      httpStatus: 400,
      details: details.map((detail) => ({
        field: detail.field || detail.path,
        message: detail.message,
        code: detail.code,
      })),
    },
    timestamp: new Date().toISOString(),
  }
}

export default {
  formatError,
  createErrorResponse,
  formatValidationErrors,
}
