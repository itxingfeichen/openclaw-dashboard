/**
 * Metrics Service and Routes Tests
 * Tests for system resource monitoring API
 */

import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setTimeout } from 'timers/promises'
import { getDatabase, closeDatabase, resetDatabase } from '../src/database/index.js'
import { initializeMetricsTable } from '../src/services/metricsService.js'

// Test metrics service
describe('Metrics Service', () => {
  before(async () => {
    // Set test database path
    process.env.DB_PATH = './data/test-metrics.db'
    resetDatabase()
    await initializeMetricsTable()
  })

  after(async () => {
    await closeDatabase()
  })

  describe('CPU Metrics Collection', () => {
    it('should collect CPU metrics', async () => {
      const { collectCpuMetrics } = await import('../src/services/metricsService.js')
      const cpu = collectCpuMetrics()

      assert.ok(typeof cpu === 'object')
      assert.ok('usage' in cpu)
      assert.ok('cores' in cpu)
      assert.ok(typeof cpu.usage === 'number')
      assert.ok(typeof cpu.cores === 'number')
      assert.ok(cpu.cores > 0)
      assert.ok(cpu.usage >= 0 && cpu.usage <= 100)
    })

    it('should include CPU model and speed', async () => {
      const { collectCpuMetrics } = await import('../src/services/metricsService.js')
      const cpu = collectCpuMetrics()

      assert.ok('model' in cpu)
      assert.ok('speed' in cpu)
    })
  })

  describe('Memory Metrics Collection', () => {
    it('should collect memory metrics', async () => {
      const { collectMemoryMetrics } = await import('../src/services/metricsService.js')
      const memory = collectMemoryMetrics()

      assert.ok(typeof memory === 'object')
      assert.ok('total' in memory)
      assert.ok('used' in memory)
      assert.ok('free' in memory)
      assert.ok('percent' in memory)
      assert.ok(typeof memory.total === 'number')
      assert.ok(memory.total > 0)
      assert.ok(memory.percent >= 0 && memory.percent <= 100)
    })

    it('should have consistent memory values', async () => {
      const { collectMemoryMetrics } = await import('../src/services/metricsService.js')
      const memory = collectMemoryMetrics()

      assert.strictEqual(memory.total, memory.used + memory.free)
    })
  })

  describe('Disk Metrics Collection', () => {
    it('should collect disk metrics', async () => {
      const { collectDiskMetrics } = await import('../src/services/metricsService.js')
      const disk = collectDiskMetrics()

      assert.ok(typeof disk === 'object')
      assert.ok('total' in disk)
      assert.ok('used' in disk)
      assert.ok('free' in disk)
      assert.ok('percent' in disk)
    })
  })

  describe('Network Metrics Collection', () => {
    it('should collect network metrics', async () => {
      const { collectNetworkMetrics } = await import('../src/services/metricsService.js')
      const network = collectNetworkMetrics()

      assert.ok(typeof network === 'object')
      assert.ok('rxBytes' in network)
      assert.ok('txBytes' in network)
      assert.ok('interfaceCount' in network)
      assert.ok(typeof network.interfaceCount === 'number')
    })
  })

  describe('Load Metrics Collection', () => {
    it('should collect load average metrics', async () => {
      const { collectLoadMetrics } = await import('../src/services/metricsService.js')
      const load = collectLoadMetrics()

      assert.ok(typeof load === 'object')
      assert.ok('load1' in load)
      assert.ok('load5' in load)
      assert.ok('load15' in load)
      assert.ok(typeof load.load1 === 'number')
      assert.ok(typeof load.load5 === 'number')
      assert.ok(typeof load.load15 === 'number')
    })
  })

  describe('Collect All Metrics', () => {
    it('should collect all system metrics', async () => {
      const { collectAllMetrics } = await import('../src/services/metricsService.js')
      const metrics = collectAllMetrics()

      assert.ok(typeof metrics === 'object')
      assert.ok('timestamp' in metrics)
      assert.ok('hostname' in metrics)
      assert.ok('platform' in metrics)
      assert.ok('cpu' in metrics)
      assert.ok('memory' in metrics)
      assert.ok('disk' in metrics)
      assert.ok('network' in metrics)
      assert.ok('load' in metrics)
    })

    it('should associate metrics with agent ID', async () => {
      const { collectAllMetrics } = await import('../src/services/metricsService.js')
      const metrics = collectAllMetrics('test-agent-123')

      assert.strictEqual(metrics.agentId, 'test-agent-123')
    })
  })

  describe('Store and Retrieve Metrics', () => {
    it('should store metrics in database', async () => {
      const { collectAllMetrics, storeMetrics } = await import('../src/services/metricsService.js')
      const metrics = collectAllMetrics('test-agent-store')
      
      const result = await storeMetrics(metrics)
      
      assert.ok(result.id)
      assert.strictEqual(result.agentId, 'test-agent-store')
    })

    it('should retrieve current metrics', async () => {
      const { getCurrentMetrics } = await import('../src/services/metricsService.js')
      const metrics = await getCurrentMetrics('test-agent-current')
      
      assert.ok(metrics)
      assert.ok(metrics.timestamp)
      assert.strictEqual(metrics.agentId, 'test-agent-current')
    })

    it('should retrieve historical metrics', async () => {
      const { 
        getCurrentMetrics, 
        getHistoricalMetrics 
      } = await import('../src/services/metricsService.js')
      
      // Store some metrics
      await getCurrentMetrics('test-agent-history')
      await setTimeout(10)
      await getCurrentMetrics('test-agent-history')
      
      // Retrieve historical data
      const history = await getHistoricalMetrics({
        agentId: 'test-agent-history',
        limit: 10,
      })
      
      assert.ok(Array.isArray(history))
      assert.ok(history.length > 0)
    })

    it('should filter historical metrics by time range', async () => {
      const { 
        getCurrentMetrics, 
        getHistoricalMetrics 
      } = await import('../src/services/metricsService.js')
      
      const now = new Date()
      const from = new Date(now.getTime() - 60000).toISOString() // 1 minute ago
      const to = new Date(now.getTime() + 60000).toISOString() // 1 minute in future
      
      const history = await getHistoricalMetrics({
        from,
        to,
        limit: 100,
      })
      
      assert.ok(Array.isArray(history))
    })

    it('should get agent-specific metrics', async () => {
      const { 
        getCurrentMetrics, 
        getAgentMetrics 
      } = await import('../src/services/metricsService.js')
      
      await getCurrentMetrics('test-agent-specific')
      
      const metrics = await getAgentMetrics('test-agent-specific', { limit: 10 })
      
      assert.ok(Array.isArray(metrics))
    })
  })

  describe('Metrics Summary', () => {
    it('should get aggregated metrics summary', async () => {
      const { 
        getCurrentMetrics, 
        getMetricsSummary 
      } = await import('../src/services/metricsService.js')
      
      // Store some metrics
      await getCurrentMetrics('test-agent-summary')
      
      const summary = await getMetricsSummary({
        agentId: 'test-agent-summary',
      })
      
      assert.ok(summary)
      assert.ok('count' in summary)
      assert.ok('timeRange' in summary)
      assert.ok('cpu' in summary)
      assert.ok('memory' in summary)
      assert.ok('disk' in summary)
      assert.ok('load' in summary)
    })

    it('should include aggregation statistics', async () => {
      const { getMetricsSummary } = await import('../src/services/metricsService.js')
      
      const summary = await getMetricsSummary()
      
      assert.ok(summary.cpu.avg !== undefined)
      assert.ok(summary.cpu.max !== undefined)
      assert.ok(summary.cpu.min !== undefined)
      assert.ok(summary.memory.avg !== undefined)
      assert.ok(summary.memory.max !== undefined)
      assert.ok(summary.memory.min !== undefined)
    })
  })

  describe('Agent ID Management', () => {
    it('should get distinct agent IDs', async () => {
      const { 
        getCurrentMetrics, 
        getAgentIds 
      } = await import('../src/services/metricsService.js')
      
      // Store metrics for different agents
      await getCurrentMetrics('agent-alpha')
      await getCurrentMetrics('agent-beta')
      
      const agentIds = await getAgentIds()
      
      assert.ok(Array.isArray(agentIds))
      assert.ok(agentIds.includes('agent-alpha'))
      assert.ok(agentIds.includes('agent-beta'))
    })
  })

  describe('Metrics Cleanup', () => {
    it('should delete old metrics', async () => {
      const { 
        getCurrentMetrics, 
        deleteOldMetrics 
      } = await import('../src/services/metricsService.js')
      
      // Store a metric
      await getCurrentMetrics('test-agent-cleanup')
      
      // Delete metrics older than 1 hour from now
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
      const result = await deleteOldMetrics(oneHourAgo)
      
      assert.ok('deleted' in result)
      assert.ok(typeof result.deleted === 'number')
    })
  })
})

// Test metrics routes
describe('Metrics Routes', () => {
  let express
  let app
  let server
  let baseUrl

  before(async () => {
    express = (await import('express')).default
    process.env.DB_PATH = './data/test-metrics-routes.db'
    resetDatabase()
    await initializeMetricsTable()
    
    app = express()
    app.use(express.json())
    
    const metricsRouter = (await import('../src/routes/metrics.js')).default
    app.use('/api/metrics', metricsRouter)
    
    // Start server on random port
    server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s))
    })
    const address = server.address()
    baseUrl = `http://localhost:${address.port}`
  })

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await closeDatabase()
  })

  describe('GET /api/metrics/current', () => {
    it('should return current metrics', async () => {
      const response = await fetch(`${baseUrl}/api/metrics/current`)
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.success, true)
      assert.ok(data.data)
      assert.ok(data.data.timestamp)
      assert.ok(data.data.cpu)
      assert.ok(data.data.memory)
    })

    it('should accept agentId query parameter', async () => {
      const response = await fetch(`${baseUrl}/api/metrics/current?agentId=test-route-agent`)
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.data.agentId, 'test-route-agent')
    })
  })

  describe('GET /api/metrics/history', () => {
    it('should return historical metrics', async () => {
      const response = await fetch(`${baseUrl}/api/metrics/history`)
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.success, true)
      assert.ok(Array.isArray(data.data))
      assert.ok('count' in data)
      assert.ok('filters' in data)
    })

    it('should support pagination with limit parameter', async () => {
      const response = await fetch(`${baseUrl}/api/metrics/history?limit=5`)
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.ok(data.data.length <= 5)
      assert.strictEqual(data.filters.limit, 5)
    })

    it('should support time range filtering', async () => {
      const from = new Date(Date.now() - 3600000).toISOString()
      const to = new Date().toISOString()
      
      const response = await fetch(
        `${baseUrl}/api/metrics/history?from=${from}&to=${to}`
      )
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.filters.from, from)
      assert.strictEqual(data.filters.to, to)
    })

    it('should support agentId filtering', async () => {
      const response = await fetch(`${baseUrl}/api/metrics/history?agentId=specific-agent`)
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.filters.agentId, 'specific-agent')
    })
  })

  describe('GET /api/metrics/agent/:agentId', () => {
    it('should return metrics for specific agent', async () => {
      const response = await fetch(`${baseUrl}/api/metrics/agent/test-agent-123`)
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.agentId, 'test-agent-123')
      assert.ok(Array.isArray(data.data))
    })

    it('should support limit parameter', async () => {
      const response = await fetch(`${baseUrl}/api/metrics/agent/test-agent?limit=10`)
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.ok(data.data.length <= 10)
    })

    it('should handle empty agentId gracefully', async () => {
      // Test with an empty string agentId (simulated by encoding)
      const response = await fetch(`${baseUrl}/api/metrics/agent/%20`)
      
      // Should return either 400 (validation) or 200 with empty data
      assert.ok(response.status === 400 || response.status === 200)
    })
  })

  describe('GET /api/metrics/summary', () => {
    it('should return aggregated metrics summary', async () => {
      const response = await fetch(`${baseUrl}/api/metrics/summary`)
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.success, true)
      assert.ok(data.data)
      assert.ok('count' in data.data)
      assert.ok('timeRange' in data.data)
      assert.ok('cpu' in data.data)
      assert.ok('memory' in data.data)
    })

    it('should support agentId filtering', async () => {
      const response = await fetch(`${baseUrl}/api/metrics/summary?agentId=summary-test-agent`)
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.filters.agentId, 'summary-test-agent')
    })

    it('should support time range filtering', async () => {
      const from = new Date(Date.now() - 3600000).toISOString()
      const to = new Date().toISOString()
      
      const response = await fetch(
        `${baseUrl}/api/metrics/summary?from=${from}&to=${to}`
      )
      const data = await response.json()
      
      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.filters.from, from)
      assert.strictEqual(data.filters.to, to)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid query parameters gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/metrics/history?limit=invalid`)
      
      // Should not crash, should return some default behavior
      assert.ok(response.status >= 200 && response.status < 500)
    })
  })
})

// Test metrics data integrity
describe('Metrics Data Integrity', () => {
  before(async () => {
    process.env.DB_PATH = './data/test-metrics-integrity.db'
    resetDatabase()
    await initializeMetricsTable()
  })

  after(async () => {
    await closeDatabase()
  })

  it('should maintain data consistency across operations', async () => {
    const { 
      collectAllMetrics, 
      storeMetrics, 
      getHistoricalMetrics,
      getMetricsSummary 
    } = await import('../src/services/metricsService.js')
    
    const agentId = 'integrity-test-agent'
    
    // Store multiple metrics
    const storedMetrics = []
    for (let i = 0; i < 5; i++) {
      const metrics = collectAllMetrics(agentId)
      const stored = await storeMetrics(metrics)
      storedMetrics.push(stored)
      await setTimeout(10)
    }
    
    // Retrieve and verify
    const history = await getHistoricalMetrics({ agentId, limit: 10 })
    assert.ok(history.length >= 5)
    
    // Verify summary matches stored data
    const summary = await getMetricsSummary({ agentId })
    assert.ok(summary.count >= 5)
    assert.ok(summary.cpu.avg >= 0)
    assert.ok(summary.memory.avg >= 0)
  })

  it('should handle concurrent metric storage', async () => {
    const { storeMetrics, collectAllMetrics } = await import('../src/services/metricsService.js')
    
    const agentId = 'concurrent-test-agent'
    const promises = []
    
    for (let i = 0; i < 10; i++) {
      promises.push(
        storeMetrics(collectAllMetrics(agentId))
      )
    }
    
    const results = await Promise.all(promises)
    
    assert.ok(results.every(r => r.id))
  })
})
