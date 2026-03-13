/**
 * 缓存模块单元测试
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { setTimeout } from 'node:timers/promises'

import { MemoryCache } from '../src/cache/memory-cache.js'
import { CacheService, CacheType } from '../src/cache/cache-service.js'
import { CacheManager, CacheStats, WarmupConfig } from '../src/cache/cache-manager.js'
import {
  TTLStrategy,
  LRUStrategy,
  LFUStrategy,
  StrategyFactory,
} from '../src/cache/cache-strategy.js'
import { Cacheable, cacheable, cacheInvalidate } from '../src/decorators/cacheable.js'
import { CacheMiddleware, CacheMiddlewareConfig, createCacheMiddleware } from '../src/middleware/cache-middleware.js'

// ========== MemoryCache 测试 ==========
describe('MemoryCache', () => {
  let cache

  before(() => {
    cache = new MemoryCache({ maxSize: 100, strategy: 'lru' })
  })

  after(() => {
    cache.stopCleanup()
  })

  describe('基本操作', () => {
    it('应该能设置和获取缓存项', () => {
      cache.set('key1', 'value1')
      assert.strictEqual(cache.get('key1'), 'value1')
    })

    it('应该能删除缓存项', () => {
      cache.set('key2', 'value2')
      assert.strictEqual(cache.get('key2'), 'value2')
      assert.strictEqual(cache.delete('key2'), true)
      assert.strictEqual(cache.get('key2'), undefined)
    })

    it('应该能检查键是否存在', () => {
      cache.set('key3', 'value3')
      assert.strictEqual(cache.has('key3'), true)
      assert.strictEqual(cache.has('nonexistent'), false)
    })

    it('应该能获取缓存大小', () => {
      const size = cache.size()
      assert.strictEqual(size, 2) // key1 and key3
    })

    it('应该能清空缓存', () => {
      cache.clear()
      assert.strictEqual(cache.size(), 0)
    })
  })

  describe('TTL 功能', () => {
    it('应该在 TTL 过期后返回 undefined', async () => {
      cache.set('ttl-key', 'ttl-value', { ttl: 100 })
      assert.strictEqual(cache.get('ttl-key'), 'ttl-value')

      await setTimeout(150)
      assert.strictEqual(cache.get('ttl-key'), undefined)
    })

    it('应该能清理过期项', async () => {
      cache.set('expire1', 'value1', { ttl: 50 })
      cache.set('expire2', 'value2', { ttl: 50 })
      cache.set('no-expire', 'value3')

      await setTimeout(100)
      const count = cache.cleanup()
      assert.strictEqual(count, 2)
      assert.strictEqual(cache.has('no-expire'), true)
    })
  })

  describe('LRU 策略', () => {
    it('应该淘汰最少使用的项', () => {
      const lruCache = new MemoryCache({ maxSize: 3, strategy: 'lru' })

      lruCache.set('a', 1)
      lruCache.set('b', 2)
      lruCache.set('c', 3)

      // 访问 'a'，使其成为最近使用
      lruCache.get('a')

      // 添加新项，应该淘汰 'b'（最少使用）
      lruCache.set('d', 4)

      assert.strictEqual(lruCache.has('a'), true)
      assert.strictEqual(lruCache.has('b'), false)
      assert.strictEqual(lruCache.has('c'), true)
      assert.strictEqual(lruCache.has('d'), true)

      lruCache.stopCleanup()
    })
  })

  describe('统计功能', () => {
    it('应该能获取统计信息', () => {
      cache.set('stat1', 'value1')
      cache.get('stat1')
      cache.get('nonexistent')

      const stats = cache.getStats()
      assert.ok(stats.hits >= 1)
      assert.ok(stats.misses >= 1)
      assert.ok(stats.sets >= 1)
      assert.ok(stats.hitRate)
    })

    it('应该能重置统计', () => {
      cache.resetStats()
      const stats = cache.getStats()
      assert.strictEqual(stats.hits, 0)
      assert.strictEqual(stats.misses, 0)
    })
  })

  describe('模式匹配', () => {
    it('应该能按模式删除键', () => {
      cache.set('user:1', 'user1')
      cache.set('user:2', 'user2')
      cache.set('post:1', 'post1')

      const count = cache.deleteByPattern('user:*')
      assert.strictEqual(count, 2)
      assert.strictEqual(cache.has('user:1'), false)
      assert.strictEqual(cache.has('user:2'), false)
      assert.strictEqual(cache.has('post:1'), true)
    })
  })

  describe('批量操作', () => {
    it('应该能获取所有键', () => {
      cache.clear()
      cache.set('k1', 'v1')
      cache.set('k2', 'v2')
      cache.set('k3', 'v3')

      const keys = cache.keys()
      assert.strictEqual(keys.length, 3)
      assert.ok(keys.includes('k1'))
    })

    it('应该能获取所有值', () => {
      const values = cache.values()
      assert.strictEqual(values.length, 3)
    })

    it('应该能获取所有条目', () => {
      const entries = cache.entries()
      assert.strictEqual(entries.length, 3)
      assert.ok(entries.some(e => e.key === 'k1' && e.value === 'v1'))
    })
  })

  describe('预热和导出', () => {
    it('应该能预热缓存', () => {
      cache.clear()
      cache.warmup([
        { key: 'w1', value: 'v1' },
        { key: 'w2', value: 'v2', ttl: 1000 },
      ])

      assert.strictEqual(cache.get('w1'), 'v1')
      assert.strictEqual(cache.get('w2'), 'v2')
    })

    it('应该能导出和导入数据', () => {
      const exported = cache.export()
      assert.ok(exported.items)
      assert.ok(exported.config)

      cache.clear()
      cache.import(exported)

      assert.strictEqual(cache.get('w1'), 'v1')
    })
  })
})

// ========== CacheService 测试 ==========
describe('CacheService', () => {
  let service

  before(() => {
    service = new CacheService({ type: CacheType.MEMORY })
  })

  after(async () => {
    await service.shutdown()
  })

  describe('基本操作', () => {
    it('应该能设置和获取缓存', async () => {
      await service.set('service-key', 'service-value')
      const value = await service.get('service-key')
      assert.strictEqual(value, 'service-value')
    })

    it('应该能删除缓存', async () => {
      await service.set('delete-key', 'delete-value')
      await service.delete('delete-key')
      const value = await service.get('delete-key')
      assert.strictEqual(value, undefined)
    })

    it('应该能检查键是否存在', async () => {
      await service.set('has-key', 'has-value')
      assert.strictEqual(await service.has('has-key'), true)
      assert.strictEqual(await service.has('nonexistent'), false)
    })
  })

  describe('批量操作', () => {
    it('应该能批量获取', async () => {
      await service.mset({
        'batch1': 'value1',
        'batch2': 'value2',
        'batch3': 'value3',
      })

      const result = await service.mget(['batch1', 'batch2', 'batch3'])
      assert.strictEqual(result.batch1, 'value1')
      assert.strictEqual(result.batch2, 'value2')
      assert.strictEqual(result.batch3, 'value3')
    })

    it('应该能批量删除', async () => {
      const count = await service.mdelete(['batch1', 'batch2', 'batch3'])
      assert.strictEqual(count, 3)
    })
  })

  describe('统计功能', () => {
    it('应该能获取统计信息', async () => {
      const stats = await service.getStats()
      assert.ok(stats.memory)
      assert.ok(stats.type)
    })
  })
})

// ========== CacheStrategy 测试 ==========
describe('CacheStrategy', () => {
  describe('TTLStrategy', () => {
    it('应该能检查是否过期', () => {
      const strategy = new TTLStrategy()
      const item = {
        expiresAt: Date.now() - 1000, // 1 秒前过期
      }
      assert.strictEqual(strategy.isExpired(item), true)
    })

    it('应该能计算过期时间', () => {
      const strategy = new TTLStrategy({ defaultTTL: 5000 })
      const expiry = strategy.calculateExpiry()
      assert.ok(expiry > Date.now())
      assert.ok(expiry <= Date.now() + 5000)
    })
  })

  describe('LRUStrategy', () => {
    it('应该能创建节点', () => {
      const strategy = new LRUStrategy()
      const node = strategy.createNode('key', 'value')
      assert.strictEqual(node.key, 'key')
      assert.strictEqual(node.value, 'value')
      assert.strictEqual(node.prev, null)
      assert.strictEqual(node.next, null)
    })
  })

  describe('LFUStrategy', () => {
    it('应该能增加访问频率', () => {
      const strategy = new LFUStrategy()
      const node = strategy.createNode('key', 'value')
      assert.strictEqual(node.frequency, 0)

      strategy.incrementFrequency(node)
      assert.strictEqual(node.frequency, 1)

      strategy.incrementFrequency(node)
      assert.strictEqual(node.frequency, 2)
    })

    it('应该能选择淘汰候选', () => {
      const strategy = new LFUStrategy()
      const cache = new Map()

      cache.set('a', { frequency: 5, lastAccessed: Date.now() })
      cache.set('b', { frequency: 2, lastAccessed: Date.now() })
      cache.set('c', { frequency: 8, lastAccessed: Date.now() })

      const candidate = strategy.selectEvictionCandidate(cache)
      assert.strictEqual(candidate.frequency, 2)
    })
  })

  describe('StrategyFactory', () => {
    it('应该能创建正确的策略实例', () => {
      const ttl = StrategyFactory.create('ttl')
      assert.ok(ttl instanceof TTLStrategy)

      const lru = StrategyFactory.create('lru')
      assert.ok(lru instanceof LRUStrategy)

      const lfu = StrategyFactory.create('lfu')
      assert.ok(lfu instanceof LFUStrategy)
    })
  })
})

// ========== CacheManager 测试 ==========
describe('CacheManager', () => {
  let manager

  before(() => {
    manager = new CacheManager({ enableStats: true })
  })

  after(async () => {
    await manager.shutdown()
  })

  describe('命名空间操作', () => {
    it('应该能在命名空间中设置和获取', async () => {
      await manager.set('key1', 'value1', { namespace: 'users' })
      const value = await manager.get('key1', 'users')
      assert.strictEqual(value, 'value1')
    })

    it('应该能按命名空间批量失效', async () => {
      await manager.set('k1', 'v1', { namespace: 'test' })
      await manager.set('k2', 'v2', { namespace: 'test' })
      await manager.set('k3', 'v3', { namespace: 'other' })

      const count = await manager.deleteByNamespace('test')
      assert.strictEqual(count, 2)

      assert.strictEqual(await manager.get('k1', 'test'), undefined)
      assert.strictEqual(await manager.get('k3', 'other'), 'v3')
    })

    it('应该能获取所有命名空间', () => {
      const namespaces = manager.getNamespaces()
      assert.ok(namespaces.includes('users'))
      assert.ok(namespaces.includes('other'))
    })
  })

  describe('缓存预热', () => {
    it('应该能预热缓存', async () => {
      const result = await manager.warmup([
        { key: 'warm1', value: 'wv1' },
        { key: 'warm2', value: 'wv2' },
      ], 'warmup-ns')

      assert.strictEqual(result.total, 2)
      assert.strictEqual(result.success, 2)
      assert.strictEqual(result.failed, 0)

      const value = await manager.get('warm1', 'warmup-ns')
      assert.strictEqual(value, 'wv1')
    })

    it('应该能从数据源预热', async () => {
      const dataSource = async () => [
        { key: 'ds1', value: 'dv1', namespace: 'datasource' },
        { key: 'ds2', value: 'dv2', namespace: 'datasource' },
      ]

      const config = new WarmupConfig({
        dataSource,
        batchSize: 10,
        concurrency: 2,
      })

      const result = await manager.warmupFromSource(config)
      assert.strictEqual(result.total, 2)
      assert.strictEqual(result.success, 2)
    })
  })

  describe('统计功能', () => {
    it('应该能获取统计信息', async () => {
      const stats = await manager.getStats()
      assert.ok(stats.cache)
      assert.ok(stats.manager)
      assert.ok(stats.manager.hitRate !== undefined)
    })

    it('应该能重置统计', () => {
      manager.resetStats()
      const stats = manager.stats.toJSON()
      assert.strictEqual(stats.hits, 0)
      assert.strictEqual(stats.misses, 0)
    })
  })

  describe('健康检查', () => {
    it('应该能通过健康检查', async () => {
      const health = await manager.healthCheck()
      assert.strictEqual(health.status, 'healthy')
      assert.ok(health.latency >= 0)
    })
  })

  describe('导出导入', () => {
    it('应该能导出和导入数据', async () => {
      const exported = await manager.export()
      assert.ok(exported.items)

      await manager.clear()
      const result = await manager.import(exported)
      assert.strictEqual(result.success, result.total)
    })
  })
})

// ========== Cacheable 装饰器测试 ==========
describe('Cacheable', () => {
  let cacheService
  let cacheableDecorator

  before(() => {
    cacheService = new CacheService()
    cacheableDecorator = new Cacheable({
      cacheService,
      ttl: 5000,
    })
  })

  after(async () => {
    await cacheService.shutdown()
  })

  describe('方法装饰器', () => {
    it('应该能缓存方法结果', async () => {
      let callCount = 0

      class TestClass {
        constructor() {
          // 手动应用装饰器
          const original = this.expensiveMethod
          this.expensiveMethod = cacheableDecorator.decorateFunction(original)
        }

        async expensiveMethod(id) {
          callCount++
          return { id, data: 'result' }
        }
      }

      const instance = new TestClass()

      // 第一次调用
      const result1 = await instance.expensiveMethod(1)
      assert.strictEqual(callCount, 1)
      assert.strictEqual(result1.id, 1)

      // 第二次调用（应该从缓存）
      const result2 = await instance.expensiveMethod(1)
      assert.strictEqual(callCount, 1) // 不应该再次调用
      assert.strictEqual(result2.id, 1)
    })

    it('应该支持自定义 key 生成', async () => {
      const customCacheable = new Cacheable({
        cacheService,
        keyGenerator: (methodName, args) => `custom:${methodName}:${args[0]}`,
      })

      let callCount = 0

      const testFn = async (id) => {
        callCount++
        return { id }
      }

      const cachedFn = customCacheable.decorateFunction(testFn)

      await cachedFn(1)
      await cachedFn(1)
      assert.strictEqual(callCount, 1)
    })

    it('应该支持条件缓存', async () => {
      const conditionalCacheable = new Cacheable({
        cacheService,
        condition: (result) => result !== null,
      })

      let callCount = 0

      const testFn = async (shouldReturn) => {
        callCount++
        return shouldReturn ? { data: 'ok' } : null
      }

      const cachedFn = conditionalCacheable.decorateFunction(testFn)

      await cachedFn(false) // 不缓存 null
      await cachedFn(false)
      assert.strictEqual(callCount, 2) // 应该调用两次

      await cachedFn(true) // 缓存结果
      await cachedFn(true)
      assert.strictEqual(callCount, 3) // 第二次从缓存
    })
  })

  describe('缓存失效', () => {
    it('应该能失效缓存', async () => {
      let callCount = 0

      const getData = async (id) => {
        callCount++
        return { id, timestamp: Date.now() }
      }

      const cachedGetData = cacheableDecorator.decorateFunction(getData)

      // 第一次调用
      await cachedGetData(1)
      assert.strictEqual(callCount, 1)

      // 第二次调用（应该从缓存）
      await cachedGetData(1)
      assert.strictEqual(callCount, 1)

      // 手动失效缓存
      await cacheService.delete('cacheable:getData:1')

      // 第三次调用（缓存失效后重新调用）
      await cachedGetData(1)
      assert.strictEqual(callCount, 2)
    })
  })
})

// ========== CacheMiddleware 测试 ==========
describe('CacheMiddleware', () => {
  describe('中间件创建', () => {
    it('应该能创建中间件', () => {
      const middleware = createCacheMiddleware({
        cacheControl: 'public, max-age=60',
      })
      assert.ok(typeof middleware === 'function')
    })

    it('应该能创建带自定义配置的中间件', () => {
      const config = {
        enableETag: true,
        enableLastModified: true,
        excludePatterns: ['/api/admin', '/health'],
      }

      const middleware = new CacheMiddleware(config)
      assert.ok(middleware)
    })
  })

  describe('缓存控制', () => {
    it('应该能检查路径是否应该缓存', () => {
      const config = new CacheMiddlewareConfig({
        excludePatterns: ['/api/admin', /^\/internal/],
      })

      assert.strictEqual(config.shouldCache('/api/users'), true)
      assert.strictEqual(config.shouldCache('/api/admin'), false)
      assert.strictEqual(config.shouldCache('/internal/check'), false)
    })
  })

  describe('手动缓存', () => {
    it('应该能手动缓存响应', async () => {
      const middleware = new CacheMiddleware()

      await middleware.cache('test-key', { data: 'test' }, {
        ttl: 5000,
        contentType: 'application/json',
      })

      const cached = await middleware.getCached('test-key')
      assert.ok(cached)
      assert.strictEqual(cached.body.data, 'test')
    })

    it('应该能失效缓存', async () => {
      const middleware = new CacheMiddleware()

      await middleware.cache('invalidate-key', { data: 'test' })
      await middleware.invalidate('invalidate-key')

      const cached = await middleware.getCached('invalidate-key')
      assert.strictEqual(cached, undefined)
    })
  })
})

// ========== 性能测试 ==========
describe('Cache Performance', () => {
  it('内存缓存应该有 sub-millisecond 响应时间', async () => {
    const cache = new MemoryCache()

    const iterations = 1000
    const startTime = Date.now()

    for (let i = 0; i < iterations; i++) {
      cache.set(`perf-key-${i}`, `value-${i}`)
      cache.get(`perf-key-${i}`)
    }

    const elapsed = Date.now() - startTime
    const avgTime = elapsed / (iterations * 2)

    assert.ok(avgTime < 1, `平均响应时间应该小于 1ms，实际：${avgTime}ms`)

    cache.stopCleanup()
  })

  it('应该能处理大量缓存项', () => {
    const cache = new MemoryCache({ maxSize: 10000 })

    for (let i = 0; i < 5000; i++) {
      cache.set(`bulk-${i}`, { id: i, data: 'test'.repeat(10) })
    }

    assert.strictEqual(cache.size(), 5000)

    // 随机访问
    let hits = 0
    for (let i = 0; i < 1000; i++) {
      const key = `bulk-${Math.floor(Math.random() * 5000)}`
      if (cache.get(key) !== undefined) {
        hits++
      }
    }

    assert.ok(hits > 0)

    cache.stopCleanup()
  })
})
