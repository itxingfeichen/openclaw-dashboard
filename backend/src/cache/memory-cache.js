/**
 * 内存缓存实现
 * 使用 LRU 策略管理缓存项
 */

import { CacheStrategy } from './cache-strategy.js'

/**
 * LRU 缓存节点
 */
class LRUNode {
  constructor(key, value, ttl) {
    this.key = key
    this.value = value
    this.ttl = ttl
    this.expiresAt = ttl ? Date.now() + ttl : null
    this.prev = null
    this.next = null
    this.accessCount = 0
    this.lastAccessed = Date.now()
  }

  isExpired() {
    return this.expiresAt !== null && Date.now() > this.expiresAt
  }

  touch() {
    this.accessCount++
    this.lastAccessed = Date.now()
  }
}

/**
 * 内存缓存类
 * 支持 TTL、LRU、LFU 策略
 */
export class MemoryCache {
  /**
   * @param {Object} options - 缓存配置
   * @param {number} options.maxSize - 最大缓存项数量 (默认 1000)
   * @param {string} options.strategy - 淘汰策略：'lru' | 'lfu' | 'fifo' (默认 'lru')
   * @param {number} options.defaultTTL - 默认 TTL (毫秒)，0 表示不过期 (默认 0)
   * @param {boolean} options.enableStats - 是否启用统计 (默认 true)
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000
    this.strategy = options.strategy || 'lru'
    this.defaultTTL = options.defaultTTL || 0
    this.enableStats = options.enableStats !== false

    // 缓存存储
    this.cache = new Map()

    // LRU 双向链表头尾
    this.head = null
    this.tail = null

    // 统计信息
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expirations: 0,
    }

    // 定期清理过期项
    this.cleanupInterval = null
    this.startCleanup()
  }

  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @returns {any} 缓存值，不存在或过期返回 undefined
   */
  get(key) {
    const node = this.cache.get(key)

    if (!node) {
      if (this.enableStats) this.stats.misses++
      return undefined
    }

    // 检查是否过期
    if (node.isExpired()) {
      this.delete(key)
      if (this.enableStats) {
        this.stats.misses++
        this.stats.expirations++
      }
      return undefined
    }

    // 更新访问信息
    node.touch()

    // LRU 策略：移动到链表头部
    if (this.strategy === 'lru') {
      this.moveToHead(node)
    }

    if (this.enableStats) this.stats.hits++
    return node.value
  }

  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {Object} options - 可选配置
   * @param {number} options.ttl - 过期时间 (毫秒)
   */
  set(key, value, options = {}) {
    const ttl = options.ttl !== undefined ? options.ttl : this.defaultTTL
    const existingNode = this.cache.get(key)

    // 如果已存在，更新值
    if (existingNode) {
      existingNode.value = value
      existingNode.ttl = ttl
      existingNode.expiresAt = ttl ? Date.now() + ttl : null
      existingNode.touch()

      if (this.strategy === 'lru') {
        this.moveToHead(existingNode)
      }

      if (this.enableStats) this.stats.sets++
      return
    }

    // 检查是否需要淘汰
    if (this.cache.size >= this.maxSize) {
      this.evict()
    }

    // 创建新节点
    const node = new LRUNode(key, value, ttl)

    // 添加到缓存
    this.cache.set(key, node)

    // LRU 策略：添加到链表头部
    if (this.strategy === 'lru') {
      this.addToHead(node)
    }

    if (this.enableStats) this.stats.sets++
  }

  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    const node = this.cache.get(key)
    if (!node) return false

    // 从链表移除
    if (this.strategy === 'lru') {
      this.removeNode(node)
    }

    // 从 Map 删除
    this.cache.delete(key)

    if (this.enableStats) this.stats.deletes++
    return true
  }

  /**
   * 检查键是否存在且未过期
   * @param {string} key - 缓存键
   * @returns {boolean}
   */
  has(key) {
    const node = this.cache.get(key)
    if (!node) return false

    if (node.isExpired()) {
      this.delete(key)
      if (this.enableStats) this.stats.expirations++
      return false
    }

    return true
  }

  /**
   * 获取缓存项数量
   * @returns {number}
   */
  size() {
    return this.cache.size
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear()
    this.head = null
    this.tail = null

    if (this.enableStats) {
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        expirations: 0,
      }
    }
  }

  /**
   * 获取所有键
   * @returns {string[]}
   */
  keys() {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取所有值
   * @returns {any[]}
   */
  values() {
    return Array.from(this.cache.values()).map(node => node.value)
  }

  /**
   * 获取所有条目
   * @returns {Array<{key: string, value: any}>}
   */
  entries() {
    return Array.from(this.cache.entries()).map(([key, node]) => ({
      key,
      value: node.value,
    }))
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    if (!this.enableStats) return null

    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: hitRate.toFixed(2) + '%',
      strategy: this.strategy,
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
      evictions: 0,
      expirations: 0,
    }
  }

  /**
   * 批量删除匹配模式的键
   * @param {string} pattern - 匹配模式，支持 * 通配符
   * @returns {number} 删除的数量
   */
  deleteByPattern(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    const keysToDelete = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.delete(key))
    return keysToDelete.length
  }

  /**
   * 启动定期清理
   */
  startCleanup() {
    // 每 60 秒清理一次过期项
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)

    // 允许进程退出时清理
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  /**
   * 清理过期项
   * @returns {number} 清理的数量
   */
  cleanup() {
    let count = 0
    const now = Date.now()

    for (const [key, node] of this.cache.entries()) {
      if (node.isExpired()) {
        this.delete(key)
        count++
        if (this.enableStats) this.stats.expirations++
      }
    }

    return count
  }

  /**
   * 停止清理定时器
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  // ========== LRU 链表操作 ==========

  /**
   * 添加到链表头部
   */
  addToHead(node) {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }

    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  /**
   * 移动到链表头部
   */
  moveToHead(node) {
    this.removeNode(node)
    this.addToHead(node)
  }

  /**
   * 从链表移除
   */
  removeNode(node) {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }

    node.prev = null
    node.next = null
  }

  /**
   * 淘汰缓存项
   */
  evict() {
    let nodeToRemove = null

    switch (this.strategy) {
      case 'lru':
        // 移除链表尾部（最少使用）
        nodeToRemove = this.tail
        break

      case 'lfu':
        // 移除访问次数最少的
        let minAccess = Infinity
        for (const node of this.cache.values()) {
          if (!node.isExpired() && node.accessCount < minAccess) {
            minAccess = node.accessCount
            nodeToRemove = node
          }
        }
        break

      case 'fifo':
      default:
        // 移除最早添加的（链表尾部）
        nodeToRemove = this.tail
        break
    }

    if (nodeToRemove) {
      this.delete(nodeToRemove.key)
      if (this.enableStats) this.stats.evictions++
    }
  }

  /**
   * 预热缓存
   * @param {Array<{key: string, value: any, ttl?: number}>} items - 缓存项数组
   */
  warmup(items) {
    items.forEach(item => {
      this.set(item.key, item.value, { ttl: item.ttl })
    })
  }

  /**
   * 导出缓存数据
   * @returns {Object}
   */
  export() {
    const items = []
    const now = Date.now()

    for (const [key, node] of this.cache.entries()) {
      if (!node.isExpired()) {
        items.push({
          key,
          value: node.value,
          ttl: node.ttl ? node.expiresAt - now : undefined,
          accessCount: node.accessCount,
        })
      }
    }

    return {
      items,
      stats: this.enableStats ? { ...this.stats } : null,
      config: {
        maxSize: this.maxSize,
        strategy: this.strategy,
        defaultTTL: this.defaultTTL,
      },
    }
  }

  /**
   * 从导出数据导入
   * @param {Object} data - 导出的数据
   */
  import(data) {
    if (data.config) {
      this.maxSize = data.config.maxSize
      this.strategy = data.config.strategy
      this.defaultTTL = data.config.defaultTTL
    }

    if (data.items) {
      data.items.forEach(item => {
        this.set(item.key, item.value, { ttl: item.ttl })
      })
    }

    if (data.stats && this.enableStats) {
      this.stats = { ...data.stats }
    }
  }
}

export default MemoryCache
