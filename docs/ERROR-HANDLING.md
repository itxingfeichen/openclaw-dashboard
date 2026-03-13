# 错误处理框架文档

## 概述

本错误处理框架提供统一的错误分类、错误码定义、全局错误处理中间件、重试机制和熔断器功能。

## 目录结构

```
backend/src/
├── errors/
│   ├── index.js           # 模块导出
│   ├── AppError.js        # 基础错误类
│   ├── error-codes.js     # 错误码定义
│   └── errors.js          # 具体错误类型
├── middleware/
│   ├── error-handler.js   # 全局错误处理中间件
│   └── error-formatter.js # 错误响应格式化
├── utils/
│   ├── retry.js           # 重试机制
│   ├── circuit-breaker.js # 熔断器
│   ├── logger.js          # 统一日志
│   └── error-tracker.js   # 错误追踪
└── index.js               # 主应用（集成错误处理）
```

## 错误码规范

### 编码规则
格式：`ERR_模块_子模块_具体错误`

- 通用错误：`ERR_XXX` (00xx)
- 验证错误：`ERR_VALIDATION_XXX` (10xx)
- 认证错误：`ERR_AUTH_XXX` (20xx)
- 数据库错误：`ERR_DB_XXX` (30xx)
- 外部服务错误：`ERR_EXTERNAL_XXX` (40xx)
- 文件错误：`ERR_FILE_XXX` (50xx)
- 业务错误：`ERR_XXX` (60xx)

### 完整错误码列表

#### 通用错误
| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| ERR_INTERNAL | 500 | 内部服务器错误 |
| ERR_INVALID_REQUEST | 400 | 无效的请求 |
| ERR_NOT_FOUND | 404 | 资源不存在 |
| ERR_UNAUTHORIZED | 401 | 未授权访问 |
| ERR_FORBIDDEN | 403 | 禁止访问 |
| ERR_CONFLICT | 409 | 资源冲突 |
| ERR_TOO_MANY_REQUESTS | 429 | 请求过于频繁 |
| ERR_SERVICE_UNAVAILABLE | 503 | 服务不可用 |

#### 验证错误
| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| ERR_VALIDATION | 400 | 验证失败 |
| ERR_REQUIRED_FIELD | 400 | 必填字段缺失 |
| ERR_INVALID_FORMAT | 400 | 格式错误 |
| ERR_INVALID_TYPE | 400 | 类型错误 |
| ERR_OUT_OF_RANGE | 400 | 值超出范围 |

#### 认证错误
| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| ERR_AUTH_TOKEN_MISSING | 401 | 缺少认证令牌 |
| ERR_AUTH_TOKEN_INVALID | 401 | 无效的认证令牌 |
| ERR_AUTH_TOKEN_EXPIRED | 401 | 认证令牌已过期 |
| ERR_AUTH_CREDENTIALS_INVALID | 401 | 用户名或密码错误 |
| ERR_AUTH_PERMISSION_DENIED | 403 | 权限不足 |

#### 数据库错误
| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| ERR_DB_CONNECTION | 503 | 数据库连接失败 |
| ERR_DB_QUERY | 500 | 数据库查询失败 |
| ERR_DB_CONSTRAINT | 409 | 数据库约束冲突 |
| ERR_DB_TRANSACTION | 500 | 数据库事务失败 |

#### 外部服务错误
| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| ERR_EXTERNAL_SERVICE | 502 | 外部服务错误 |
| ERR_EXTERNAL_TIMEOUT | 504 | 外部服务超时 |
| ERR_EXTERNAL_RATE_LIMIT | 429 | 外部服务限流 |

## 使用指南

### 1. 基础错误类

```javascript
import { AppError, ERROR_CODES } from './errors/index.js'

// 创建基础错误
const error = new AppError(ERROR_CODES.ERR_NOT_FOUND, '用户不存在', { userId: 123 })

// 错误属性
console.log(error.code)        // 'ERR_NOT_FOUND'
console.log(error.httpStatus)  // 404
console.log(error.message)     // '用户不存在'
console.log(error.metadata)    // { userId: 123 }
console.log(error.timestamp)   // ISO 时间戳

// 转换为 JSON
const json = error.toJSON()

// 检查是否为 AppError
AppError.isAppError(error)  // true
```

### 2. 具体错误类型

```javascript
import {
  ValidationError,
  AuthError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
} from './errors/index.js'

// 验证错误
throw new ValidationError('邮箱格式不正确', { field: 'email' })
throw ValidationError.requiredField('email')
throw ValidationError.invalidFormat('email', 'email', 'text')

// 认证错误
throw AuthError.tokenMissing()
throw AuthError.tokenExpired()
throw AuthError.permissionDenied('user', 'delete')

// 资源不存在
throw NotFoundError.resource('User', 123)
throw new NotFoundError('自定义消息')

// 资源冲突
throw ConflictError.resourceExists('Email', 'test@example.com')

// 数据库错误
throw DatabaseError.connection('无法连接数据库')
throw DatabaseError.query('查询失败', 'SELECT * FROM users')

// 外部服务错误
throw ExternalServiceError.timeout('PaymentService', 5000)
throw ExternalServiceError.rateLimit('EmailService', 60)

// 限流错误
throw RateLimitError.tooManyRequests(60)
```

### 3. 全局错误处理中间件

中间件已自动集成到主应用中，无需手动配置。

```javascript
// backend/src/index.js 已包含：
import { errorHandler, asyncHandler, notFoundHandler } from './middleware/error-handler.js'

// 404 处理
app.use(notFoundHandler())

// 全局错误处理（必须最后注册）
app.use(errorHandler())
```

#### 异步处理器包装器

```javascript
import { asyncHandler } from './middleware/error-handler.js'

// 方式 1：使用 asyncHandler
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id)
  res.json(user)
}))

// 方式 2：使用 createHandler
import { createHandler } from './middleware/error-handler.js'
app.get('/users', createHandler(async (req, res) => {
  const users = await getAllUsers()
  res.json(users)
}))
```

### 4. 错误响应格式

#### 成功响应
```json
{
  "success": true,
  "data": { ... }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERR_NOT_FOUND",
    "name": "NotFoundError",
    "message": "用户不存在",
    "httpStatus": 404,
    "originalMessage": "资源不存在",
    "metadata": {
      "userId": 123
    }
  },
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

#### 验证错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERR_VALIDATION",
    "message": "验证失败",
    "httpStatus": 400,
    "details": [
      {
        "field": "email",
        "message": "无效的邮箱格式",
        "code": "invalid"
      },
      {
        "field": "password",
        "message": "密码长度至少 8 位",
        "code": "min_length"
      }
    ]
  },
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

### 5. 重试机制

```javascript
import { withRetry, retryableRequest, createRetryableFunction } from './utils/retry.js'

// 基本重试
const result = await withRetry(
  async () => await externalApi.call(),
  {
    maxRetries: 3,           // 最大重试次数
    baseDelay: 1000,         // 基础延迟（毫秒）
    maxDelay: 30000,         // 最大延迟（毫秒）
    multiplier: 2,           // 退避乘数
    useExponentialBackoff: true, // 使用指数退避
  }
)

// 自定义重试判断
const result = await withRetry(
  async () => await database.query(),
  {
    maxRetries: 5,
    shouldRetry: (error) => {
      // 只对特定错误重试
      return error.code === 'ECONNREFUSED'
    },
    onRetry: ({ error, attempt, delayMs }) => {
      console.log(`Retry ${attempt}: ${error.message}, waiting ${delayMs}ms`)
    }
  }
)

// 创建可重试函数
const retryableFetch = createRetryableFunction(
  async (url) => await fetch(url),
  { maxRetries: 3 }
)
const response = await retryableFetch('https://api.example.com/data')
```

#### 指数退避计算

```javascript
import { calculateExponentialBackoff } from './utils/retry.js'

// 计算延迟
const delay0 = calculateExponentialBackoff(0, 1000)  // ~1000ms
const delay1 = calculateExponentialBackoff(1, 1000)  // ~2000ms
const delay2 = calculateExponentialBackoff(2, 1000)  // ~4000ms
```

### 6. 熔断器

```javascript
import { CircuitBreaker, CircuitState, circuitBreakerManager } from './utils/circuit-breaker.js'

// 创建熔断器
const breaker = new CircuitBreaker('PaymentService', {
  failureThreshold: 5,      // 失败阈值（连续失败次数）
  successThreshold: 2,      // 成功阈值（半开状态需要的成功次数）
  resetTimeout: 60000,      // 恢复超时（毫秒）
  halfOpenMaxRequests: 3,   // 半开状态最大请求数
})

// 使用熔断器
try {
  const result = await breaker.execute(async () => {
    return await paymentService.charge(amount)
  })
  console.log('Payment successful:', result)
} catch (error) {
  if (error.name === 'CircuitBreakerError') {
    console.log('Service is temporarily unavailable')
  } else {
    console.error('Payment failed:', error)
  }
}

// 查询状态
const state = breaker.getState()  // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
const info = breaker.getStateInfo()

// 手动控制
breaker.forceOpen()   // 强制打开
breaker.forceClose()  // 强制关闭
breaker.reset()       // 重置

// 使用全局管理器
const serviceBreaker = circuitBreakerManager.getOrCreate('ExternalAPI', {
  failureThreshold: 3,
  resetTimeout: 30000,
})

// 获取所有熔断器状态
const allStates = circuitBreakerManager.getAllStates()
```

#### 熔断器状态说明

| 状态 | 说明 | 行为 |
|------|------|------|
| CLOSED | 正常 | 请求正常通过，失败计数累加 |
| OPEN | 熔断 | 拒绝所有请求，等待恢复超时 |
| HALF_OPEN | 半开 | 允许少量请求测试，成功则关闭，失败则打开 |

### 7. 日志记录

```javascript
import { logDebug, logInfo, logWarn, logError, createLogger } from './utils/logger.js'

// 基本日志
logDebug('Debug message', { detail: 'value' })
logInfo('Info message', { userId: 123 })
logWarn('Warning message', { retryCount: 3 })
logError(new Error('Error occurred'), { context: 'api' })

// 创建带前缀的日志器
const apiLogger = createLogger('API')
apiLogger.info('Request received')
apiLogger.error('Request failed')

// 请求日志
import { logRequest, logPerformance } from './utils/logger.js'
logRequest(req, statusCode, duration)
logPerformance('database.query', 150, { table: 'users' })
```

#### 日志级别配置

通过环境变量 `LOG_LEVEL` 设置：
```bash
LOG_LEVEL=DEBUG  # 输出所有日志
LOG_LEVEL=INFO   # 输出 INFO 及以上
LOG_LEVEL=WARN   # 输出 WARN 及以上
LOG_LEVEL=ERROR  # 只输出 ERROR
LOG_LEVEL=SILENT # 不输出日志
```

### 8. 错误追踪

```javascript
import { errorTracker, trackError, getErrorStats, getErrorHistory } from './utils/error-tracker.js'

// 追踪错误
trackError(error, {
  url: '/api/users',
  method: 'POST',
  userId: 123,
  ip: '192.168.1.1',
})

// 获取统计
const stats = getErrorStats()
console.log(stats.totalCount)        // 总错误数
console.log(stats.topErrors)         // 最常见错误
console.log(stats.hourlyDistribution) // 每小时分布

// 获取历史
const history = getErrorHistory(100, {
  code: 'ERR_VALIDATION',  // 按错误码过滤
  httpStatus: 400,         // 按状态码过滤
  since: Date.now() - 3600000, // 最近 1 小时
})

// 获取特定错误码统计
const validationStats = errorTracker.getErrorStats('ERR_VALIDATION')
```

## 最佳实践

### 1. 错误抛出

```javascript
// ✅ 好的做法：使用具体错误类型
async function getUser(id) {
  const user = await db.findUser(id)
  if (!user) {
    throw NotFoundError.resource('User', id)
  }
  return user
}

// ❌ 不好的做法：使用通用 Error
async function getUser(id) {
  const user = await db.findUser(id)
  if (!user) {
    throw new Error('User not found')
  }
  return user
}
```

### 2. 错误处理

```javascript
// ✅ 好的做法：捕获并包装
async function processPayment(userId, amount) {
  try {
    return await paymentService.charge(amount)
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new BusinessError('余额不足', { userId, amount })
    }
    throw error
  }
}

// ❌ 不好的做法：吞掉错误
async function processPayment(userId, amount) {
  try {
    return await paymentService.charge(amount)
  } catch (error) {
    console.error(error)
    return null  // 调用方无法知道发生了什么
  }
}
```

### 3. 重试使用

```javascript
// ✅ 好的做法：只对可重试错误重试
const result = await withRetry(
  async () => await externalApi.call(),
  {
    maxRetries: 3,
    shouldRetry: (error) => {
      // 只对网络错误和 5xx 错误重试
      return error.httpStatus >= 500 || error.code === 'ECONNREFUSED'
    }
  }
)

// ❌ 不好的做法：对所有错误重试
const result = await withRetry(
  async () => await externalApi.call(),
  { maxRetries: 3 }  // 可能对 400 错误也重试
)
```

### 4. 熔断器配置

```javascript
// ✅ 好的做法：为不同服务配置不同参数
const paymentBreaker = new CircuitBreaker('PaymentService', {
  failureThreshold: 3,   // 支付服务敏感，失败阈值低
  resetTimeout: 60000,   // 1 分钟后尝试恢复
})

const searchBreaker = new CircuitBreaker('SearchService', {
  failureThreshold: 10,  // 搜索服务可以容忍更多失败
  resetTimeout: 30000,   // 30 秒后尝试恢复
})

// ❌ 不好的做法：所有服务相同配置
const breaker = new CircuitBreaker('Service')  // 使用默认值
```

## 测试

运行错误处理测试：

```bash
cd backend
npm test -- tests/error-handling.test.js
```

测试覆盖率：

```bash
npm run test:coverage
```

## 监控建议

1. **错误率监控**：追踪每分钟/每小时错误数
2. **错误类型分布**：识别最常见的错误类型
3. **熔断器状态**：监控服务的健康状态
4. **重试成功率**：评估重试机制的有效性
5. **响应时间**：识别性能问题

## 故障排查

### 常见问题

1. **错误未被捕获**
   - 确保 `errorHandler()` 是最后一个注册的中间件
   - 使用 `asyncHandler` 包装异步路由处理器

2. **重试无限循环**
   - 设置合理的 `maxRetries`
   - 使用 `shouldRetry` 过滤不可重试的错误

3. **熔断器无法恢复**
   - 检查 `resetTimeout` 配置
   - 确保半开状态的测试请求能成功

4. **错误日志过多**
   - 调整 `LOG_LEVEL` 环境变量
   - 使用 `createLogger` 按模块区分日志

## 扩展

### 添加新的错误类型

```javascript
// src/errors/errors.js
export class NewError extends AppError {
  constructor(message, metadata = {}) {
    super(ERROR_CODES.ERR_NEW_ERROR, message, metadata)
    this.name = 'NewError'
  }

  static customMethod(param) {
    return new NewError(`Custom error: ${param}`, { param })
  }
}
```

### 添加新的错误码

```javascript
// src/errors/error-codes.js
export const ERR_NEW_ERROR = { 
  code: 'ERR_NEW_ERROR', 
  httpStatus: 400, 
  message: '新错误类型' 
}

// 添加到 ERROR_CODES 导出对象
```

### 集成外部错误追踪服务

```javascript
// src/utils/error-tracker.js
import Sentry from '@sentry/node'

export function trackError(error, context = {}) {
  // 本地追踪
  errorTracker.track(error, context)
  
  // 发送到 Sentry
  Sentry.captureException(error, { extra: context })
}
```

## 版本历史

- **v1.0.0** (2026-03-13): 初始版本
  - 基础错误类和错误码定义
  - 全局错误处理中间件
  - 重试机制（指数退避）
  - 熔断器实现
  - 统一日志和错误追踪
  - 完整的单元测试
