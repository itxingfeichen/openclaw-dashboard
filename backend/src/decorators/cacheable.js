/**
 * 缓存装饰器
 * 自动缓存函数结果，支持自定义 key 生成、条件缓存、缓存失效
 */

import { CacheService } from '../cache/cache-service.js'

/**
 * 缓存装饰器配置
 */
export class CacheableConfig {
  constructor(options = {}) {
    // 缓存键前缀
    this.prefix = options.prefix || 'cacheable'

    // 缓存键生成器
    this.keyGenerator = options.keyGenerator || null

    // TTL (毫秒)
    this.ttl = options.ttl || 60000

    // 条件函数：决定是否缓存
    this.condition = options.condition || null

    // 缓存服务实例
    this.cacheService = options.cacheService || null

    // 是否缓存错误
    this.cacheErrors = options.cacheErrors || false

    // 序列化函数
    this.serialize = options.serialize || JSON.stringify

    // 反序列化函数
    this.deserialize = options.deserialize || JSON.parse
  }

  /**
   * 生成缓存键
   * @param {string} methodName - 方法名
   * @param {Array} args - 参数数组
   * @param {Object} context - 上下文 (this)
   * @returns {string}
   */
  generateKey(methodName, args, context) {
    if (this.keyGenerator) {
      return this.keyGenerator(methodName, args, context)
    }

    // 默认 key 生成：prefix:methodName:arg1:arg2:...
    const serializedArgs = args
      .map(arg => {
        if (arg === null || arg === undefined) return ''
        if (typeof arg === 'object') {
          try {
            return this.serialize(arg)
          } catch {
            return String(arg)
          }
        }
        return String(arg)
      })
      .join(':')

    return `${this.prefix}:${methodName}:${serializedArgs}`
  }

  /**
   * 检查是否应该缓存
   * @param {any} result - 函数返回值
   * @param {Array} args - 参数数组
   * @param {Object} context - 上下文
   * @returns {boolean}
   */
  shouldCache(result, args, context) {
    // 不缓存错误（除非配置了 cacheErrors）
    if (result instanceof Error && !this.cacheErrors) {
      return false
    }

    // 不缓存 undefined
    if (result === undefined) {
      return false
    }

    // 检查条件函数
    if (this.condition) {
      return this.condition(result, args, context)
    }

    return true
  }
}

/**
 * 缓存装饰器类
 */
export class Cacheable {
  /**
   * @param {CacheableConfig|Object} config - 缓存配置
   */
  constructor(config = {}) {
    this.config = config instanceof CacheableConfig ? config : new CacheableConfig(config)
    this.cacheService = this.config.cacheService || new CacheService()
  }

  /**
   * 方法装饰器
   * 自动缓存方法返回值
   *
   * @param {Object} target - 类的原型
   * @param {string} propertyKey - 方法名
   * @param {Object} descriptor - 属性描述符
   * @returns {Object} 修改后的描述符
   *
   * @example
   * class UserService {
   *   @cacheable({ ttl: 5000 })
   *   async getUser(id) {
   *     return db.query('SELECT * FROM users WHERE id = ?', [id])
   *   }
   * }
   */
  decorate(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value
    const config = this.config
    const cacheService = this.cacheService

    // 处理异步方法
    if (originalMethod.constructor.name === 'AsyncFunction') {
      descriptor.value = async function (...args) {
        const cacheKey = config.generateKey(propertyKey, args, this)

        // 尝试从缓存获取
        const cached = await cacheService.get(cacheKey)
        if (cached !== undefined) {
          return cached
        }

        // 执行原方法
        const result = await originalMethod.apply(this, args)

        // 检查是否应该缓存
        if (config.shouldCache(result, args, this)) {
          await cacheService.set(cacheKey, result, { ttl: config.ttl })
        }

        return result
      }
    } else {
      // 处理同步方法
      descriptor.value = function (...args) {
        const cacheKey = config.generateKey(propertyKey, args, this)

        // 尝试从缓存获取
        const cached = cacheService.get(cacheKey)
        if (cached !== undefined) {
          return cached
        }

        // 执行原方法
        const result = originalMethod.apply(this, args)

        // 检查是否应该缓存
        if (config.shouldCache(result, args, this)) {
          cacheService.set(cacheKey, result, { ttl: config.ttl })
        }

        return result
      }
    }

    // 添加缓存失效方法
    const invalidateMethodName = `invalidate${propertyKey.charAt(0).toUpperCase()}${propertyKey.slice(1)}Cache`
    target[invalidateMethodName] = function (...args) {
      const cacheKey = config.generateKey(propertyKey, args, this)
      return cacheService.delete(cacheKey)
    }

    return descriptor
  }

  /**
   * 函数装饰器（用于普通函数）
   * @param {Function} fn - 要装饰的函数
   * @returns {Function} 包装后的函数
   */
  decorateFunction(fn) {
    const config = this.config
    const cacheService = this.cacheService
    const functionName = fn.name || 'anonymous'

    if (fn.constructor.name === 'AsyncFunction') {
      return async (...args) => {
        const cacheKey = config.generateKey(functionName, args, null)

        const cached = await cacheService.get(cacheKey)
        if (cached !== undefined) {
          return cached
        }

        const result = await fn(...args)

        if (config.shouldCache(result, args, null)) {
          await cacheService.set(cacheKey, result, { ttl: config.ttl })
        }

        return result
      }
    } else {
      return (...args) => {
        const cacheKey = config.generateKey(functionName, args, null)

        const cached = cacheService.get(cacheKey)
        if (cached !== undefined) {
          return cached
        }

        const result = fn(...args)

        if (config.shouldCache(result, args, null)) {
          cacheService.set(cacheKey, result, { ttl: config.ttl })
        }

        return result
      }
    }
  }

  /**
   * 创建带自定义配置的装饰器实例
   * @param {Object} options - 配置选项
   * @returns {Cacheable}
   */
  withConfig(options) {
    return new Cacheable({ ...this.config, ...options })
  }
}

/**
 * 缓存失效装饰器
 * 用于标记应该使其他缓存失效的方法
 */
export class CacheInvalidate {
  /**
   * @param {Array<string>} cacheKeys - 要失效的缓存键模式
   * @param {CacheService} cacheService - 缓存服务
   */
  constructor(cacheKeys, cacheService = null) {
    this.cacheKeys = Array.isArray(cacheKeys) ? cacheKeys : [cacheKeys]
    this.cacheService = cacheService || new CacheService()
  }

  /**
   * 方法装饰器
   * @param {Object} target - 类的原型
   * @param {string} propertyKey - 方法名
   * @param {Object} descriptor - 属性描述符
   */
  decorate(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value
    const cacheKeys = this.cacheKeys
    const cacheService = this.cacheService

    if (originalMethod.constructor.name === 'AsyncFunction') {
      descriptor.value = async function (...args) {
        // 执行原方法
        const result = await originalMethod.apply(this, args)

        // 失效缓存
        for (const pattern of cacheKeys) {
          const key = typeof pattern === 'function' ? pattern.call(this, args) : pattern
          await cacheService.deleteByPattern(key)
        }

        return result
      }
    } else {
      descriptor.value = function (...args) {
        const result = originalMethod.apply(this, args)

        for (const pattern of cacheKeys) {
          const key = typeof pattern === 'function' ? pattern.call(this, args) : pattern
          cacheService.deleteByPattern(key)
        }

        return result
      }
    }

    return descriptor
  }
}

/**
 * 条件缓存装饰器
 * 根据条件决定是否使用缓存
 */
export class ConditionalCache extends Cacheable {
  /**
   * @param {Function} condition - 条件函数 (result, args, context) => boolean
   * @param {Object} options - 其他配置
   */
  constructor(condition, options = {}) {
    super({ ...options, condition })
  }
}

/**
 * 创建缓存装饰器的工厂函数
 * @param {Object} options - 配置选项
 * @returns {Function} 装饰器函数
 *
 * @example
 * const cacheable = createCacheable({ ttl: 5000 })
 *
 * class UserService {
 *   @cacheable
 *   async getUser(id) { ... }
 * }
 */
export function createCacheable(options = {}) {
  const cacheable = new Cacheable(options)

  // 返回装饰器函数
  return function (target, propertyKey, descriptor) {
    if (descriptor) {
      // 作为方法装饰器使用
      return cacheable.decorate(target, propertyKey, descriptor)
    } else {
      // 作为函数装饰器使用
      return function (fn) {
        return cacheable.decorateFunction(fn)
      }
    }
  }
}

/**
 * 创建缓存失效装饰器的工厂函数
 * @param {Array<string>} cacheKeys - 要失效的缓存键
 * @returns {Function} 装饰器函数
 */
export function createCacheInvalidate(cacheKeys) {
  const invalidator = new CacheInvalidate(cacheKeys)

  return function (target, propertyKey, descriptor) {
    return invalidator.decorate(target, propertyKey, descriptor)
  }
}

/**
 * 便捷装饰器创建函数
 * @param {Object} options - 配置选项
 * @returns {Function}
 */
export function cacheable(options = {}) {
  const cacheable = new Cacheable(options)

  return function (target, propertyKey, descriptor) {
    if (descriptor) {
      return cacheable.decorate(target, propertyKey, descriptor)
    } else {
      return function (fn) {
        return cacheable.decorateFunction(fn)
      }
    }
  }
}

/**
 * 便捷缓存失效装饰器
 * @param  {...string} cacheKeys - 要失效的缓存键
 * @returns {Function}
 */
export function cacheInvalidate(...cacheKeys) {
  const invalidator = new CacheInvalidate(cacheKeys)

  return function (target, propertyKey, descriptor) {
    return invalidator.decorate(target, propertyKey, descriptor)
  }
}

export default {
  Cacheable,
  CacheableConfig,
  CacheInvalidate,
  ConditionalCache,
  createCacheable,
  createCacheInvalidate,
  cacheable,
  cacheInvalidate,
}
