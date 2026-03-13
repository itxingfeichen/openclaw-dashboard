/**
 * Health Check Routes
 * Provides comprehensive health check endpoints for monitoring
 * @module routes/health
 */

import express from 'express'
import { register } from '../metrics/metrics.js'
import { logInfo, logError } from '../utils/logger.js'

const router = express.Router()

/**
 * Check database health
 * @returns {Object} Database health status
 */
async function checkDatabaseHealth() {
  try {
    // Import database dynamically to avoid circular dependencies
    const { database } = await import('../database/index.js')
    const db = database.getInstance()

    if (!db) {
      return {
        status: 'unhealthy',
        message: 'Database not initialized',
      }
    }

    // Try a simple query
    const result = db.prepare('SELECT 1 as check').get()

    return {
      status: result?.check === 1 ? 'healthy' : 'unhealthy',
      message: result?.check === 1 ? 'Database connection OK' : 'Database query failed',
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database error: ${error.message}`,
      error: error.message,
    }
  }
}

/**
 * Check cache health
 * @returns {Object} Cache health status
 */
async function checkCacheHealth() {
  try {
    const { cache } = await import('../cache/index.js')
    const cacheInstance = cache.getInstance()

    if (!cacheInstance) {
      return {
        status: 'degraded',
        message: 'Cache not initialized (optional)',
      }
    }

    // Try to get cache stats
    const stats = cacheInstance.getStats()

    return {
      status: 'healthy',
      message: 'Cache operational',
      stats: {
        size: stats.size,
        hits: stats.hits,
        misses: stats.misses,
      },
    }
  } catch (error) {
    return {
      status: 'degraded',
      message: `Cache check failed: ${error.message}`,
      error: error.message,
    }
  }
}

/**
 * Check external services health
 * @returns {Object} External services health status
 */
async function checkExternalServices() {
  // Add checks for external dependencies here
  return {
    status: 'healthy',
    message: 'No external dependencies configured',
  }
}

/**
 * GET /api/health
 * Basic health check endpoint
 * Returns overall service health status
 */
router.get('/', async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
  }

  res.json(healthStatus)
})

/**
 * GET /api/health/ready
 * Readiness check - verifies all dependencies are ready
 * Used by Kubernetes readiness probes
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: await checkDatabaseHealth(),
    cache: await checkCacheHealth(),
    externalServices: await checkExternalServices(),
  }

  // Determine overall status
  const statuses = Object.values(checks).map((c) => c.status)
  const isHealthy = statuses.every((s) => s === 'healthy')
  const isDegraded = statuses.some((s) => s === 'degraded') && !statuses.includes('unhealthy')

  let overallStatus = 'ready'
  let statusCode = 200

  if (!isHealthy && !isDegraded) {
    overallStatus = 'not_ready'
    statusCode = 503
  } else if (isDegraded) {
    overallStatus = 'degraded'
    statusCode = 200 // Still accept traffic but warn
  }

  const response = {
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }

  res.status(statusCode).json(response)
})

/**
 * GET /api/health/live
 * Liveness check - verifies the service is still alive
 * Used by Kubernetes liveness probes
 */
router.get('/live', (req, res) => {
  // Basic liveness check - if we can respond, we're alive
  const memoryUsage = process.memoryUsage()
  const maxHeap = Math.pow(2, 32) // Approximate max heap for 32-bit pointers

  // Check if we're in a reasonable state
  const isAlive = memoryUsage.heapUsed < maxHeap * 0.9

  if (isAlive) {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
      },
    })
  } else {
    res.status(503).json({
      status: 'dying',
      timestamp: new Date().toISOString(),
      reason: 'Memory pressure critical',
    })
  }
})

/**
 * GET /api/health/detailed
 * Detailed health check with all metrics
 */
router.get('/detailed', async (req, res) => {
  try {
    const os = await import('os')

    const detailed = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      uptimeFormatted: formatUptime(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',

      system: {
        platform: os.default.platform(),
        arch: os.default.arch(),
        cpus: os.default.cpus().length,
        totalMemory: os.default.totalmem(),
        freeMemory: os.default.freemem(),
        loadAvg: os.default.loadavg(),
      },

      process: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime(),
        version: process.version,
        pid: process.pid,
      },

      checks: {
        database: await checkDatabaseHealth(),
        cache: await checkCacheHealth(),
        externalServices: await checkExternalServices(),
      },
    }

    res.json(detailed)
  } catch (error) {
    logError('Detailed health check failed', error)
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    })
  }
})

/**
 * GET /api/health/metrics
 * Prometheus metrics endpoint
 * Exports metrics in Prometheus exposition format
 */
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType)
    const metrics = await register.metrics()
    res.send(metrics)
  } catch (error) {
    logError('Metrics export failed', error)
    res.status(500).json({
      error: 'Failed to export metrics',
      message: error.message,
    })
  }
})

/**
 * Format uptime in human-readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}

export default router
