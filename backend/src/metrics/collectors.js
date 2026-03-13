/**
 * Custom Metric Collectors
 * Collects CPU, memory, request counts, and other system metrics
 * @module collectors
 */

import os from 'os'

/**
 * Create custom collectors for system metrics
 * @param {client.Registry} register - Prometheus registry
 * @returns {Object} Collection of collector functions
 */
export function createCollectors(register) {
  // CPU usage collector
  const cpuUsage = {
    current: 0,
    previous: null,
    lastUpdate: Date.now(),

    collect() {
      const cpus = os.cpus()
      let totalIdle = 0
      let totalTick = 0

      cpus.forEach((cpu) => {
        const total =
          cpu.times.user +
          cpu.times.nice +
          cpu.times.sys +
          cpu.times.irq +
          cpu.times.idle

        totalTick += total
        totalIdle += cpu.times.idle
      })

      const current = {
        total: totalTick,
        idle: totalIdle,
        time: Date.now(),
      }

      if (this.previous) {
        const totalDiff = current.total - this.previous.total
        const idleDiff = current.idle - this.previous.idle

        if (totalDiff > 0) {
          this.current = 1 - idleDiff / totalDiff
        }
      }

      this.previous = current
      this.lastUpdate = Date.now()

      return this.current
    },
  }

  // Memory usage collector
  const memoryUsage = {
    collect() {
      const total = os.totalmem()
      const free = os.freemem()
      const used = total - free

      return {
        total,
        free,
        used,
        percent: (used / total) * 100,
      }
    },
  }

  // Request counter collector
  const requestCounter = {
    count: 0,
    byRoute: {},

    increment(route, method) {
      this.count++
      const key = `${method}:${route}`
      this.byRoute[key] = (this.byRoute[key] || 0) + 1
    },

    reset() {
      this.count = 0
      this.byRoute = {}
    },

    get() {
      return {
        total: this.count,
        byRoute: { ...this.byRoute },
      }
    },
  }

  // Response time collector
  const responseTimeCollector = {
    times: [],
    maxSamples: 1000,

    record(duration) {
      this.times.push(duration)
      if (this.times.length > this.maxSamples) {
        this.times.shift()
      }
    },

    getStats() {
      if (this.times.length === 0) {
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

      const sorted = [...this.times].sort((a, b) => a - b)
      const sum = this.times.reduce((a, b) => a + b, 0)
      const count = this.times.length

      return {
        count,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / count,
        p50: sorted[Math.floor(count * 0.5)],
        p95: sorted[Math.floor(count * 0.95)],
        p99: sorted[Math.floor(count * 0.99)],
      }
    },

    reset() {
      this.times = []
    },
  }

  // Slow query collector
  const slowQueryCollector = {
    queries: [],
    threshold: 100, // ms
    maxQueries: 100,

    record(query, duration, metadata = {}) {
      if (duration >= this.threshold) {
        this.queries.push({
          query,
          duration,
          timestamp: Date.now(),
          ...metadata,
        })

        if (this.queries.length > this.maxQueries) {
          this.queries.shift()
        }
      }
    },

    get() {
      return [...this.queries]
    },

    reset() {
      this.queries = []
    },
  }

  // Health status collector
  const healthCollector = {
    checks: {},

    registerCheck(name, checkFn) {
      this.checks[name] = checkFn
    },

    async collect() {
      const results = {}

      for (const [name, checkFn] of Object.entries(this.checks)) {
        try {
          const result = await checkFn()
          results[name] = {
            status: result ? 'healthy' : 'unhealthy',
            timestamp: Date.now(),
          }
        } catch (error) {
          results[name] = {
            status: 'error',
            error: error.message,
            timestamp: Date.now(),
          }
        }
      }

      return results
    },
  }

  // Register metric update intervals
  const updateIntervals = []

  /**
   * Start collecting metrics at regular intervals
   */
  function startCollection() {
    // Update CPU usage every 5 seconds
    const cpuInterval = setInterval(() => {
      cpuUsage.collect()
    }, 5000)
    updateIntervals.push(cpuInterval)

    // Update memory usage every 10 seconds
    const memInterval = setInterval(() => {
      const mem = memoryUsage.collect()
      if (register) {
        const memMetric = register.getSingleMetric('nodejs_heap_size_used_bytes')
        if (memMetric) {
          // Memory metrics are handled by default collectors
        }
      }
    }, 10000)
    updateIntervals.push(memInterval)
  }

  /**
   * Stop all metric collection intervals
   */
  function stopCollection() {
    updateIntervals.forEach((interval) => clearInterval(interval))
    updateIntervals.length = 0
  }

  return {
    cpuUsage,
    memoryUsage,
    requestCounter,
    responseTimeCollector,
    slowQueryCollector,
    healthCollector,
    startCollection,
    stopCollection,
  }
}

export default createCollectors
