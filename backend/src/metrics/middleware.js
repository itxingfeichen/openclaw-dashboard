/**
 * Metrics Collection Middleware
 * Middleware for collecting HTTP request metrics
 * @module metrics/middleware
 */

import { metrics, collectors } from './metrics.js'

/**
 * Create metrics collection middleware
 * @param {Object} options - Middleware options
 * @param {boolean} options.trackResponseTime - Track response time (default: true)
 * @param {boolean} options.trackInFlight - Track in-flight requests (default: true)
 * @param {boolean} options.logSlowRequests - Log slow requests (default: true)
 * @param {number} options.slowRequestThreshold - Slow request threshold in ms (default: 1000)
 * @returns {Function} Express middleware function
 */
export function createMetricsMiddleware(options = {}) {
  const {
    trackResponseTime = true,
    trackInFlight = true,
    logSlowRequests = true,
    slowRequestThreshold = 1000,
  } = options

  return function metricsMiddleware(req, res, next) {
    const startTime = Date.now()
    const route = req.route?.path || req.path
    const method = req.method

    // Track in-flight requests
    if (trackInFlight) {
      metrics.httpRequestsInFlight.labels({ method }).inc()
    }

    // Track request start
    collectors.requestCounter.increment(route, method)

    // Listen for response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime
      const statusCode = res.statusCode

      // Decrement in-flight requests
      if (trackInFlight) {
        metrics.httpRequestsInFlight.labels({ method }).dec()
      }

      // Record total requests
      metrics.httpRequestTotal
        .labels({ method, route, status_code: statusCode })
        .inc()

      // Record response time
      if (trackResponseTime) {
        metrics.httpRequestDuration
          .labels({ method, route, status_code: statusCode })
          .observe(duration / 1000) // Convert to seconds

        metrics.apiResponseTime
          .labels({ endpoint: route, method })
          .observe(duration)

        collectors.responseTimeCollector.record(duration)
      }

      // Log slow requests
      if (logSlowRequests && duration >= slowRequestThreshold) {
        console.warn('Slow request detected', {
          method,
          route,
          statusCode,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        })

        collectors.slowQueryCollector.record(route, duration, {
          method,
          statusCode,
        })
      }
    })

    // Listen for errors
    res.on('error', (error) => {
      metrics.errorTotal
        .labels({ type: 'http', severity: 'error' })
        .inc()

      console.error('Request error in metrics middleware', {
        method,
        route,
        error: error.message,
      })
    })

    next()
  }
}

/**
 * Create database metrics middleware
 * @param {Object} db - Database instance with query tracking
 * @returns {Function} Function to wrap database queries
 */
export function createDBMetricsMiddleware(db) {
  return function trackDBQuery(queryType, table, duration) {
    metrics.dbQueryDuration
      .labels({ query_type: queryType, table })
      .observe(duration)

    metrics.dbQueryTotal
      .labels({ query_type: queryType, table })
      .inc()

    // Track slow queries
    if (duration > 100) {
      collectors.slowQueryCollector.record(`${queryType}:${table}`, duration, {
        type: 'database',
      })
    }
  }
}

/**
 * Create cache metrics middleware
 * @returns {Object} Functions to track cache operations
 */
export function createCacheMetricsMiddleware() {
  return {
    trackHit(cacheType = 'default') {
      metrics.cacheHits.labels({ cache_type: cacheType }).inc()
    },

    trackMiss(cacheType = 'default') {
      metrics.cacheMisses.labels({ cache_type: cacheType }).inc()
    },

    updateSize(size, cacheType = 'default') {
      metrics.cacheSize.labels({ cache_type: cacheType }).set(size)
    },
  }
}

/**
 * Create error tracking middleware
 * @returns {Function} Express error handling middleware
 */
export function createErrorMetricsMiddleware() {
  return function errorMetricsMiddleware(error, req, res, next) {
    const severity = error.statusCode >= 500 ? 'critical' : 'warning'

    metrics.errorTotal
      .labels({ type: error.type || 'application', severity })
      .inc()

    next(error)
  }
}

export default {
  createMetricsMiddleware,
  createDBMetricsMiddleware,
  createCacheMetricsMiddleware,
  createErrorMetricsMiddleware,
}
