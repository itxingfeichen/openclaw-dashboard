/**
 * 缓存策略实现
 * 支持 TTL、LRU、LFU 等淘汰策略
 */

/**
 * 缓存策略枚举
 */
export const CacheStrategyType = {
  TTL: 'ttl',       // 基于时间的过期
  LRU: 'lru',       // 最近最少使用
  LFU: 'lfu',       // 最不经常使用
  FIFO: 'fifo',     // 先进先出
  MRU: 'mru',       // 最近最多使用
}

/**
 * 缓存策略基类
 */
export class CacheStrategy {
  constructor(options = {}) {
    this.options = options
  }

  /**
   * 判断是否应该淘汰某个缓存项
   * @param {Object} item - 缓存项信息
   * @returns {boolean}
   */
  shouldEvict(item) {
    return false
  }

  /**
   * 选择要淘汰的缓存项
   * @param {Map} cache - 缓存 Map
   * @returns {Object|null} 要淘汰的项
   */
  selectEvictionCandidate(cache) {
    return null
  }
}

/**
 * TTL 策略 - 基于时间的过期
 */
export class TTLStrategy extends CacheStrategy {
  /**
   * @param {Object} options
   * @param {number} options.defaultTTL - 默认 TTL (毫秒)
   */
  constructor(options = {}) {
    super(options)
    this.defaultTTL = options.defaultTTL || 0
  }

  /**
   * 检查是否过期
   * @param {Object} item - 缓存项
   * @returns {boolean}
   */
  isExpired(item) {
    if (!item.expiresAt) return false
    return Date.now() > item.expiresAt
  }

  /**
   * 计算过期时间
   * @param {number} ttl - TTL (毫秒)
   * @returns {number} 过期时间戳
   */
  calculateExpiry(ttl) {
    const effectiveTTL = ttl !== undefined ? ttl : this.defaultTTL
    if (effectiveTTL <= 0) return null
    return Date.now() + effectiveTTL
  }

  /**
   * 获取所有过期项
   * @param {Map} cache - 缓存 Map
   * @returns {Array} 过期项键数组
   */
  getExpiredItems(cache) {
    const expired = []
    const now = Date.now()

    for (const [key, item] of cache.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        expired.push(key)
      }
    }

    return expired
  }
}

/**
 * LRU 策略 - 最近最少使用
 * 使用双向链表实现 O(1) 的访问和更新
 */
export class LRUStrategy extends CacheStrategy {
  constructor(options = {}) {
    super(options)
    this.maxSize = options.maxSize || 1000
  }

  /**
   * 创建链表节点
   */
  createNode(key, value) {
    return {
      key,
      value,
      prev: null,
      next: null,
      lastAccessed: Date.now(),
    }
  }

  /**
   * 选择要淘汰的项（链表尾部）
   * @param {Object} lruCache - LRU 缓存对象
   * @returns {Object|null}
   */
  selectEvictionCandidate(lruCache) {
    return lruCache.tail || null
  }

  /**
   * 访问节点（移动到头部）
   * @param {Object} lruCache - LRU 缓存对象
   * @param {Object} node - 节点
   */
  accessNode(lruCache, node) {
    // 如果已在头部，无需移动
    if (lruCache.head === node) return

    // 从原位置移除
    if (node.prev) {
      node.prev.next = node.next
    }
    if (node.next) {
      node.next.prev = node.prev
    }
    if (lruCache.tail === node) {
      lruCache.tail = node.prev
    }

    // 添加到头部
    node.prev = null
    node.next = lruCache.head
    if (lruCache.head) {
      lruCache.head.prev = node
    }
    lruCache.head = node

    if (!lruCache.tail) {
      lruCache.tail = node
    }

    node.lastAccessed = Date.now()
  }

  /**
   * 添加节点到头部
   * @param {Object} lruCache - LRU 缓存对象
   * @param {Object} node - 节点
   */
  addNodeToHead(lruCache, node) {
    node.prev = null
    node.next = lruCache.head

    if (lruCache.head) {
      lruCache.head.prev = node
    }

    lruCache.head = node

    if (!lruCache.tail) {
      lruCache.tail = node
    }
  }

  /**
   * 移除节点
   * @param {Object} lruCache - LRU 缓存对象
   * @param {Object} node - 节点
   */
  removeNode(lruCache, node) {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      lruCache.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      lruCache.tail = node.prev
    }

    node.prev = null
    node.next = null
  }
}

/**
 * LFU 策略 - 最不经常使用
 * 使用频率计数和最小堆实现
 */
export class LFUStrategy extends CacheStrategy {
  constructor(options = {}) {
    super(options)
    this.maxSize = options.maxSize || 1000
  }

  /**
   * 创建 LFU 节点
   */
  createNode(key, value) {
    return {
      key,
      value,
      frequency: 0,
      lastAccessed: Date.now(),
      lastIncremented: 0,
    }
  }

  /**
   * 增加访问频率
   * @param {Object} node - LFU 节点
   * @param {boolean} timeDecay - 是否启用时间衰减
   */
  incrementFrequency(node, timeDecay = false) {
    const now = Date.now()

    // 时间衰减：如果距离上次增加频率超过一定时间，重置频率
    if (timeDecay && node.lastIncremented) {
      const timeSinceLastIncrement = now - node.lastIncremented
      const decayThreshold = 3600000 // 1 小时

      if (timeSinceLastIncrement > decayThreshold) {
        node.frequency = 1
      } else {
        node.frequency++
      }
    } else {
      node.frequency++
    }

    node.lastAccessed = now
    node.lastIncremented = now
  }

  /**
   * 选择要淘汰的项（频率最低）
   * @param {Map} cache - 缓存 Map
   * @returns {Object|null}
   */
  selectEvictionCandidate(cache) {
    let minFreq = Infinity
    let candidate = null
    let oldestTime = Infinity

    for (const [key, node] of cache.entries()) {
      // 优先选择频率最低的
      if (node.frequency < minFreq) {
        minFreq = node.frequency
        candidate = node
        oldestTime = node.lastAccessed
      } else if (node.frequency === minFreq) {
        // 频率相同时，选择最久未访问的
        if (node.lastAccessed < oldestTime) {
          candidate = node
          oldestTime = node.lastAccessed
        }
      }
    }

    return candidate
  }

  /**
   * 获取频率分布统计
   * @param {Map} cache - 缓存 Map
   * @returns {Object}
   */
  getFrequencyDistribution(cache) {
    const distribution = {}

    for (const [key, node] of cache.entries()) {
      const freq = node.frequency
      distribution[freq] = (distribution[freq] || 0) + 1
    }

    return distribution
  }
}

/**
 * FIFO 策略 - 先进先出
 */
export class FIFOStrategy extends CacheStrategy {
  constructor(options = {}) {
    super(options)
    this.maxSize = options.maxSize || 1000
    this.insertOrder = []
  }

  /**
   * 记录插入顺序
   * @param {string} key - 缓存键
   */
  recordInsert(key) {
    this.insertOrder.push(key)
  }

  /**
   * 选择要淘汰的项（最早插入）
   * @param {Map} cache - 缓存 Map
   * @returns {Object|null}
   */
  selectEvictionCandidate(cache) {
    while (this.insertOrder.length > 0) {
      const key = this.insertOrder.shift()
      if (cache.has(key)) {
        return cache.get(key)
      }
    }
    return null
  }

  /**
   * 移除键的插入记录
   * @param {string} key - 缓存键
   */
  removeInsertRecord(key) {
    const index = this.insertOrder.indexOf(key)
    if (index > -1) {
      this.insertOrder.splice(index, 1)
    }
  }

  /**
   * 清空插入记录
   */
  clear() {
    this.insertOrder = []
  }
}

/**
 * MRU 策略 - 最近最多使用
 * 淘汰最近访问的项
 */
export class MRUStrategy extends CacheStrategy {
  constructor(options = {}) {
    super(options)
    this.maxSize = options.maxSize || 1000
  }

  /**
   * 选择要淘汰的项（最近访问）
   * @param {Map} cache - 缓存 Map
   * @returns {Object|null}
   */
  selectEvictionCandidate(cache) {
    let maxTime = 0
    let candidate = null

    for (const [key, node] of cache.entries()) {
      const accessTime = node.lastAccessed || 0
      if (accessTime > maxTime) {
        maxTime = accessTime
        candidate = node
      }
    }

    return candidate
  }
}

/**
 * 策略工厂
 * 根据配置创建相应的策略实例
 */
export class StrategyFactory {
  /**
   * 创建策略实例
   * @param {string} type - 策略类型
   * @param {Object} options - 策略配置
   * @returns {CacheStrategy}
   */
  static create(type, options = {}) {
    switch (type) {
      case CacheStrategyType.TTL:
        return new TTLStrategy(options)
      case CacheStrategyType.LRU:
        return new LRUStrategy(options)
      case CacheStrategyType.LFU:
        return new LFUStrategy(options)
      case CacheStrategyType.FIFO:
        return new FIFOStrategy(options)
      case CacheStrategyType.MRU:
        return new MRUStrategy(options)
      default:
        return new TTLStrategy(options)
    }
  }

  /**
   * 获取所有可用策略
   * @returns {string[]}
   */
  static getAvailableStrategies() {
    return Object.values(CacheStrategyType)
  }
}

export default {
  CacheStrategy,
  CacheStrategyType,
  TTLStrategy,
  LRUStrategy,
  LFUStrategy,
  FIFOStrategy,
  MRUStrategy,
  StrategyFactory,
}
