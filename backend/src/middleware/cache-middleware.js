/**
 * HTTP 缓存中间件
 * 支持 ETag、Last-Modified、Cache-Control 等 HTTP 缓存头
 */

import crypto from 'crypto'
import { CacheService } from '../cache/cache-service.js'

/**
 * 缓存中间件配置
 */
export class CacheMiddlewareConfig {
  constructor(options = {}) {
    // 缓存服务实例
    this.cacheService = options.cacheService || new CacheService()

    // 默认 Cache-Control 值
    this.cacheControl = options.cacheControl || 'public, max-age=300'

    // 是否启用 ETag
    this.enableETag = options.enableETag !== false

    // 是否启用 Last-Modified
    this.enableLastModified = options.enableLastModified !== false

    // 缓存键前缀
    this.keyPrefix = options.keyPrefix || 'http:'

    // 是否缓存条件请求
    this.cacheConditionalRequests = options.cacheConditionalRequests !== false

    // 排除的路径模式
    this.excludePatterns = options.excludePatterns || []

    // 包含的路径模式（白名单）
    this.includePatterns = options.includePatterns || null

    // 自定义缓存控制函数
    this.getCacheControl = options.getCacheControl || null

    // 自定义缓存键生成函数
    this.generateCacheKey = options.generateCacheKey || null
  }

  /**
   * 检查路径是否应该被缓存
   * @param {string} path - 请求路径
   * @returns {boolean}
   */
  shouldCache(path) {
    // 检查排除模式
    for (const pattern of this.excludePatterns) {
      if (pattern instanceof RegExp) {
        if (pattern.test(path)) return false
      } else if (path.startsWith(pattern)) {
        return false
      }
    }

    // 检查包含模式（白名单）
    if (this.includePatterns) {
      for (const pattern of this.includePatterns) {
        if (pattern instanceof RegExp) {
          if (pattern.test(path)) return true
        } else if (path.startsWith(pattern)) {
          return true
        }
      }
      return false
    }

    return true
  }

  /**
   * 生成缓存键
   * @param {Object} req - 请求对象
   * @returns {string}
   */
  generateCacheKey(req) {
    if (this.generateCacheKey) {
      return this.generateCacheKey(req)
    }

    // 默认：method:url:query
    const queryString = req.url.split('?')[1] || ''
    return `${this.keyPrefix}:${req.method}:${req.url}`
  }

  /**
   * 获取 Cache-Control 值
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {string}
   */
  getCacheControlValue(req, res) {
    if (this.getCacheControl) {
      return this.getCacheControl(req, res)
    }
    return this.cacheControl
  }
}

/**
 * HTTP 缓存中间件
 */
export class CacheMiddleware {
  /**
   * @param {CacheMiddlewareConfig|Object} config - 配置
   */
  constructor(config = {}) {
    this.config = config instanceof CacheMiddlewareConfig ? config : new CacheMiddlewareConfig(config)
    this.cacheService = this.config.cacheService
  }

  /**
   * 中间件函数
   * @returns {Function} Express 中间件
   */
  middleware() {
    const config = this.config
    const cacheService = this.cacheService

    return async (req, res, next) => {
      // 只处理 GET 和 HEAD 请求
      if (!['GET', 'HEAD'].includes(req.method)) {
        return next()
      }

      // 检查是否应该缓存
      if (!config.shouldCache(req.path)) {
        return next()
      }

      // 生成缓存键
      const cacheKey = config.generateCacheKey(req)

      // 检查条件请求
      if (config.cacheConditionalRequests) {
        const ifNoneMatch = req.headers['if-none-match']
        const ifModifiedSince = req.headers['if-modified-since']

        // 尝试从缓存获取元数据
        const cachedMeta = await cacheService.get(`${cacheKey}:meta`)

        if (cachedMeta) {
          // 检查 ETag
          if (ifNoneMatch && cachedMeta.etag) {
            if (ifNoneMatch === cachedMeta.etag || ifNoneMatch === `W/"${cachedMeta.etag}"`) {
              res.status(304).end()
              return
            }
          }

          // 检查 Last-Modified
          if (ifModifiedSince && cachedMeta.lastModified) {
            const reqTime = new Date(ifModifiedSince).getTime()
            const lastModTime = new Date(cachedMeta.lastModified).getTime()

            if (reqTime >= lastModTime) {
              res.status(304).end()
              return
            }
          }
        }
      }

      // 包装 res.json 和 res.send 方法
      const originalJson = res.json.bind(res)
      const originalSend = res.send.bind(res)

      let responseBody = null
      let responseStatusCode = 200

      res.json = (body) => {
        responseBody = body
        return originalJson(body)
      }

      res.send = (body) => {
        responseBody = body
        return originalSend(body)
      }

      // 包装 res.status
      const originalStatus = res.status.bind(res)
      res.status = (code) => {
        responseStatusCode = code
        return originalStatus(code)
      }

      // 监听响应完成
      res.on('finish', async () => {
        // 只缓存成功的响应
        if (responseStatusCode >= 200 && responseStatusCode < 300) {
          await this.cacheResponse(cacheKey, req, res, responseBody)
        }
      })

      next()
    }
  }

  /**
   * 缓存响应
   * @param {string} cacheKey - 缓存键
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {any} body - 响应体
   */
  async cacheResponse(cacheKey, req, res, body) {
    const config = this.config

    if (!body) return

    // 准备缓存的响应数据
    const cachedResponse = {
      body,
      statusCode: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
      },
    }

    // 生成 ETag
    let etag = null
    if (config.enableETag && body) {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
      etag = crypto.createHash('md5').update(bodyStr).digest('hex')
      cachedResponse.headers.etag = etag
    }

    // 设置 Last-Modified
    let lastModified = null
    if (config.enableLastModified) {
      lastModified = new Date().toUTCString()
      cachedResponse.headers['last-modified'] = lastModified
    }

    // 设置 Cache-Control
    const cacheControl = config.getCacheControlValue(req, res)
    cachedResponse.headers['cache-control'] = cacheControl

    // 缓存响应体
    await cacheService.set(cacheKey, cachedResponse)

    // 缓存元数据（用于条件请求）
    const meta = {
      etag,
      lastModified,
      cachedAt: new Date().toISOString(),
    }
    await cacheService.set(`${cacheKey}:meta`, meta)

    // 设置响应头
    if (etag) {
      res.setHeader('etag', etag)
      res.setHeader('etag', `W/"${etag}"`) // 弱 ETag
    }
    if (lastModified) {
      res.setHeader('last-modified', lastModified)
    }
    res.setHeader('cache-control', cacheControl)
  }

  /**
   * 手动缓存响应
   * @param {string} key - 缓存键
   * @param {any} body - 响应体
   * @param {Object} options - 可选配置
   */
  async cache(key, body, options = {}) {
    const cacheKey = `${this.config.keyPrefix}:${key}`
    const ttl = options.ttl || 300000 // 默认 5 分钟

    const cachedResponse = {
      body,
      statusCode: options.statusCode || 200,
      headers: {
        'content-type': options.contentType || 'application/json',
      },
    }

    // 生成 ETag
    if (this.config.enableETag && body) {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
      const etag = crypto.createHash('md5').update(bodyStr).digest('hex')
      cachedResponse.headers.etag = etag
      cachedResponse.headers['etag'] = `W/"${etag}"`
    }

    // 设置 Last-Modified
    if (this.config.enableLastModified) {
      const lastModified = new Date().toUTCString()
      cachedResponse.headers['last-modified'] = lastModified
    }

    await this.cacheService.set(cacheKey, cachedResponse, { ttl })

    // 缓存元数据
    await this.cacheService.set(
      `${cacheKey}:meta`,
      {
        etag: cachedResponse.headers.etag,
        lastModified: cachedResponse.headers['last-modified'],
        cachedAt: new Date().toISOString(),
      },
      { ttl }
    )
  }

  /**
   * 获取缓存的响应
   * @param {string} key - 缓存键
   * @returns {Promise<Object>}
   */
  async getCached(key) {
    const cacheKey = `${this.config.keyPrefix}:${key}`
    return await this.cacheService.get(cacheKey)
  }

  /**
   * 失效缓存
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async invalidate(key) {
    const cacheKey = `${this.config.keyPrefix}:${key}`
    await this.cacheService.delete(cacheKey)
    await this.cacheService.delete(`${cacheKey}:meta`)
    return true
  }

  /**
   * 批量失效缓存
   * @param {string} pattern - 匹配模式
   * @returns {Promise<number>}
   */
  async invalidateByPattern(pattern) {
    const searchPattern = `${this.config.keyPrefix}:${pattern}`
    return await this.cacheService.deleteByPattern(searchPattern)
  }

  /**
   * 清理所有 HTTP 缓存
   */
  async clear() {
    return await this.cacheService.deleteByPattern(`${this.config.keyPrefix}:*`)
  }
}

/**
 * 创建缓存中间件的工厂函数
 * @param {Object} options - 配置选项
 * @returns {Function} Express 中间件
 */
export function createCacheMiddleware(options = {}) {
  const middleware = new CacheMiddleware(options)
  return middleware.middleware()
}

/**
 * 条件请求中间件
 * 仅处理条件请求，不缓存响应
 * @param {Object} options - 配置选项
 * @returns {Function} Express 中间件
 */
export function conditionalRequest(options = {}) {
  const cacheService = options.cacheService || new CacheService()
  const keyPrefix = options.keyPrefix || 'http:'

  return async (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      return next()
    }

    const ifNoneMatch = req.headers['if-none-match']
    const ifModifiedSince = req.headers['if-modified-since']

    if (!ifNoneMatch && !ifModifiedSince) {
      return next()
    }

    // 生成缓存键
    const queryString = req.url.split('?')[1] || ''
    const cacheKey = `${keyPrefix}:${req.method}:${req.url}`

    // 获取缓存元数据
    const cachedMeta = await cacheService.get(`${cacheKey}:meta`)

    if (!cachedMeta) {
      return next()
    }

    // 检查 ETag
    if (ifNoneMatch && cachedMeta.etag) {
      if (ifNoneMatch === cachedMeta.etag || ifNoneMatch === `W/"${cachedMeta.etag}"`) {
        res.status(304).end()
        return
      }
    }

    // 检查 Last-Modified
    if (ifModifiedSince && cachedMeta.lastModified) {
      const reqTime = new Date(ifModifiedSince).getTime()
      const lastModTime = new Date(cachedMeta.lastModified).getTime()

      if (reqTime >= lastModTime) {
        res.status(304).end()
        return
      }
    }

    next()
  }
}

/**
 * 静态资源缓存中间件
 * 为静态文件设置合适的缓存头
 * @param {Object} options - 配置选项
 * @returns {Function} Express 中间件
 */
export function staticCache(options = {}) {
  const maxAge = options.maxAge || 31536000 // 默认 1 年
  const immutable = options.immutable !== false

  return (req, res, next) => {
    let cacheControl = `public, max-age=${maxAge}`

    if (immutable) {
      cacheControl += ', immutable'
    }

    res.setHeader('cache-control', cacheControl)
    next()
  }
}

export default {
  CacheMiddleware,
  CacheMiddlewareConfig,
  createCacheMiddleware,
  conditionalRequest,
  staticCache,
}
