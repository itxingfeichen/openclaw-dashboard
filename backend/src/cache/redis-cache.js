/**
 * Redis 缓存实现
 * 支持 Redis 客户端的所有基本操作
 */

import { CacheStrategy } from './cache-strategy.js'

/**
 * Redis 缓存类
 */
export class RedisCache {
  /**
   * @param {Object} options - Redis 配置
   * @param {string} options.host - Redis 主机 (默认 'localhost')
   * @param {number} options.port - Redis 端口 (默认 6379)
   * @param {string} options.password - Redis 密码 (可选)
   * @param {number} options.db - Redis 数据库 (默认 0)
   * @param {string} options.keyPrefix - 键前缀 (默认 '')
   * @param {number} options.defaultTTL - 默认 TTL (秒)，0 表示不过期 (默认 0)
   * @param {boolean} options.enableStats - 是否启用统计 (默认 true)
   */
  constructor(options = {}) {
    this.config = {
      host: options.host || 'localhost',
      port: options.port || 6379,
      password: options.password,
      db: options.db || 0,
      keyPrefix: options.keyPrefix || '',
      defaultTTL: options.defaultTTL || 0,
    }

    this.enableStats = options.enableStats !== false
    this.client = null
    this.connected = false

    // 统计信息
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    }

    // 延迟初始化，避免启动时依赖 Redis
    this.lazyInit = options.lazyInit !== false
  }

  /**
   * 获取 Redis 客户端（延迟初始化）
   */
  async getClient() {
    if (this.client) {
      return this.client
    }

    // 动态导入 redis 客户端
    try {
      const { createClient } = await import('redis')
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
        },
        password: this.config.password,
        database: this.config.db,
      })

      this.client.on('error', err => {
        console.error('Redis Client Error:', err)
        if (this.enableStats) this.stats.errors++
      })

      await this.client.connect()
      this.connected = true
      return this.client
    } catch (error) {
      console.warn('Redis not available, falling back to memory cache')
      throw new Error('Redis connection failed: ' + error.message)
    }
  }

  /**
   * 生成带前缀的键
   */
  makeKey(key) {
    return this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key
  }

  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @returns {Promise<any>} 缓存值，不存在返回 null
   */
  async get(key) {
    try {
      const client = await this.getClient()
      const value = await client.get(this.makeKey(key))

      if (value === null) {
        if (this.enableStats) this.stats.misses++
        return null
      }

      // 尝试解析 JSON
      try {
        const parsed = JSON.parse(value)
        if (this.enableStats) this.stats.hits++
        return parsed
      } catch {
        // 非 JSON 值
        if (this.enableStats) this.stats.hits++
        return value
      }
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {Object} options - 可选配置
   * @param {number} options.ttl - 过期时间 (秒)
   */
  async set(key, value, options = {}) {
    try {
      const client = await this.getClient()
      const ttl = options.ttl !== undefined ? options.ttl : this.config.defaultTTL
      const serialized = JSON.stringify(value)

      if (ttl > 0) {
        await client.setEx(this.makeKey(key), ttl, serialized)
      } else {
        await client.set(this.makeKey(key), serialized)
      }

      if (this.enableStats) this.stats.sets++
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   * @returns {Promise<number>} 删除的数量
   */
  async delete(key) {
    try {
      const client = await this.getClient()
      const result = await client.del(this.makeKey(key))

      if (this.enableStats) this.stats.deletes++
      return result
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async has(key) {
    try {
      const client = await this.getClient()
      const exists = await client.exists(this.makeKey(key))
      return exists === 1
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 批量获取
   * @param {string[]} keys - 缓存键数组
   * @returns {Promise<Object>} 键值对对象
   */
  async mget(keys) {
    try {
      const client = await this.getClient()
      const prefixedKeys = keys.map(k => this.makeKey(k))
      const values = await client.mGet(prefixedKeys)

      const result = {}
      keys.forEach((key, index) => {
        const value = values[index]
        if (value !== null) {
          try {
            result[key] = JSON.parse(value)
          } catch {
            result[key] = value
          }
        }
      })

      return result
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 批量设置
   * @param {Object} items - 键值对对象
   * @param {Object} options - 可选配置
   * @param {number} options.ttl - 过期时间 (秒)
   */
  async mset(items, options = {}) {
    try {
      const client = await this.getClient()
      const ttl = options.ttl !== undefined ? options.ttl : this.config.defaultTTL

      const pipeline = client.multi()
      const prefixedItems = Object.entries(items).map(([key, value]) => [
        this.makeKey(key),
        JSON.stringify(value),
      ])

      if (ttl > 0) {
        prefixedItems.forEach(([key, value]) => {
          pipeline.setEx(key, ttl, value)
        })
      } else {
        prefixedItems.forEach(([key, value]) => {
          pipeline.set(key, value)
        })
      }

      await pipeline.exec()

      if (this.enableStats) this.stats.sets += Object.keys(items).length
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 批量删除
   * @param {string[]} keys - 缓存键数组
   * @returns {Promise<number>} 删除的数量
   */
  async mdelete(keys) {
    try {
      const client = await this.getClient()
      const prefixedKeys = keys.map(k => this.makeKey(k))
      const result = await client.del(prefixedKeys)

      if (this.enableStats) this.stats.deletes += result
      return result
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 删除匹配模式的键
   * @param {string} pattern - 匹配模式，支持 * 通配符
   * @returns {Promise<number>} 删除的数量
   */
  async deleteByPattern(pattern) {
    try {
      const client = await this.getClient()
      const prefixedPattern = this.config.keyPrefix
        ? `${this.config.keyPrefix}:${pattern}`
        : pattern

      const keys = await client.keys(prefixedPattern)
      if (keys.length === 0) return 0

      const result = await client.del(keys)
      if (this.enableStats) this.stats.deletes += result
      return result
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 清空缓存
   */
  async clear() {
    try {
      const client = await this.getClient()
      if (this.config.keyPrefix) {
        await this.deleteByPattern('*')
      } else {
        await client.flushDb()
      }
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>}
   */
  async getStats() {
    if (!this.enableStats) return null

    try {
      const client = await this.getClient()
      const info = await client.info('stats')

      // 解析 Redis 统计信息
      const redisStats = {}
      info.split('\r\n').forEach(line => {
        const [key, value] = line.split(':')
        if (key && value) {
          redisStats[key] = value
        }
      })

      return {
        ...this.stats,
        connected: this.connected,
        redis: redisStats,
      }
    } catch (error) {
      return {
        ...this.stats,
        connected: this.connected,
        error: error.message,
      }
    }
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    }
  }

  /**
   * 获取缓存项数量
   * @returns {Promise<number>}
   */
  async size() {
    try {
      const client = await this.getClient()
      const keys = await client.keys(this.config.keyPrefix + '*')
      return keys.length
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 获取所有键
   * @param {string} pattern - 可选的匹配模式
   * @returns {Promise<string[]>}
   */
  async keys(pattern = '*') {
    try {
      const client = await this.getClient()
      const prefixedPattern = this.config.keyPrefix
        ? `${this.config.keyPrefix}:${pattern}`
        : pattern

      const keys = await client.keys(prefixedPattern)

      // 移除前缀
      if (this.config.keyPrefix) {
        return keys.map(k => k.replace(`${this.config.keyPrefix}:`, ''))
      }

      return keys
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 增加计数
   * @param {string} key - 缓存键
   * @param {number} increment - 增量 (默认 1)
   * @returns {Promise<number>} 新值
   */
  async incr(key, increment = 1) {
    try {
      const client = await this.getClient()
      return await client.incrBy(this.makeKey(key), increment)
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 减少计数
   * @param {string} key - 缓存键
   * @param {number} decrement - 减量 (默认 1)
   * @returns {Promise<number>} 新值
   */
  async decr(key, decrement = 1) {
    try {
      const client = await this.getClient()
      return await client.decrBy(this.makeKey(key), decrement)
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 设置过期时间
   * @param {string} key - 缓存键
   * @param {number} ttl - 过期时间 (秒)
   * @returns {Promise<boolean>}
   */
  async expire(key, ttl) {
    try {
      const client = await this.getClient()
      return await client.expire(this.makeKey(key), ttl)
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 获取剩余过期时间
   * @param {string} key - 缓存键
   * @returns {Promise<number>} 剩余秒数，-1 表示永不过期，-2 表示不存在
   */
  async ttl(key) {
    try {
      const client = await this.getClient()
      return await client.ttl(this.makeKey(key))
    } catch (error) {
      if (this.enableStats) this.stats.errors++
      throw error
    }
  }

  /**
   * 关闭连接
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit()
      this.client = null
      this.connected = false
    }
  }

  /**
   * 检查连接状态
   * @returns {Promise<boolean>}
   */
  async isConnected() {
    if (!this.client) return false
    try {
      await this.client.ping()
      return true
    } catch {
      return false
    }
  }
}

export default RedisCache
