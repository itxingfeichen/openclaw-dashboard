/**
 * Metrics Module Tests
 * Tests for Prometheus metrics, health checks, and performance monitoring
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { setTimeout } from 'timers/promises'

describe('Metrics Module', () => {
  let metricsModule
  let register

  before(async () => {
    metricsModule = await import('../src/metrics/metrics.js')
    register = metricsModule.register
  })

  describe('Registry', () => {
    it('should have a registry instance', () => {
      assert.ok(register)
      assert.strictEqual(typeof register.metrics, 'function')
    })

    it('should register default metrics', async () => {
      const metrics = await register.metrics()
      assert.ok(metrics.includes('nodejs_version_info'))
      assert.ok(metrics.includes('nodejs_eventloop_lag_seconds'))
    })

    it('should register custom HTTP metrics', async () => {
      const metrics = await register.metrics()
      assert.ok(metrics.includes('http_request_duration_seconds'))
      assert.ok(metrics.includes('http_requests_total'))
      assert.ok(metrics.includes('http_requests_in_flight'))
    })

    it('should register API response time metrics', async () => {
      const metrics = await register.metrics()
      assert.ok(metrics.includes('api_response_time_milliseconds'))
    })

    it('should register database metrics', async () => {
      const metrics = await register.metrics()
      assert.ok(metrics.includes('db_query_duration_milliseconds'))
      assert.ok(metrics.includes('db_queries_total'))
    })

    it('should register cache metrics', async () => {
      const metrics = await register.metrics()
      assert.ok(metrics.includes('cache_hits_total'))
      assert.ok(metrics.includes('cache_misses_total'))
      assert.ok(metrics.includes('cache_size_bytes'))
    })

    it('should register error metrics', async () => {
      const metrics = await register.metrics()
      assert.ok(metrics.includes('errors_total'))
    })
  })

  describe('Metrics Functions', () => {
    it('should get metrics as string', async () => {
      const metrics = await metricsModule.getMetrics()
      assert.ok(typeof metrics === 'string')
      assert.ok(metrics.length > 0)
    })

    it('should get metrics as JSON', async () => {
      const metrics = await metricsModule.getMetricsJSON()
      assert.ok(typeof metrics === 'object')
      assert.ok(Array.isArray(metrics))
      assert.ok(metrics.length > 0)
    })
  })
})

describe('Metrics Collectors', () => {
  let collectors

  before(async () => {
    const metricsModule = await import('../src/metrics/metrics.js')
    collectors = metricsModule.collectors
  })

  describe('CPU Usage Collector', () => {
    it('should collect CPU usage', () => {
      const cpuUsage = collectors.cpuUsage.collect()
      assert.ok(typeof cpuUsage === 'number')
      assert.ok(cpuUsage >= 0 && cpuUsage <= 1)
    })

    it('should update CPU usage over time', async () => {
      const first = collectors.cpuUsage.collect()
      await setTimeout(100)
      const second = collectors.cpuUsage.collect()
      assert.ok(typeof second === 'number')
    })
  })

  describe('Memory Usage Collector', () => {
    it('should collect memory usage', () => {
      const memory = collectors.memoryUsage.collect()
      assert.ok(typeof memory === 'object')
      assert.ok('total' in memory)
      assert.ok('free' in memory)
      assert.ok('used' in memory)
      assert.ok('percent' in memory)
      assert.ok(memory.total > 0)
      assert.ok(memory.used > 0)
      assert.ok(memory.percent >= 0 && memory.percent <= 100)
    })
  })

  describe('Request Counter', () => {
    it('should increment request count', () => {
      const before = collectors.requestCounter.get()
      collectors.requestCounter.increment('/test', 'GET')
      const after = collectors.requestCounter.get()
      assert.strictEqual(after.total, before.total + 1)
    })

    it('should track requests by route', () => {
      collectors.requestCounter.reset()
      collectors.requestCounter.increment('/api/users', 'GET')
      collectors.requestCounter.increment('/api/users', 'GET')
      collectors.requestCounter.increment('/api/posts', 'POST')

      const stats = collectors.requestCounter.get()
      assert.strictEqual(stats.byRoute['GET:/api/users'], 2)
      assert.strictEqual(stats.byRoute['POST:/api/posts'], 1)
    })

    it('should reset request count', () => {
      collectors.requestCounter.increment('/test', 'GET')
      collectors.requestCounter.reset()
      const after = collectors.requestCounter.get()
      assert.strictEqual(after.total, 0)
      assert.strictEqual(Object.keys(after.byRoute).length, 0)
    })
  })

  describe('Response Time Collector', () => {
    it('should record response times', () => {
      collectors.responseTimeCollector.reset()
      collectors.responseTimeCollector.record(100)
      collectors.responseTimeCollector.record(200)
      collectors.responseTimeCollector.record(300)

      const stats = collectors.responseTimeCollector.getStats()
      assert.strictEqual(stats.count, 3)
      assert.strictEqual(stats.min, 100)
      assert.strictEqual(stats.max, 300)
      assert.strictEqual(stats.avg, 200)
    })

    it('should calculate percentiles', () => {
      collectors.responseTimeCollector.reset()
      for (let i = 1; i <= 100; i++) {
        collectors.responseTimeCollector.record(i)
      }

      const stats = collectors.responseTimeCollector.getStats()
      assert.strictEqual(stats.count, 100)
      assert.ok(stats.p50 >= 45 && stats.p50 <= 55)
      assert.ok(stats.p95 >= 90 && stats.p95 <= 100)
      assert.ok(stats.p99 >= 95)
    })

    it('should handle empty stats', () => {
      collectors.responseTimeCollector.reset()
      const stats = collectors.responseTimeCollector.getStats()
      assert.strictEqual(stats.count, 0)
      assert.strictEqual(stats.min, 0)
      assert.strictEqual(stats.max, 0)
      assert.strictEqual(stats.avg, 0)
    })
  })

  describe('Slow Query Collector', () => {
    it('should record slow queries above threshold', () => {
      collectors.slowQueryCollector.reset()
      collectors.slowQueryCollector.record('SELECT * FROM users', 150)
      collectors.slowQueryCollector.record('SELECT * FROM posts', 50) // Below threshold

      const queries = collectors.slowQueryCollector.get()
      assert.strictEqual(queries.length, 1)
      assert.strictEqual(queries[0].query, 'SELECT * FROM users')
      assert.strictEqual(queries[0].duration, 150)
    })

    it('should include metadata in slow queries', () => {
      collectors.slowQueryCollector.reset()
      collectors.slowQueryCollector.record('SELECT * FROM users', 150, {
        userId: 123,
        endpoint: '/api/users',
      })

      const queries = collectors.slowQueryCollector.get()
      assert.strictEqual(queries[0].userId, 123)
      assert.strictEqual(queries[0].endpoint, '/api/users')
    })
  })

  describe('Health Collector', () => {
    it('should register health checks', () => {
      collectors.healthCollector.registerCheck('test', () => true)
      assert.ok('test' in collectors.healthCollector.checks)
    })

    it('should collect health check results', async () => {
      collectors.healthCollector.registerCheck('healthy', () => true)
      collectors.healthCollector.registerCheck('unhealthy', () => false)

      const results = await collectors.healthCollector.collect()
      assert.strictEqual(results.healthy.status, 'healthy')
      assert.strictEqual(results.unhealthy.status, 'unhealthy')
    })

    it('should handle errors in health checks', async () => {
      collectors.healthCollector.registerCheck('error', () => {
        throw new Error('Test error')
      })

      const results = await collectors.healthCollector.collect()
      assert.strictEqual(results.error.status, 'error')
      assert.ok(results.error.error.includes('Test error'))
    })
  })
})

describe('Metrics Middleware', () => {
  let middleware

  before(async () => {
    middleware = await import('../src/metrics/middleware.js')
  })

  describe('createMetricsMiddleware', () => {
    it('should create middleware function', () => {
      const mw = middleware.createMetricsMiddleware()
      assert.strictEqual(typeof mw, 'function')
    })

    it('should accept options', () => {
      const mw = middleware.createMetricsMiddleware({
        trackResponseTime: false,
        slowRequestThreshold: 500,
      })
      assert.strictEqual(typeof mw, 'function')
    })
  })

  describe('createCacheMetricsMiddleware', () => {
    it('should create cache metrics tracker', () => {
      const cacheMetrics = middleware.createCacheMetricsMiddleware()
      assert.ok(cacheMetrics.trackHit)
      assert.ok(cacheMetrics.trackMiss)
      assert.ok(cacheMetrics.updateSize)
    })

    it('should track cache hits', () => {
      const cacheMetrics = middleware.createCacheMetricsMiddleware()
      cacheMetrics.trackHit('default')
      // If we reach here without error, it's working
    })

    it('should track cache misses', () => {
      const cacheMetrics = middleware.createCacheMetricsMiddleware()
      cacheMetrics.trackMiss('default')
      // If we reach here without error, it's working
    })
  })
})

describe('Performance Monitor', () => {
  let perfModule

  before(async () => {
    perfModule = await import('../src/utils/performance-monitor.js')
  })

  describe('Response Time Tracking', () => {
    it('should record response times', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      const monitor = createPerformanceMonitor({ 
        enableMemoryLeakDetection: false,
        slowQueryThreshold: 10000
      })
      monitor.recordResponseTime('/api/test', 'GET', 100)
      const stats = monitor.getResponseTimeStats('/api/test', 'GET')
      assert.ok(stats.count >= 1)
      assert.ok(stats.min >= 100)
    })

    it('should calculate statistics', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      const monitor = createPerformanceMonitor({ 
        enableMemoryLeakDetection: false,
        slowQueryThreshold: 10000
      })
      monitor.recordResponseTime('/api/stats', 'GET', 50)
      monitor.recordResponseTime('/api/stats', 'GET', 100)
      monitor.recordResponseTime('/api/stats', 'GET', 150)

      const stats = monitor.getResponseTimeStats('/api/stats', 'GET')
      assert.ok(stats.count >= 3)
      assert.ok(stats.avg >= 50)
    })

    it('should emit slow response events', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      return new Promise((resolve) => {
        const monitor = createPerformanceMonitor({
          slowQueryThreshold: 50,
          enableMemoryLeakDetection: false,
        })

        monitor.on('slowResponse', (data) => {
          assert.ok(data.duration >= 50)
          assert.strictEqual(data.endpoint, '/api/slow')
          resolve()
        })

        monitor.recordResponseTime('/api/slow', 'GET', 100)
      })
    })
  })

  describe('Slow Query Tracking', () => {
    it('should record slow queries', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      const monitor = createPerformanceMonitor({ enableMemoryLeakDetection: false })
      monitor.on('slowQuery', () => {})
      monitor.recordSlowQuery('SELECT * FROM users', 200)
      const queries = monitor.getSlowQueries()
      assert.ok(queries.length > 0)
      assert.strictEqual(queries[queries.length - 1].query, 'SELECT * FROM users')
    })

    it('should include metadata', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      const monitor = createPerformanceMonitor({ enableMemoryLeakDetection: false })
      monitor.on('slowQuery', () => {})
      monitor.recordSlowQuery('SELECT * FROM posts', 150, {
        table: 'posts',
      })
      const queries = monitor.getSlowQueries()
      const lastQuery = queries[queries.length - 1]
      assert.strictEqual(lastQuery.table, 'posts')
    })

    it('should emit slow query events', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      return new Promise((resolve) => {
        const monitor = createPerformanceMonitor({
          slowQueryThreshold: 50,
          enableMemoryLeakDetection: false,
        })

        monitor.on('slowQuery', (data) => {
          assert.ok(data.duration >= 50)
          resolve()
        })

        monitor.recordSlowQuery('SLOW QUERY', 100)
      })
    })
  })

  describe('Error Tracking', () => {
    it('should record errors', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      const monitor = createPerformanceMonitor({ enableMemoryLeakDetection: false })
      monitor.on('error', () => {})
      const error = new Error('Test error')
      monitor.recordError('test', error)
    })

    it('should emit error events', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      return new Promise((resolve) => {
        const monitor = createPerformanceMonitor({
          enableMemoryLeakDetection: false,
        })

        monitor.on('error', (data) => {
          assert.strictEqual(data.type, 'test')
          assert.ok(data.message.includes('Test'))
          resolve()
        })

        monitor.recordError('test', new Error('Test error'))
      })
    })
  })

  describe('Memory Monitoring', () => {
    it('should get memory stats', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      const monitor = createPerformanceMonitor({ enableMemoryLeakDetection: false })
      const stats = monitor.getMemoryStats()
      assert.ok('current' in stats)
      assert.ok('trend' in stats)
      assert.ok(stats.current.heapUsed > 0)
    })

    it('should get system stats', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      const monitor = createPerformanceMonitor({ enableMemoryLeakDetection: false })
      const stats = monitor.getSystemStats()
      assert.ok('uptime' in stats)
      assert.ok('platform' in stats)
      assert.ok('memoryUsage' in stats)
      assert.ok(stats.uptime > 0)
    })
  })

  describe('Performance Report', () => {
    it('should generate comprehensive report', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      const monitor = createPerformanceMonitor({ enableMemoryLeakDetection: false })
      const report = monitor.getReport()
      assert.ok('timestamp' in report)
      assert.ok('uptime' in report)
      assert.ok('requests' in report)
      assert.ok('responseTimes' in report)
      assert.ok('memory' in report)
      assert.ok('system' in report)
    })
  })

  describe('Reset', () => {
    it('should reset all collected data', async () => {
      const { createPerformanceMonitor } = await import('../src/utils/performance-monitor.js')
      const monitor = createPerformanceMonitor({ 
        enableMemoryLeakDetection: false,
        slowQueryThreshold: 10000
      })
      monitor.on('slowQuery', () => {})
      monitor.on('error', () => {})
      monitor.recordResponseTime('/api/reset', 'GET', 100)
      monitor.recordSlowQuery('TEST', 200)
      monitor.recordError('test', new Error('Test'))

      monitor.reset()

      const stats = monitor.getResponseTimeStats('/api/reset', 'GET')
      assert.strictEqual(stats.count, 0)
    })
  })
})

describe('Health Check Routes', () => {
  let healthRoutes
  let express

  before(async () => {
    healthRoutes = await import('../src/routes/health.js')
    express = (await import('express')).default
  })

  it('should have health routes exported', () => {
    assert.ok(healthRoutes.default)
  })

  it('should create express app with health routes', () => {
    const app = express()
    app.use('/api/health', healthRoutes.default)
    assert.ok(app)
  })

  // Note: Full integration tests would require starting the server
  // and making HTTP requests. These are covered in integration tests.
})

describe('Metrics Integration', () => {
  it('should have all components working together', async () => {
    const metricsModule = await import('../src/metrics/metrics.js')
    const middleware = await import('../src/metrics/middleware.js')
    const perfMonitor = await import('../src/utils/performance-monitor.js')

    // Verify all modules can be imported
    assert.ok(metricsModule.register)
    assert.ok(middleware.createMetricsMiddleware)
    assert.ok(perfMonitor.getPerformanceMonitor)
  })
})
