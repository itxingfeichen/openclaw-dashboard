/**
 * 缓存服务主类
 * 提供统一的缓存接口，支持内存缓存和 Redis 缓存
 */

import { MemoryCache } from './memory-cache.js'
import { RedisCache } from './redis-cache.js'
import { TTLStrategy, LRUStrategy, StrategyFactory } from './cache-strategy.js'

/**
 * 缓存类型枚举
 */
export const CacheType = {
  MEMORY: 'memory',
  REDIS: 'redis',
  HYBRID: 'hybrid',  // 混合模式：内存为主，Redis 为辅
}

/**
 * 缓存服务类
 */
export class CacheService {
  /**
   * @param {Object} options - 缓存配置
   * @param {string} options.type - 缓存类型：'memory' | 'redis' | 'hybrid'
   * @param {Object} options.memory - 内存缓存配置
   * @param {Object} options.redis - Redis 缓存配置
   * @param {string} options.strategy - 淘汰策略：'lru' | 'lfu' | 'fifo' | 'ttl'
   * @param {number} options.maxSize - 最大缓存项数量
   * @param {number} options.defaultTTL - 默认 TTL (毫秒)
   */
  constructor(options = {}) {
    this.type = options.type || CacheType.MEMORY
    this.strategy = options.strategy || 'lru'
    this.maxSize = options.maxSize || 1000
    this.defaultTTL = options.defaultTTL || 0

    // 初始化缓存实例
    this.memoryCache = null
    this.redisCache = null

    this.initialize(options)
  }

  /**
   * 初始化缓存
   */
  async initialize(options = {}) {
    // 初始化内存缓存
    this.memoryCache = new MemoryCache({
      maxSize: this.maxSize,
      strategy: this.strategy,
      defaultTTL: this.defaultTTL,
      ...options.memory,
    })

    // 如果配置了 Redis，尝试初始化
    if (this.type === CacheType.REDIS || this.type === CacheType.HYBRID) {
      try {
        this.redisCache = new RedisCache({
          ...options.redis,
          defaultTTL: Math.floor(this.defaultTTL / 1000), // 转换为秒
          lazyInit: true,
        })
      } catch (error) {
        console.warn('Redis initialization failed, falling back to memory cache')
        this.type = CacheType.MEMORY
      }
    }
  }

  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @param {Object} options - 可选配置
   * @returns {Promise<any>}
   */
  async get(key, options = {}) {
    const useRedis = options.useRedis || this.type === CacheType.REDIS

    // 混合模式：先查内存，再查 Redis
    if (this.type === CacheType.HYBRID) {
      let value = this.memoryCache.get(key)
      if (value !== undefined) {
        return value
      }

      // 内存未命中，查 Redis
      if (this.redisCache) {
        try {
          value = await this.redisCache.get(key)
          if (value !== null) {
            // 回填到内存缓存
            this.memoryCache.set(key, value, { ttl: options.ttl })
            return value
          }
        } catch (error) {
          console.warn('Redis get failed:', error.message)
        }
      }

      return undefined
    }

    // Redis 模式
    if (useRedis && this.redisCache) {
      try {
        const value = await this.redisCache.get(key)
        return value !== null ? value : undefined
      } catch (error) {
        console.warn('Redis get failed:', error.message)
        // 降级到内存缓存
        return this.memoryCache.get(key)
      }
    }

    // 内存模式
    return this.memoryCache.get(key)
  }

  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {Object} options - 可选配置
   * @param {number} options.ttl - 过期时间 (毫秒)
   */
  async set(key, value, options = {}) {
    const ttl = options.ttl !== undefined ? options.ttl : this.defaultTTL
    const useRedis = options.useRedis || this.type === CacheType.REDIS

    // 混合模式：同时写入内存和 Redis
    if (this.type === CacheType.HYBRID) {
      this.memoryCache.set(key, value, { ttl })

      if (this.redisCache) {
        try {
          await this.redisCache.set(key, value, {
            ttl: Math.floor(ttl / 1000),
          })
        } catch (error) {
          console.warn('Redis set failed:', error.message)
        }
      }
      return
    }

    // Redis 模式
    if (useRedis && this.redisCache) {
      try {
        await this.redisCache.set(key, value, { ttl: Math.floor(ttl / 1000) })
        return
      } catch (error) {
        console.warn('Redis set failed, falling back to memory:', error.message)
      }
    }

    // 内存模式
    this.memoryCache.set(key, value, { ttl })
  }

  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async delete(key) {
    const memoryDeleted = this.memoryCache.delete(key)

    if (this.redisCache) {
      try {
        await this.redisCache.delete(key)
      } catch (error) {
        console.warn('Redis delete failed:', error.message)
      }
    }

    return memoryDeleted
  }

  /**
   * 检查键是否存在
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async has(key) {
    if (this.type === CacheType.HYBRID) {
      if (this.memoryCache.has(key)) return true
      if (this.redisCache) {
        try {
          return await this.redisCache.has(key)
        } catch (error) {
          return false
        }
      }
      return false
    }

    if (this.type === CacheType.REDIS && this.redisCache) {
      try {
        return await this.redisCache.has(key)
      } catch (error) {
        return this.memoryCache.has(key)
      }
    }

    return this.memoryCache.has(key)
  }

  /**
   * 批量获取
   * @param {string[]} keys - 缓存键数组
   * @returns {Promise<Object>}
   */
  async mget(keys) {
    if (this.type === CacheType.REDIS && this.redisCache) {
      try {
        return await this.redisCache.mget(keys)
      } catch (error) {
        console.warn('Redis mget failed, falling back to memory:', error.message)
      }
    }

    // 内存缓存批量获取
    const result = {}
    keys.forEach(key => {
      const value = this.memoryCache.get(key)
      if (value !== undefined) {
        result[key] = value
      }
    })
    return result
  }

  /**
   * 批量设置
   * @param {Object} items - 键值对对象
   * @param {Object} options - 可选配置
   */
  async mset(items, options = {}) {
    if (this.type === CacheType.REDIS && this.redisCache) {
      try {
        await this.redisCache.mset(items, {
          ttl: options.ttl ? Math.floor(options.ttl / 1000) : undefined,
        })
        return
      } catch (error) {
        console.warn('Redis mset failed, falling back to memory:', error.message)
      }
    }

    // 内存缓存批量设置
    Object.entries(items).forEach(([key, value]) => {
      this.memoryCache.set(key, value, { ttl: options.ttl })
    })
  }

  /**
   * 批量删除
   * @param {string[]} keys - 缓存键数组
   * @returns {Promise<number>}
   */
  async mdelete(keys) {
    let count = 0

    keys.forEach(key => {
      if (this.memoryCache.delete(key)) count++
    })

    if (this.redisCache) {
      try {
        const redisCount = await this.redisCache.mdelete(keys)
        count = Math.max(count, redisCount)
      } catch (error) {
        console.warn('Redis mdelete failed:', error.message)
      }
    }

    return count
  }

  /**
   * 删除匹配模式的键
   * @param {string} pattern - 匹配模式
   * @returns {Promise<number>}
   */
  async deleteByPattern(pattern) {
    const memoryCount = this.memoryCache.deleteByPattern(pattern)

    if (this.redisCache) {
      try {
        const redisCount = await this.redisCache.deleteByPattern(pattern)
        return memoryCount + redisCount
      } catch (error) {
        console.warn('Redis deleteByPattern failed:', error.message)
      }
    }

    return memoryCount
  }

  /**
   * 清空缓存
   */
  async clear() {
    this.memoryCache.clear()

    if (this.redisCache) {
      try {
        await this.redisCache.clear()
      } catch (error) {
        console.warn('Redis clear failed:', error.message)
      }
    }
  }

  /**
   * 获取缓存项数量
   * @returns {Promise<number>}
   */
  async size() {
    if (this.type === CacheType.REDIS && this.redisCache) {
      try {
        return await this.redisCache.size()
      } catch (error) {
        console.warn('Redis size failed:', error.message)
      }
    }

    return this.memoryCache.size()
  }

  /**
   * 获取所有键
   * @param {string} pattern - 可选的匹配模式
   * @returns {Promise<string[]>}
   */
  async keys(pattern = '*') {
    if (this.type === CacheType.REDIS && this.redisCache) {
      try {
        return await this.redisCache.keys(pattern)
      } catch (error) {
        console.warn('Redis keys failed:', error.message)
      }
    }

    if (pattern === '*') {
      return this.memoryCache.keys()
    }

    // 内存缓存模式匹配
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return this.memoryCache.keys().filter(key => regex.test(key))
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>}
   */
  async getStats() {
    const memoryStats = this.memoryCache.getStats()

    if (this.redisCache) {
      try {
        const redisStats = await this.redisCache.getStats()
        return {
          type: this.type,
          memory: memoryStats,
          redis: redisStats,
        }
      } catch (error) {
        return {
          type: this.type,
          memory: memoryStats,
          redis: { error: error.message },
        }
      }
    }

    return {
      type: this.type,
      memory: memoryStats,
    }
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.memoryCache.resetStats()
    if (this.redisCache) {
      this.redisCache.resetStats()
    }
  }

  /**
   * 预热缓存
   * @param {Array<{key: string, value: any, ttl?: number}>} items - 缓存项数组
   */
  async warmup(items) {
    this.memoryCache.warmup(items)

    if (this.redisCache) {
      try {
        const redisItems = {}
        items.forEach(item => {
          redisItems[item.key] = item.value
        })
        await this.redisCache.mset(redisItems, {
          ttl: items[0]?.ttl ? Math.floor(items[0].ttl / 1000) : undefined,
        })
      } catch (error) {
        console.warn('Redis warmup failed:', error.message)
      }
    }
  }

  /**
   * 导出缓存数据
   * @returns {Object}
   */
  export() {
    return this.memoryCache.export()
  }

  /**
   * 从导出数据导入
   * @param {Object} data - 导出的数据
   */
  import(data) {
    this.memoryCache.import(data)
  }

  /**
   * 关闭缓存服务
   */
  async shutdown() {
    this.memoryCache.stopCleanup()

    if (this.redisCache) {
      try {
        await this.redisCache.disconnect()
      } catch (error) {
        console.warn('Redis disconnect failed:', error.message)
      }
    }
  }

  /**
   * 获取底层缓存实例（用于高级操作）
   * @returns {Object}
   */
  getInstances() {
    return {
      memory: this.memoryCache,
      redis: this.redisCache,
    }
  }
}

/**
 * 创建默认缓存服务实例
 * @param {Object} options - 配置选项
 * @returns {CacheService}
 */
export function createCacheService(options = {}) {
  return new CacheService(options)
}

export default CacheService
