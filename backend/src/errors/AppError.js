/**
 * 基础错误类
 * 所有自定义错误都应继承此类
 */

import { ERR_INTERNAL } from './error-codes.js'

class AppError extends Error {
  /**
   * @param {Object} errorConfig - 错误配置
   * @param {string} errorConfig.code - 错误码
   * @param {number} errorConfig.httpStatus - HTTP 状态码
   * @param {string} errorConfig.message - 错误消息
   * @param {string} [customMessage] - 可选的自定义消息
   * @param {Object} [metadata] - 可选的元数据
   */
  constructor(errorConfig = ERR_INTERNAL, customMessage, metadata = {}) {
    const message = customMessage || errorConfig.message
    super(message)

    this.name = this.constructor.name
    this.code = errorConfig.code
    this.httpStatus = errorConfig.httpStatus
    this.originalMessage = errorConfig.message
    this.metadata = metadata
    this.timestamp = new Date().toISOString()

    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * 转换为 JSON 格式
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
      metadata: this.metadata,
      timestamp: this.timestamp,
    }
  }

  /**
   * 判断是否为 AppError 实例
   */
  static isAppError(error) {
    return error instanceof AppError
  }

  /**
   * 从错误配置创建错误实例
   */
  static fromConfig(errorConfig, customMessage, metadata) {
    return new AppError(errorConfig, customMessage, metadata)
  }
}

export default AppError
