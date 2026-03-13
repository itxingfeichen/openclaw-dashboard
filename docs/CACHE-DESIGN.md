# 缓存层设计文档

## 概述

本文档描述 OpenClaw Dashboard 的缓存层设计，包括架构、使用示例和最佳实践。

## 目录

1. [架构设计](#架构设计)
2. [核心组件](#核心组件)
3. [使用指南](#使用指南)
4. [API 参考](#api-参考)
5. [最佳实践](#最佳实践)
6. [性能优化](#性能优化)
7. [故障排查](#故障排查)

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    应用层 (Application)                   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  装饰器层   │  │  中间件层   │  │  管理器层   │     │
│  │ (Decorator) │  │ (Middleware)│  │  (Manager)  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          │                              │
│                  ┌───────▼───────┐                      │
│                  │  缓存服务层   │                      │
│                  │ (CacheService)│                      │
│                  └───────┬───────┘                      │
│                          │                              │
│         ┌────────────────┼────────────────┐             │
│         │                │                │             │
│  ┌──────▼──────┐  ┌──────▼──────┐        │             │
│  │  内存缓存   │  │  Redis 缓存  │        │             │
│  │(MemoryCache)│  │(RedisCache) │        │             │
│  └─────────────┘  └─────────────┘        │             │
└─────────────────────────────────────────────────────────┘
```

### 缓存模式

1. **内存模式 (Memory)**: 使用进程内内存缓存，适合单机部署
2. **Redis 模式**: 使用 Redis 作为后端，适合分布式部署
3. **混合模式 (Hybrid)**: 内存为主，Redis 为辅，兼顾性能和持久化

### 淘汰策略

- **TTL**: 基于时间的过期
- **LRU**: 最近最少使用 (Least Recently Used)
- **LFU**: 最不经常使用 (Least Frequently Used)
- **FIFO**: 先进先出 (First In First Out)
- **MRU**: 最近最多使用 (Most Recently Used)

---

## 核心组件

### 1. 缓存服务 (CacheService)

统一的缓存接口，支持多种后端。

```javascript
import { CacheService, CacheType } from './cache/cache-service.js'

// 创建内存缓存服务
const cache = new CacheService({
  type: CacheType.MEMORY,
  maxSize: 1000,
  defaultTTL: 300000, // 5 分钟
  strategy: 'lru',
})

// 创建 Redis 缓存服务
const redisCache = new CacheService({
  type: CacheType.REDIS,
  redis: {
    host: 'localhost',
    port: 6379,
    keyPrefix: 'dashboard',
  },
})

// 创建混合模式缓存服务
const hybridCache = new CacheService({
  type: CacheType.HYBRID,
  maxSize: 500,
  redis: {
    host: 'localhost',
    port: 6379,
  },
})
```

### 2. 内存缓存 (MemoryCache)

高性能的进程内缓存实现。

```javascript
import { MemoryCache } from './cache/memory-cache.js'

const cache = new MemoryCache({
  maxSize: 1000,      // 最大缓存项数量
  strategy: 'lru',    // 淘汰策略
  defaultTTL: 60000,  // 默认 TTL (毫秒)
  enableStats: true,  // 启用统计
})

// 基本操作
cache.set('key', 'value', { ttl: 5000 })
const value = cache.get('key')
cache.delete('key')
cache.has('key')

// 批量操作
cache.mset({ key1: 'v1', key2: 'v2' })
const values = cache.mget(['key1', 'key2'])
cache.mdelete(['key1', 'key2'])

// 统计信息
const stats = cache.getStats()
console.log(stats)
// { hits: 10, misses: 2, hitRate: '83.33%', ... }
```

### 3. 缓存装饰器 (Cacheable)

自动缓存函数结果的装饰器。

```javascript
import { cacheable, cacheInvalidate } from './decorators/cacheable.js'
import { CacheService } from './cache/cache-service.js'

const cacheService = new CacheService()

class UserService {
  // 基本用法
  @cacheable({ cacheService, ttl: 5000 })
  async getUser(id) {
    return db.query('SELECT * FROM users WHERE id = ?', [id])
  }

  // 自定义 key 生成
  @cacheable({
    cacheService,
    keyGenerator: (methodName, args) => `user:${args[0]}`,
  })
  async getUserById(id) {
    return db.query('SELECT * FROM users WHERE id = ?', [id])
  }

  // 条件缓存
  @cacheable({
    cacheService,
    condition: (result) => result !== null, // 不缓存 null
  })
  async findUser(email) {
    return db.query('SELECT * FROM users WHERE email = ?', [email])
  }

  // 缓存失效
  @cacheInvalidate('user:*')
  async updateUser(id, data) {
    return db.query('UPDATE users SET ? WHERE id = ?', [data, id])
  }
}
```

### 4. 缓存中间件 (CacheMiddleware)

HTTP 响应缓存中间件。

```javascript
import { createCacheMiddleware } from './middleware/cache-middleware.js'

// 基本用法
app.use(createCacheMiddleware({
  cacheControl: 'public, max-age=300',
  enableETag: true,
  enableLastModified: true,
}))

// 排除特定路径
app.use(createCacheMiddleware({
  excludePatterns: ['/api/admin', '/health', /^\/internal/],
}))

// 自定义缓存控制
app.use(createCacheMiddleware({
  getCacheControl: (req, res) => {
    if (req.path.startsWith('/api/static')) {
      return 'public, max-age=31536000, immutable'
    }
    return 'public, max-age=300'
  },
}))
```

### 5. 缓存管理器 (CacheManager)

高级缓存管理功能。

```javascript
import { CacheManager, WarmupConfig } from './cache/cache-manager.js'

const manager = new CacheManager({
  cacheService: new CacheService(),
  enableStats: true,
})

// 命名空间操作
await manager.set('key', 'value', { namespace: 'users' })
const value = await manager.get('key', 'users')

// 批量失效
await manager.deleteByNamespace('users')
await manager.deleteByPattern('user:*')

// 缓存预热
await manager.warmup([
  { key: 'config', value: configData },
  { key: 'settings', value: settingsData },
], 'system')

// 从数据源预热
const config = new WarmupConfig({
  dataSource: async () => {
    const users = await db.query('SELECT * FROM users')
    return users.map(u => ({
      key: `user:${u.id}`,
      value: u,
      namespace: 'users',
    }))
  },
  batchSize: 100,
  concurrency: 5,
})

await manager.warmupFromSource(config)

// 统计信息
const stats = await manager.getStats()
console.log(stats)

// 健康检查
const health = await manager.healthCheck()
console.log(health.status) // 'healthy' or 'unhealthy'
```

---

## API 参考

### CacheService

| 方法 | 参数 | 返回 | 描述 |
|------|------|------|------|
| `get(key, options)` | key: string, options: object | Promise\<any\> | 获取缓存项 |
| `set(key, value, options)` | key: string, value: any, options: object | Promise\<void\> | 设置缓存项 |
| `delete(key)` | key: string | Promise\<boolean\> | 删除缓存项 |
| `has(key)` | key: string | Promise\<boolean\> | 检查键是否存在 |
| `mget(keys)` | keys: string[] | Promise\<object\> | 批量获取 |
| `mset(items, options)` | items: object, options: object | Promise\<void\> | 批量设置 |
| `mdelete(keys)` | keys: string[] | Promise\<number\> | 批量删除 |
| `deleteByPattern(pattern)` | pattern: string | Promise\<number\> | 按模式删除 |
| `clear()` | - | Promise\<void\> | 清空缓存 |
| `size()` | - | Promise\<number\> | 获取缓存数量 |
| `keys(pattern)` | pattern: string | Promise\<string[]\> | 获取所有键 |
| `getStats()` | - | Promise\<object\> | 获取统计信息 |
| `resetStats()` | - | void | 重置统计 |
| `warmup(items)` | items: array | Promise\<void\> | 预热缓存 |
| `shutdown()` | - | Promise\<void\> | 关闭服务 |

### MemoryCache

| 方法 | 参数 | 返回 | 描述 |
|------|------|------|------|
| `get(key)` | key: string | any | 获取缓存项 |
| `set(key, value, options)` | key: string, value: any, options: object | void | 设置缓存项 |
| `delete(key)` | key: string | boolean | 删除缓存项 |
| `has(key)` | key: string | boolean | 检查键是否存在 |
| `size()` | - | number | 获取缓存数量 |
| `clear()` | - | void | 清空缓存 |
| `keys()` | - | string[] | 获取所有键 |
| `values()` | - | any[] | 获取所有值 |
| `entries()` | - | object[] | 获取所有条目 |
| `getStats()` | - | object | 获取统计信息 |
| `resetStats()` | - | void | 重置统计 |
| `deleteByPattern(pattern)` | pattern: string | number | 按模式删除 |
| `cleanup()` | - | number | 清理过期项 |
| `warmup(items)` | items: array | void | 预热缓存 |
| `export()` | - | object | 导出数据 |
| `import(data)` | data: object | void | 导入数据 |
| `stopCleanup()` | - | void | 停止清理定时器 |

### Cacheable Decorator

| 配置项 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `cacheService` | CacheService | new CacheService() | 缓存服务实例 |
| `prefix` | string | 'cacheable' | 缓存键前缀 |
| `ttl` | number | 60000 | TTL (毫秒) |
| `keyGenerator` | function | null | 自定义 key 生成器 |
| `condition` | function | null | 条件函数 |
| `cacheErrors` | boolean | false | 是否缓存错误 |
| `serialize` | function | JSON.stringify | 序列化函数 |
| `deserialize` | function | JSON.parse | 反序列化函数 |

---

## 最佳实践

### 1. 缓存键设计

```javascript
// ✅ 好的实践：使用命名空间和清晰的层次
const userKey = `user:${userId}`
const userListKey = `user:list:page:${page}:size:${size}`
const configKey = `config:app:settings`

// ❌ 避免：模糊的键名
const key = `data1` // 不清晰
```

### 2. TTL 设置

```javascript
// 根据数据特性设置合适的 TTL
const TTL_CONFIG = {
  // 频繁变化的数据：短 TTL
  USER_SESSION: 5 * 60 * 1000,      // 5 分钟
  API_RESPONSE: 1 * 60 * 1000,      // 1 分钟

  // 相对稳定的数据：中等 TTL
  USER_PROFILE: 30 * 60 * 1000,     // 30 分钟
  PRODUCT_LIST: 15 * 60 * 1000,     // 15 分钟

  // 很少变化的数据：长 TTL
  CONFIG: 24 * 60 * 60 * 1000,      // 24 小时
  STATIC_DATA: 7 * 24 * 60 * 60 * 1000, // 7 天
}
```

### 3. 缓存失效策略

```javascript
// ✅ 主动失效：数据更新时失效相关缓存
class UserService {
  @cacheable({ ttl: 300000 })
  async getUser(id) { /* ... */ }

  @cacheInvalidate('user:*')
  async updateUser(id, data) {
    await db.update('users', data, { id })
  }

  @cacheInvalidate('user:list:*')
  async deleteUser(id) {
    await db.delete('users', { id })
  }
}

// ✅ 被动失效：使用 TTL 自动过期
// 适合不重要的缓存数据
```

### 4. 缓存预热

```javascript
// 应用启动时预热常用数据
async function warmupCache() {
  const manager = new CacheManager()

  // 预热配置数据
  const config = await db.query('SELECT * FROM app_config')
  await manager.warmup([
    { key: 'config', value: config, ttl: 3600000 },
  ], 'system')

  // 预热热门数据
  const popularUsers = await db.query(
    'SELECT * FROM users ORDER BY visits DESC LIMIT 100'
  )
  await manager.warmup(
    popularUsers.map(u => ({
      key: `user:${u.id}`,
      value: u,
      ttl: 1800000,
    })),
    'users'
  )
}
```

### 5. 监控和告警

```javascript
// 定期检查缓存健康
setInterval(async () => {
  const stats = await manager.getStats()
  const health = await manager.healthCheck()

  // 检查命中率
  const hitRate = parseFloat(stats.manager.hitRate)
  if (hitRate < 50) {
    console.warn('缓存命中率过低:', hitRate)
  }

  // 检查健康状态
  if (health.status === 'unhealthy') {
    console.error('缓存服务不健康:', health.error)
    // 发送告警
  }
}, 60000) // 每分钟检查
```

### 6. 内存管理

```javascript
// 设置合理的 maxSize 防止内存溢出
const cache = new MemoryCache({
  maxSize: 10000,  // 根据可用内存调整
  strategy: 'lru', // 自动淘汰最少使用的项
})

// 定期清理
cache.cleanup() // 清理过期项

// 监控内存使用
const stats = cache.getStats()
if (stats.size > stats.maxSize * 0.9) {
  console.warn('缓存使用率超过 90%')
}
```

---

## 性能优化

### 1. 批量操作

```javascript
// ✅ 批量操作优于单个操作
const keys = ['k1', 'k2', 'k3', 'k4', 'k5']

// 好的做法
const values = await cache.mget(keys)

// 避免
const values = await Promise.all(
  keys.map(key => cache.get(key))
)
```

### 2. 缓存穿透保护

```javascript
// 缓存空值防止穿透
async function getUser(id) {
  const key = `user:${id}`
  let user = await cache.get(key)

  if (user === undefined) {
    user = await db.query('SELECT * FROM users WHERE id = ?', [id])

    // 缓存空结果，设置较短 TTL
    if (!user) {
      await cache.set(key, null, { ttl: 60000 }) // 1 分钟
      return null
    }

    await cache.set(key, user, { ttl: 300000 })
  }

  return user === null ? null : user
}
```

### 3. 缓存雪崩保护

```javascript
// 添加随机 TTL 防止雪崩
async function setWithJitter(key, value, baseTTL) {
  const jitter = Math.random() * 0.2 * baseTTL // ±10%
  const ttl = baseTTL + jitter - (jitter / 2)
  await cache.set(key, value, { ttl })
}
```

### 4. 缓存击穿保护

```javascript
// 使用互斥锁防止击穿
const locks = new Map()

async function getWithLock(key, fetchFn, ttl) {
  let value = await cache.get(key)
  if (value !== undefined) return value

  // 获取锁
  if (locks.has(key)) {
    // 等待锁释放
    await new Promise(resolve => setTimeout(resolve, 100))
    return await getWithLock(key, fetchFn, ttl)
  }

  locks.set(key, true)

  try {
    // 双重检查
    value = await cache.get(key)
    if (value !== undefined) return value

    // 获取数据
    value = await fetchFn()
    await cache.set(key, value, { ttl })
    return value
  } finally {
    locks.delete(key)
  }
}
```

---

## 故障排查

### 常见问题

#### 1. 缓存命中率低

**可能原因**:
- TTL 设置过短
- 缓存键不一致
- 缓存数据量过大导致频繁淘汰

**解决方案**:
```javascript
// 检查统计
const stats = await cache.getStats()
console.log('Hit Rate:', stats.hitRate)

// 调整 TTL
await cache.set(key, value, { ttl: 600000 }) // 延长到 10 分钟

// 增加 maxSize
const cache = new MemoryCache({ maxSize: 10000 })
```

#### 2. 内存使用过高

**可能原因**:
- maxSize 设置过大
- 缓存项过大
- 未及时清理过期项

**解决方案**:
```javascript
// 限制 maxSize
const cache = new MemoryCache({ maxSize: 5000 })

// 定期清理
cache.cleanup()

// 监控内存
const stats = cache.getStats()
if (stats.size > 4000) {
  console.warn('缓存使用率过高')
}
```

#### 3. Redis 连接失败

**可能原因**:
- Redis 服务未启动
- 网络问题
- 认证失败

**解决方案**:
```javascript
// 检查连接状态
const health = await manager.healthCheck()
if (health.status === 'unhealthy') {
  console.error('Redis 连接失败:', health.error)
  // 自动降级到内存缓存
}

// 配置重试
const redisCache = new RedisCache({
  host: 'localhost',
  port: 6379,
  lazyInit: true, // 延迟初始化
})
```

### 调试技巧

```javascript
// 启用详细日志
const cache = new MemoryCache({ enableStats: true })

// 导出缓存数据
const data = cache.export()
console.log('缓存内容:', data.items)

// 监控操作
cache.on('set', (key, value) => console.log('SET', key))
cache.on('get', (key, hit) => console.log('GET', key, hit ? 'HIT' : 'MISS'))
cache.on('delete', (key) => console.log('DELETE', key))
```

---

## 附录

### 示例项目结构

```
backend/
├── src/
│   ├── cache/
│   │   ├── index.js              # 模块导出
│   │   ├── cache-service.js      # 缓存服务
│   │   ├── memory-cache.js       # 内存缓存
│   │   ├── redis-cache.js        # Redis 缓存
│   │   ├── cache-strategy.js     # 缓存策略
│   │   └── cache-manager.js      # 缓存管理器
│   ├── decorators/
│   │   ├── index.js
│   │   └── cacheable.js          # 缓存装饰器
│   └── middleware/
│       └── cache-middleware.js   # HTTP 缓存中间件
└── tests/
    └── cache.test.js             # 单元测试
```

### 性能基准

| 操作 | 内存缓存 | Redis (本地) |
|------|---------|-------------|
| GET  | < 0.01ms | ~0.5ms |
| SET  | < 0.01ms | ~0.5ms |
| DELETE | < 0.01ms | ~0.3ms |
| MGET (100) | < 0.1ms | ~10ms |

### 版本历史

- **v1.0.0** (2026-03-13): 初始版本
  - 内存缓存实现
  - Redis 缓存支持
  - 缓存装饰器
  - HTTP 缓存中间件
  - 缓存管理器

---

_最后更新：2026-03-13_
