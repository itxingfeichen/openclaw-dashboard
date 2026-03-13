/**
 * 具体错误类型定义
 * 所有错误类都继承自 AppError
 */

import AppError from './AppError.js'
import * as ERROR_CODES from './error-codes.js'

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_VALIDATION, message, metadata)
    this.name = 'ValidationError'
  }

  static requiredField(field, message) {
    return new ValidationError(message || `必填字段缺失：${field}`, { field })
  }

  static invalidFormat(field, expected, actual) {
    return new ValidationError(`格式错误：${field}`, { field, expected, actual })
  }

  static invalidType(field, expected, actual) {
    return new ValidationError(`类型错误：${field}`, { field, expected, actual })
  }

  static outOfRange(field, value, min, max) {
    return new ValidationError(`值超出范围：${field}`, { field, value, min, max })
  }
}

/**
 * 认证错误
 */
export class AuthError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_UNAUTHORIZED, message, metadata)
    this.name = 'AuthError'
  }

  static tokenMissing() {
    return new AuthError(ERROR_CODES.ERR_AUTH_TOKEN_MISSING.message)
  }

  static tokenInvalid() {
    return new AuthError(ERROR_CODES.ERR_AUTH_TOKEN_INVALID.message)
  }

  static tokenExpired() {
    return new AuthError(ERROR_CODES.ERR_AUTH_TOKEN_EXPIRED.message)
  }

  static invalidCredentials() {
    return new AuthError(ERROR_CODES.ERR_AUTH_CREDENTIALS_INVALID.message)
  }

  static permissionDenied(resource, action) {
    return new AuthError(ERROR_CODES.ERR_AUTH_PERMISSION_DENIED.message, { resource, action })
  }
}

/**
 * 资源不存在错误
 */
export class NotFoundError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_NOT_FOUND, message, metadata)
    this.name = 'NotFoundError'
  }

  static resource(type, id) {
    return new NotFoundError(`${type} 不存在：${id}`, { type, id })
  }
}

/**
 * 禁止访问错误
 */
export class ForbiddenError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_FORBIDDEN, message, metadata)
    this.name = 'ForbiddenError'
  }
}

/**
 * 资源冲突错误
 */
export class ConflictError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_CONFLICT, message, metadata)
    this.name = 'ConflictError'
  }

  static resourceExists(type, id) {
    return new ConflictError(`${type} 已存在：${id}`, { type, id })
  }
}

/**
 * 内部服务器错误
 */
export class InternalError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_INTERNAL, message, metadata)
    this.name = 'InternalError'
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_DB_QUERY, message, metadata)
    this.name = 'DatabaseError'
  }

  static connection(message) {
    return new DatabaseError(message || ERROR_CODES.ERR_DB_CONNECTION.message)
  }

  static query(message, query) {
    return new DatabaseError(message, { query })
  }

  static constraint(message, constraint) {
    return new DatabaseError(message || ERROR_CODES.ERR_DB_CONSTRAINT.message, { constraint })
  }

  static transaction(message) {
    return new DatabaseError(message || ERROR_CODES.ERR_DB_TRANSACTION.message)
  }
}

/**
 * 外部服务错误
 */
export class ExternalServiceError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_EXTERNAL_SERVICE, message, metadata)
    this.name = 'ExternalServiceError'
  }

  static timeout(service, timeoutMs) {
    return new ExternalServiceError(ERROR_CODES.ERR_EXTERNAL_TIMEOUT.message, { service, timeoutMs })
  }

  static rateLimit(service, retryAfter) {
    return new ExternalServiceError(ERROR_CODES.ERR_EXTERNAL_RATE_LIMIT.message, { service, retryAfter })
  }
}

/**
 * 文件错误
 */
export class FileError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_FILE_UPLOAD, message, metadata)
    this.name = 'FileError'
  }

  static notFound(filename) {
    return new FileError(ERROR_CODES.ERR_FILE_NOT_FOUND.message, { filename })
  }

  static invalidType(filename, allowedTypes) {
    return new FileError(ERROR_CODES.ERR_FILE_TYPE.message, { filename, allowedTypes })
  }

  static tooLarge(filename, size, maxSize) {
    return new FileError(ERROR_CODES.ERR_FILE_SIZE.message, { filename, size, maxSize })
  }
}

/**
 * 业务逻辑错误
 */
export class BusinessError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_INVALID_REQUEST, message, metadata)
    this.name = 'BusinessError'
  }

  static invalidState(current, expected) {
    return new BusinessError(ERROR_CODES.ERR_INVALID_STATE.message, { current, expected })
  }

  static operationNotAllowed(operation, reason) {
    return new BusinessError(ERROR_CODES.ERR_OPERATION_NOT_ALLOWED.message, { operation, reason })
  }

  static resourceLocked(resource, lockedBy) {
    return new BusinessError(ERROR_CODES.ERR_RESOURCE_LOCKED.message, { resource, lockedBy })
  }
}

/**
 * 请求限流错误
 */
export class RateLimitError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_TOO_MANY_REQUESTS, message, metadata)
    this.name = 'RateLimitError'
  }

  static tooManyRequests(retryAfter) {
    return new RateLimitError(ERROR_CODES.ERR_TOO_MANY_REQUESTS.message, { retryAfter })
  }
}

/**
 * 服务不可用错误
 */
export class ServiceUnavailableError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_SERVICE_UNAVAILABLE, message, metadata)
    this.name = 'ServiceUnavailableError'
  }
}

// 导出所有错误类
export const ErrorTypes = {
  ValidationError,
  AuthError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  InternalError,
  DatabaseError,
  ExternalServiceError,
  FileError,
  BusinessError,
  RateLimitError,
  ServiceUnavailableError,
}

export default ErrorTypes
