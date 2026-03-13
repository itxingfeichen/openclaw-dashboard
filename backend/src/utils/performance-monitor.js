/**
 * Performance Monitoring Utility
 * Provides API response time statistics, slow query logging, and memory leak detection
 * @module utils/performance-monitor
 */

import os from 'os'
import { EventEmitter } from 'events'

class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super()

    this.options = {
      slowQueryThreshold: options.slowQueryThreshold || 100, // ms
      memoryCheckInterval: options.memoryCheckInterval || 30000, // 30s
      maxSamples: options.maxSamples || 1000,
      enableMemoryLeakDetection: options.enableMemoryLeakDetection !== false,
    }

    this.responseTimes = new Map() // endpoint -> [times]
    this.slowQueries = []
    this.memorySamples = []
    this.startTime = Date.now()
    this.requestCount = 0
    this.errorCount = 0

    // Start memory monitoring if enabled
    if (this.options.enableMemoryLeakDetection) {
      this.startMemoryMonitoring()
    }
  }

  /**
   * Record API response time
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} duration - Response time in ms
   */
  recordResponseTime(endpoint, method, duration) {
    const key = `${method}:${endpoint}`

    if (!this.responseTimes.has(key)) {
      this.responseTimes.set(key, [])
    }

    const times = this.responseTimes.get(key)
    times.push({ duration, timestamp: Date.now() })

    // Keep only recent samples
    if (times.length > this.options.maxSamples) {
      times.shift()
    }

    this.requestCount++

    // Emit event for slow responses
    if (duration > this.options.slowQueryThreshold) {
      this.emit('slowResponse', {
        endpoint,
        method,
        duration,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Record slow query
   * @param {string} query - Query identifier
   * @param {number} duration - Query duration in ms
   * @param {Object} metadata - Additional metadata
   */
  recordSlowQuery(query, duration, metadata = {}) {
    const slowQuery = {
      query,
      duration,
      timestamp: Date.now(),
      ...metadata,
    }

    this.slowQueries.push(slowQuery)

    // Keep only recent slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift()
    }

    this.emit('slowQuery', slowQuery)
  }

  /**
   * Record error
   * @param {string} type - Error type
   * @param {Error} error - Error object
   */
  recordError(type, error) {
    this.errorCount++
    this.emit('error', {
      type,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Get response time statistics for an endpoint
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @returns {Object} Statistics object
   */
  getResponseTimeStats(endpoint, method) {
    const key = `${method}:${endpoint}`
    const times = this.responseTimes.get(key)

    if (!times || times.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      }
    }

    const durations = times.map((t) => t.duration).sort((a, b) => a - b)
    const sum = durations.reduce((a, b) => a + b, 0)
    const count = durations.length

    return {
      count,
      min: durations[0],
      max: durations[durations[count - 1]],
      avg: sum / count,
      p50: durations[Math.floor(count * 0.5)],
      p95: durations[Math.floor(count * 0.95)],
      p99: durations[Math.floor(count * 0.99)],
    }
  }

  /**
   * Get all response time statistics
   * @returns {Object} All endpoint statistics
   */
  getAllResponseTimeStats() {
    const stats = {}

    for (const [key] of this.responseTimes) {
      const [method, endpoint] = key.split(':')
      stats[key] = this.getResponseTimeStats(endpoint, method)
    }

    return stats
  }

  /**
   * Get slow queries
   * @param {number} limit - Maximum number of queries to return
   * @returns {Array} Array of slow queries
   */
  getSlowQueries(limit = 50) {
    return this.slowQueries.slice(-limit)
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    this.memoryInterval = setInterval(() => {
      const usage = process.memoryUsage()
      const sample = {
        timestamp: Date.now(),
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
      }

      this.memorySamples.push(sample)

      // Keep only recent samples (last 10 minutes)
      const maxSamples = (10 * 60 * 1000) / this.options.memoryCheckInterval
      if (this.memorySamples.length > maxSamples) {
        this.memorySamples.shift()
      }

      // Check for memory leaks
      this.detectMemoryLeak(sample)
    }, this.options.memoryCheckInterval)
  }

  /**
   * Detect potential memory leaks
   * @param {Object} currentSample - Current memory sample
   */
  detectMemoryLeak(currentSample) {
    if (this.memorySamples.length < 5) {
      return
    }

    // Check if memory is consistently growing
    const recentSamples = this.memorySamples.slice(-5)
    const heapUsedValues = recentSamples.map((s) => s.heapUsed)

    let consistentlyGrowing = true
    for (let i = 1; i < heapUsedValues.length; i++) {
      if (heapUsedValues[i] <= heapUsedValues[i - 1]) {
        consistentlyGrowing = false
        break
      }
    }

    if (consistentlyGrowing) {
      const growthRate =
        (heapUsedValues[heapUsedValues.length - 1] - heapUsedValues[0]) /
        heapUsedValues[0]

      if (growthRate > 0.1) {
        // More than 10% growth
        this.emit('memoryLeakWarning', {
          growthRate: growthRate * 100,
          currentHeap: currentSample.heapUsed,
          samples: recentSamples.length,
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  /**
   * Get memory statistics
   * @returns {Object} Memory statistics
   */
  getMemoryStats() {
    if (this.memorySamples.length === 0) {
      return {
        current: process.memoryUsage(),
        trend: 'insufficient_data',
      }
    }

    const recent = this.memorySamples.slice(-10)
    const heapUsedValues = recent.map((s) => s.heapUsed)
    const avgHeap =
      heapUsedValues.reduce((a, b) => a + b, 0) / heapUsedValues.length

    // Calculate trend
    let trend = 'stable'
    if (heapUsedValues.length >= 5) {
      const firstHalf = heapUsedValues.slice(0, Math.floor(heapUsedValues.length / 2))
      const secondHalf = heapUsedValues.slice(Math.floor(heapUsedValues.length / 2))

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

      if (secondAvg > firstAvg * 1.05) {
        trend = 'increasing'
      } else if (secondAvg < firstAvg * 0.95) {
        trend = 'decreasing'
      }
    }

    return {
      current: process.memoryUsage(),
      average: avgHeap,
      trend,
      samples: this.memorySamples.length,
    }
  }

  /**
   * Get system statistics
   * @returns {Object} System statistics
   */
  getSystemStats() {
    return {
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      loadAvg: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
    }
  }

  /**
   * Get comprehensive performance report
   * @returns {Object} Performance report
   */
  getReport() {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
      },
      responseTimes: this.getAllResponseTimeStats(),
      slowQueries: this.getSlowQueries(10),
      memory: this.getMemoryStats(),
      system: this.getSystemStats(),
    }
  }

  /**
   * Reset all collected data
   */
  reset() {
    this.responseTimes.clear()
    this.slowQueries = []
    this.memorySamples = []
    this.requestCount = 0
    this.errorCount = 0
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval)
      this.memoryInterval = null
    }
  }
}

// Singleton instance
let instance = null

/**
 * Get or create performance monitor instance
 * @param {Object} options - Monitor options
 * @returns {PerformanceMonitor} Monitor instance
 */
export function getPerformanceMonitor(options) {
  if (!instance) {
    instance = new PerformanceMonitor(options)
  }
  return instance
}

/**
 * Create new performance monitor instance
 * @param {Object} options - Monitor options
 * @returns {PerformanceMonitor} New monitor instance
 */
export function createPerformanceMonitor(options) {
  return new PerformanceMonitor(options)
}

export default {
  PerformanceMonitor,
  getPerformanceMonitor,
  createPerformanceMonitor,
}
