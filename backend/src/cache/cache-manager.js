/**
 * 缓存管理器
 * 提供缓存统计、批量失效、缓存预热等管理功能
 */

import { CacheService, CacheType } from './cache-service.js'
import { MemoryCache } from './memory-cache.js'

/**
 * 缓存统计信息
 */
export class CacheStats {
  constructor() {
    this.hits = 0
    this.misses = 0
    this.sets = 0
    this.deletes = 0
    this.evictions = 0
    this.expirations = 0
    this.errors = 0
    this.startTime = Date.now()
  }

  /**
   * 计算命中率
   * @returns {number} 命中率百分比
   */
  getHitRate() {
    const total = this.hits + this.misses
    return total > 0 ? ((this.hits / total) * 100).toFixed(2) : 0
  }

  /**
   * 计算每秒操作数
   * @returns {Object}
   */
  getOpsPerSecond() {
    const uptime = (Date.now() - this.startTime) / 1000
    if (uptime <= 0) return { hits: 0, misses: 0, sets: 0, deletes: 0 }

    return {
      hits: (this.hits / uptime).toFixed(2),
      misses: (this.misses / uptime).toFixed(2),
      sets: (this.sets / uptime).toFixed(2),
      deletes: (this.deletes / uptime).toFixed(2),
    }
  }

  /**
   * 转换为对象
   * @returns {Object}
   */
  toJSON() {
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      deletes: this.deletes,
      evictions: this.evictions,
      expirations: this.expirations,
      errors: this.errors,
      hitRate: this.getHitRate() + '%',
      opsPerSecond: this.getOpsPerSecond(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    }
  }
}

/**
 * 缓存预热配置
 */
export class WarmupConfig {
  constructor(options = {}) {
    // 预热数据源
    this.dataSource = options.dataSource

    // 批量大小
    this.batchSize = options.batchSize || 100

    // 并发数
    this.concurrency = options.concurrency || 5

    // 重试次数
    this.retries = options.retries || 3

    // 重试延迟 (毫秒)
    this.retryDelay = options.retryDelay || 1000

    // 进度回调
    this.onProgress = options.onProgress || null

    // 完成回调
    this.onComplete = options.onComplete || null

    // 错误回调
    this.onError = options.onError || null
  }
}

/**
 * 缓存管理器类
 */
export class CacheManager {
  /**
   * @param {Object} options - 配置选项
   * @param {CacheService} options.cacheService - 缓存服务实例
   * @param {boolean} options.enableStats - 是否启用统计
   */
  constructor(options = {}) {
    this.cacheService = options.cacheService || new CacheService()
    this.enableStats = options.enableStats !== false

    // 统计信息
    this.stats = new CacheStats()

    // 缓存区域（命名空间）
    this.namespaces = new Map()

    // 预热任务
    this.warmupTasks = new Map()

    this.initialize()
  }

  /**
   * 初始化
   */
  async initialize() {
    // 从持久化存储恢复统计信息（如果支持）
    // 这里可以扩展为从数据库或文件恢复
  }

  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @param {string} namespace - 命名空间
   * @returns {Promise<any>}
   */
  async get(key, namespace = 'default') {
    const fullKey = this.makeKey(key, namespace)
    const result = await this.cacheService.get(fullKey)

    if (this.enableStats) {
      if (result !== undefined) {
        this.stats.hits++
      } else {
        this.stats.misses++
      }
    }

    return result
  }

  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {Object} options - 可选配置
   * @param {string} options.namespace - 命名空间
   * @param {number} options.ttl - 过期时间
   */
  async set(key, value, options = {}) {
    const namespace = options.namespace || 'default'
    const fullKey = this.makeKey(key, namespace)

    await this.cacheService.set(fullKey, value, { ttl: options.ttl })

    if (this.enableStats) {
      this.stats.sets++
    }

    // 记录到命名空间
    this.addToNamespace(namespace, key)
  }

  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   * @param {string} namespace - 命名空间
   * @returns {Promise<boolean>}
   */
  async delete(key, namespace = 'default') {
    const fullKey = this.makeKey(key, namespace)
    const result = await this.cacheService.delete(fullKey)

    if (this.enableStats) {
      this.stats.deletes++
    }

    // 从命名空间移除
    this.removeFromNamespace(namespace, key)

    return result
  }

  /**
   * 批量失效缓存
   * @param {Array<string>} keys - 缓存键数组
   * @param {string} namespace - 命名空间
   * @returns {Promise<number>} 删除的数量
   */
  async deleteBatch(keys, namespace = 'default') {
    const fullKeys = keys.map(key => this.makeKey(key, namespace))
    const count = await this.cacheService.mdelete(fullKeys)

    if (this.enableStats) {
      this.stats.deletes += count
    }

    // 从命名空间移除
    keys.forEach(key => this.removeFromNamespace(namespace, key))

    return count
  }

  /**
   * 按命名空间批量失效
   * @param {string} namespace - 命名空间
   * @returns {Promise<number>} 删除的数量
   */
  async deleteByNamespace(namespace) {
    const pattern = `${namespace}:*`
    const count = await this.cacheService.deleteByPattern(pattern)

    if (this.enableStats) {
      this.stats.deletes += count
    }

    // 清空命名空间记录
    this.namespaces.delete(namespace)

    return count
  }

  /**
   * 按模式批量失效
   * @param {string} pattern - 匹配模式
   * @returns {Promise<number>} 删除的数量
   */
  async deleteByPattern(pattern) {
    const count = await this.cacheService.deleteByPattern(pattern)

    if (this.enableStats) {
      this.stats.deletes += count
    }

    return count
  }

  /**
   * 清空所有缓存
   */
  async clear() {
    await this.cacheService.clear()
    this.namespaces.clear()

    if (this.enableStats) {
      this.stats = new CacheStats()
    }
  }

  /**
   * 缓存预热
   * @param {Array<{key: string, value: any, ttl?: number}>} items - 缓存项数组
   * @param {string} namespace - 命名空间
   * @returns {Promise<Object>} 预热结果
   */
  async warmup(items, namespace = 'default') {
    const result = {
      total: items.length,
      success: 0,
      failed: 0,
      errors: [],
    }

    for (const item of items) {
      try {
        await this.set(item.key, item.value, {
          namespace,
          ttl: item.ttl,
        })
        result.success++
      } catch (error) {
        result.failed++
        result.errors.push({
          key: item.key,
          error: error.message,
        })

        if (this.enableStats) {
          this.stats.errors++
        }
      }
    }

    return result
  }

  /**
   * 从数据源预热缓存
   * @param {WarmupConfig} config - 预热配置
   * @returns {Promise<Object>} 预热结果
   */
  async warmupFromSource(config) {
    if (!config.dataSource) {
      throw new Error('dataSource is required')
    }

    const result = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      startTime: Date.now(),
    }

    try {
      // 获取数据
      const data = await config.dataSource()
      result.total = data.length

      // 分批处理
      const batches = []
      for (let i = 0; i < data.length; i += config.batchSize) {
        batches.push(data.slice(i, i + config.batchSize))
      }

      // 并发处理批次
      const processBatch = async (batch, batchIndex) => {
        for (const item of batch) {
          try {
            await this.set(item.key, item.value, {
              namespace: item.namespace || 'default',
              ttl: item.ttl,
            })
            result.success++

            if (config.onProgress) {
              config.onProgress({
                processed: result.success + result.failed,
                total: result.total,
                batch: batchIndex,
              })
            }
          } catch (error) {
            result.failed++
            result.errors.push({
              key: item.key,
              error: error.message,
            })

            if (this.enableStats) {
              this.stats.errors++
            }
          }
        }
      }

      // 限制并发数
      for (let i = 0; i < batches.length; i += config.concurrency) {
        const batchPromises = []
        for (let j = 0; j < config.concurrency && i + j < batches.length; j++) {
          batchPromises.push(processBatch(batches[i + j], i + j))
        }
        await Promise.all(batchPromises)
      }

      result.endTime = Date.now()
      result.duration = result.endTime - result.startTime

      if (config.onComplete) {
        config.onComplete(result)
      }
    } catch (error) {
      result.error = error.message

      if (config.onError) {
        config.onError(error)
      }
    }

    return result
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>}
   */
  async getStats() {
    const cacheStats = await this.cacheService.getStats()

    return {
      cache: cacheStats,
      manager: this.stats.toJSON(),
      namespaces: this.getNamespaceStats(),
    }
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = new CacheStats()
    this.cacheService.resetStats()
  }

  /**
   * 获取命名空间统计
   * @returns {Object}
   */
  getNamespaceStats() {
    const stats = {}

    for (const [namespace, keys] of this.namespaces.entries()) {
      stats[namespace] = {
        count: keys.size,
        keys: Array.from(keys),
      }
    }

    return stats
  }

  /**
   * 导出缓存数据
   * @param {string} namespace - 命名空间，可选
   * @returns {Promise<Object>}
   */
  async export(namespace = null) {
    const data = this.cacheService.export()

    if (namespace) {
      // 过滤特定命名空间的数据
      const prefix = `${namespace}:`
      data.items = data.items.filter(item => item.key.startsWith(prefix))
    }

    return data
  }

  /**
   * 导入缓存数据
   * @param {Object} data - 导出的数据
   * @returns {Promise<Object>} 导入结果
   */
  async import(data) {
    const result = {
      total: data.items?.length || 0,
      success: 0,
      failed: 0,
      errors: [],
    }

    try {
      this.cacheService.import(data)
      result.success = result.total
    } catch (error) {
      result.failed = result.total
      result.errors.push(error.message)
    }

    return result
  }

  /**
   * 健康检查
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    const startTime = Date.now()

    try {
      // 测试写入
      const testKey = `health:${Date.now()}`
      await this.cacheService.set(testKey, 'ok', { ttl: 1000 })

      // 测试读取
      const value = await this.cacheService.get(testKey)

      // 测试删除
      await this.cacheService.delete(testKey)

      const latency = Date.now() - startTime

      return {
        status: 'healthy',
        latency,
        cacheType: this.cacheService.type,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        latency: Date.now() - startTime,
      }
    }
  }

  /**
   * 生成完整缓存键
   * @private
   */
  makeKey(key, namespace) {
    return `${namespace}:${key}`
  }

  /**
   * 添加到命名空间
   * @private
   */
  addToNamespace(namespace, key) {
    if (!this.namespaces.has(namespace)) {
      this.namespaces.set(namespace, new Set())
    }
    this.namespaces.get(namespace).add(key)
  }

  /**
   * 从命名空间移除
   * @private
   */
  removeFromNamespace(namespace, key) {
    const keys = this.namespaces.get(namespace)
    if (keys) {
      keys.delete(key)
      if (keys.size === 0) {
        this.namespaces.delete(namespace)
      }
    }
  }

  /**
   * 获取命名空间中的所有键
   * @param {string} namespace - 命名空间
   * @returns {Array<string>}
   */
  getNamespaceKeys(namespace) {
    const keys = this.namespaces.get(namespace)
    return keys ? Array.from(keys) : []
  }

  /**
   * 获取所有命名空间
   * @returns {Array<string>}
   */
  getNamespaces() {
    return Array.from(this.namespaces.keys())
  }

  /**
   * 关闭管理器
   */
  async shutdown() {
    await this.cacheService.shutdown()
  }
}

/**
 * 创建缓存管理器的工厂函数
 * @param {Object} options - 配置选项
 * @returns {CacheManager}
 */
export function createCacheManager(options = {}) {
  return new CacheManager(options)
}

export default {
  CacheManager,
  CacheStats,
  WarmupConfig,
  createCacheManager,
}
