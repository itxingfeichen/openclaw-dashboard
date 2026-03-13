/**
 * 错误码定义
 * 格式：模块码 (2 位) + 子模块码 (2 位) + 具体错误码 (3 位)
 */

// 通用错误 (00xx)
export const ERR_INTERNAL = { code: 'ERR_INTERNAL', httpStatus: 500, message: '内部服务器错误' }
export const ERR_INVALID_REQUEST = { code: 'ERR_INVALID_REQUEST', httpStatus: 400, message: '无效的请求' }
export const ERR_NOT_FOUND = { code: 'ERR_NOT_FOUND', httpStatus: 404, message: '资源不存在' }
export const ERR_UNAUTHORIZED = { code: 'ERR_UNAUTHORIZED', httpStatus: 401, message: '未授权访问' }
export const ERR_FORBIDDEN = { code: 'ERR_FORBIDDEN', httpStatus: 403, message: '禁止访问' }
export const ERR_CONFLICT = { code: 'ERR_CONFLICT', httpStatus: 409, message: '资源冲突' }
export const ERR_TOO_MANY_REQUESTS = { code: 'ERR_TOO_MANY_REQUESTS', httpStatus: 429, message: '请求过于频繁' }
export const ERR_SERVICE_UNAVAILABLE = { code: 'ERR_SERVICE_UNAVAILABLE', httpStatus: 503, message: '服务不可用' }

// 验证错误 (10xx)
export const ERR_VALIDATION = { code: 'ERR_VALIDATION', httpStatus: 400, message: '验证失败' }
export const ERR_REQUIRED_FIELD = { code: 'ERR_REQUIRED_FIELD', httpStatus: 400, message: '必填字段缺失' }
export const ERR_INVALID_FORMAT = { code: 'ERR_INVALID_FORMAT', httpStatus: 400, message: '格式错误' }
export const ERR_INVALID_TYPE = { code: 'ERR_INVALID_TYPE', httpStatus: 400, message: '类型错误' }
export const ERR_OUT_OF_RANGE = { code: 'ERR_OUT_OF_RANGE', httpStatus: 400, message: '值超出范围' }

// 认证错误 (20xx)
export const ERR_AUTH_TOKEN_MISSING = { code: 'ERR_AUTH_TOKEN_MISSING', httpStatus: 401, message: '缺少认证令牌' }
export const ERR_AUTH_TOKEN_INVALID = { code: 'ERR_AUTH_TOKEN_INVALID', httpStatus: 401, message: '无效的认证令牌' }
export const ERR_AUTH_TOKEN_EXPIRED = { code: 'ERR_AUTH_TOKEN_EXPIRED', httpStatus: 401, message: '认证令牌已过期' }
export const ERR_AUTH_CREDENTIALS_INVALID = { code: 'ERR_AUTH_CREDENTIALS_INVALID', httpStatus: 401, message: '用户名或密码错误' }
export const ERR_AUTH_PERMISSION_DENIED = { code: 'ERR_AUTH_PERMISSION_DENIED', httpStatus: 403, message: '权限不足' }

// 数据库错误 (30xx)
export const ERR_DB_CONNECTION = { code: 'ERR_DB_CONNECTION', httpStatus: 503, message: '数据库连接失败' }
export const ERR_DB_QUERY = { code: 'ERR_DB_QUERY', httpStatus: 500, message: '数据库查询失败' }
export const ERR_DB_CONSTRAINT = { code: 'ERR_DB_CONSTRAINT', httpStatus: 409, message: '数据库约束冲突' }
export const ERR_DB_TRANSACTION = { code: 'ERR_DB_TRANSACTION', httpStatus: 500, message: '数据库事务失败' }

// 外部服务错误 (40xx)
export const ERR_EXTERNAL_SERVICE = { code: 'ERR_EXTERNAL_SERVICE', httpStatus: 502, message: '外部服务错误' }
export const ERR_EXTERNAL_TIMEOUT = { code: 'ERR_EXTERNAL_TIMEOUT', httpStatus: 504, message: '外部服务超时' }
export const ERR_EXTERNAL_RATE_LIMIT = { code: 'ERR_EXTERNAL_RATE_LIMIT', httpStatus: 429, message: '外部服务限流' }

// 文件错误 (50xx)
export const ERR_FILE_NOT_FOUND = { code: 'ERR_FILE_NOT_FOUND', httpStatus: 404, message: '文件不存在' }
export const ERR_FILE_UPLOAD = { code: 'ERR_FILE_UPLOAD', httpStatus: 400, message: '文件上传失败' }
export const ERR_FILE_TYPE = { code: 'ERR_FILE_TYPE', httpStatus: 400, message: '不支持的文件类型' }
export const ERR_FILE_SIZE = { code: 'ERR_FILE_SIZE', httpStatus: 400, message: '文件大小超出限制' }

// 业务错误 (60xx)
export const ERR_RESOURCE_EXISTS = { code: 'ERR_RESOURCE_EXISTS', httpStatus: 409, message: '资源已存在' }
export const ERR_RESOURCE_LOCKED = { code: 'ERR_RESOURCE_LOCKED', httpStatus: 423, message: '资源被锁定' }
export const ERR_INVALID_STATE = { code: 'ERR_INVALID_STATE', httpStatus: 400, message: '无效的状态' }
export const ERR_OPERATION_NOT_ALLOWED = { code: 'ERR_OPERATION_NOT_ALLOWED', httpStatus: 403, message: '操作不被允许' }

// 导出所有错误码
export const ERROR_CODES = {
  // 通用
  ERR_INTERNAL,
  ERR_INVALID_REQUEST,
  ERR_NOT_FOUND,
  ERR_UNAUTHORIZED,
  ERR_FORBIDDEN,
  ERR_CONFLICT,
  ERR_TOO_MANY_REQUESTS,
  ERR_SERVICE_UNAVAILABLE,
  // 验证
  ERR_VALIDATION,
  ERR_REQUIRED_FIELD,
  ERR_INVALID_FORMAT,
  ERR_INVALID_TYPE,
  ERR_OUT_OF_RANGE,
  // 认证
  ERR_AUTH_TOKEN_MISSING,
  ERR_AUTH_TOKEN_INVALID,
  ERR_AUTH_TOKEN_EXPIRED,
  ERR_AUTH_CREDENTIALS_INVALID,
  ERR_AUTH_PERMISSION_DENIED,
  // 数据库
  ERR_DB_CONNECTION,
  ERR_DB_QUERY,
  ERR_DB_CONSTRAINT,
  ERR_DB_TRANSACTION,
  // 外部服务
  ERR_EXTERNAL_SERVICE,
  ERR_EXTERNAL_TIMEOUT,
  ERR_EXTERNAL_RATE_LIMIT,
  // 文件
  ERR_FILE_NOT_FOUND,
  ERR_FILE_UPLOAD,
  ERR_FILE_TYPE,
  ERR_FILE_SIZE,
  // 业务
  ERR_RESOURCE_EXISTS,
  ERR_RESOURCE_LOCKED,
  ERR_INVALID_STATE,
  ERR_OPERATION_NOT_ALLOWED,
}

export default ERROR_CODES
