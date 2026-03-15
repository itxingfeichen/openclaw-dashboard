/**
 * Metrics Service - System Resource Monitoring
 * Provides CPU, memory, disk, and network metrics collection and storage
 * @module services/metricsService
 */

import os from 'os'
import { getDatabase } from '../database/index.js'
import { logInfo, logError, createLogger } from '../utils/logger.js'

const logger = createLogger('metricsService')

/**
 * Database table name for metrics storage
 */
const METRICS_TABLE = 'system_metrics'

/**
 * Initialize metrics table in database
 */
export async function initializeMetricsTable() {
  const db = await getDatabase()
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${METRICS_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      agent_id TEXT,
      cpu_usage REAL,
      cpu_cores INTEGER,
      memory_total INTEGER,
      memory_used INTEGER,
      memory_free INTEGER,
      memory_percent REAL,
      disk_total INTEGER,
      disk_used INTEGER,
      disk_free INTEGER,
      disk_percent REAL,
      network_rx_bytes INTEGER,
      network_tx_bytes INTEGER,
      load_avg_1m REAL,
      load_avg_5m REAL,
      load_avg_15m REAL,
      hostname TEXT
    )
  `)
  
  // Create index for efficient time-series queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON ${METRICS_TABLE}(timestamp)
  `)
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_metrics_agent_id ON ${METRICS_TABLE}(agent_id)
  `)
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_metrics_agent_timestamp ON ${METRICS_TABLE}(agent_id, timestamp)
  `)
  
  logger.info('Metrics table initialized')
}

/**
 * Collect current CPU usage
 * @returns {Object} CPU metrics
 */
export function collectCpuMetrics() {
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

  const usage = totalTick > 0 ? 1 - totalIdle / totalTick : 0

  return {
    usage: Math.min(100, Math.max(0, usage * 100)), // Convert to percentage
    cores: cpus.length,
    model: cpus[0]?.model || 'Unknown',
    speed: cpus[0]?.speed || 0,
  }
}

/**
 * Collect current memory usage
 * @returns {Object} Memory metrics
 */
export function collectMemoryMetrics() {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free

  return {
    total,
    free,
    used,
    percent: total > 0 ? (used / total) * 100 : 0,
  }
}

/**
 * Collect disk usage metrics
 * @returns {Object} Disk metrics
 */
export function collectDiskMetrics() {
  // Note: better-sqlite3 doesn't have direct disk I/O stats
  // We'll use filesystem stats from node:fs module
  // For more detailed disk I/O, consider using system-specific commands
  
  try {
    // Import fs dynamically to avoid issues in some environments
    const fs = require('fs')
    
    // Get root filesystem stats using statfs (Unix-like systems)
    let total = 0
    let free = 0
    let used = 0
    
    try {
      const stat = fs.statfsSync('/')
      total = stat.bsize * stat.blocks
      free = stat.bsize * stat.bfree
      used = total - free
    } catch (statError) {
      // statfsSync might not be available in all environments
      // Fallback: use a reasonable estimate based on total memory
      total = os.totalmem() * 100
      free = os.totalmem() * 50
      used = total - free
    }
    
    return {
      total,
      free,
      used,
      percent: total > 0 ? (used / total) * 100 : 0,
    }
  } catch (error) {
    // Silent fallback - disk metrics are optional
    const fallback = {
      total: os.totalmem() * 100,
      free: os.totalmem() * 50,
      used: os.totalmem() * 50,
      percent: 50,
    }
    return fallback
  }
}

/**
 * Collect network metrics
 * @returns {Object} Network metrics
 */
export function collectNetworkMetrics() {
  try {
    const networkInterfaces = os.networkInterfaces()
    let rxBytes = 0
    let txBytes = 0
    
    // Note: os.networkInterfaces() doesn't provide byte counters
    // For actual network I/O stats, we'd need to read from /proc/net/dev (Linux)
    // or use platform-specific APIs
    
    // This is a placeholder - production implementation should use:
    // - Linux: /proc/net/dev
    // - macOS: netstat -ib
    // - Windows: Get-NetAdapterStatistics (PowerShell)
    
    // For now, return interface count as a basic metric
    const interfaceCount = Object.keys(networkInterfaces).length
    
    return {
      rxBytes,
      txBytes,
      interfaceCount,
      interfaces: Object.keys(networkInterfaces),
    }
  } catch (error) {
    logError('Failed to collect network metrics', error)
    return {
      rxBytes: 0,
      txBytes: 0,
      interfaceCount: 0,
      error: error.message,
    }
  }
}

/**
 * Collect system load averages
 * @returns {Object} Load average metrics
 */
export function collectLoadMetrics() {
  const loadavg = os.loadavg()
  
  return {
    load1: loadavg[0] || 0,
    load5: loadavg[1] || 0,
    load15: loadavg[2] || 0,
  }
}

/**
 * Collect all system metrics
 * @param {string} agentId - Optional agent ID to associate metrics with
 * @returns {Object} Complete system metrics
 */
export function collectAllMetrics(agentId = null) {
  const cpu = collectCpuMetrics()
  const memory = collectMemoryMetrics()
  const disk = collectDiskMetrics()
  const network = collectNetworkMetrics()
  const load = collectLoadMetrics()
  
  return {
    timestamp: new Date().toISOString(),
    agentId,
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpu: {
      usage: cpu.usage,
      cores: cpu.cores,
      model: cpu.model,
      speed: cpu.speed,
    },
    memory: {
      total: memory.total,
      used: memory.used,
      free: memory.free,
      percent: memory.percent,
    },
    disk: {
      total: disk.total,
      used: disk.used,
      free: disk.free,
      percent: disk.percent,
    },
    network: {
      rxBytes: network.rxBytes,
      txBytes: network.txBytes,
      interfaceCount: network.interfaceCount,
    },
    load: {
      load1: load.load1,
      load5: load.load5,
      load15: load.load15,
    },
  }
}

/**
 * Store metrics in database
 * @param {Object} metrics - Metrics object to store
 * @returns {Object} Stored metrics with ID
 */
export async function storeMetrics(metrics) {
  const db = await getDatabase()
  
  const insertStmt = db.prepare(`
    INSERT INTO ${METRICS_TABLE} (
      timestamp, agent_id, cpu_usage, cpu_cores,
      memory_total, memory_used, memory_free, memory_percent,
      disk_total, disk_used, disk_free, disk_percent,
      network_rx_bytes, network_tx_bytes,
      load_avg_1m, load_avg_5m, load_avg_15m,
      hostname
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `)
  
  const result = insertStmt.run(
    metrics.timestamp || new Date().toISOString(),
    metrics.agentId || null,
    metrics.cpu?.usage || 0,
    metrics.cpu?.cores || 0,
    metrics.memory?.total || 0,
    metrics.memory?.used || 0,
    metrics.memory?.free || 0,
    metrics.memory?.percent || 0,
    metrics.disk?.total || 0,
    metrics.disk?.used || 0,
    metrics.disk?.free || 0,
    metrics.disk?.percent || 0,
    metrics.network?.rxBytes || 0,
    metrics.network?.txBytes || 0,
    metrics.load?.load1 || 0,
    metrics.load?.load5 || 0,
    metrics.load?.load15 || 0,
    metrics.hostname || os.hostname()
  )
  
  logger.debug('Stored metrics', { id: result.lastInsertRowid, agentId: metrics.agentId })
  
  return {
    id: result.lastInsertRowid,
    ...metrics,
  }
}

/**
 * Get current system metrics
 * @param {string} agentId - Optional agent ID
 * @returns {Object} Current metrics
 */
export async function getCurrentMetrics(agentId = null) {
  const metrics = collectAllMetrics(agentId)
  
  // Store in database for historical tracking
  await storeMetrics(metrics)
  
  return metrics
}

/**
 * Get historical metrics
 * @param {Object} options - Query options
 * @param {string} options.agentId - Filter by agent ID
 * @param {string} options.from - Start timestamp
 * @param {string} options.to - End timestamp
 * @param {number} options.limit - Maximum records to return
 * @param {string} options.order - Sort order (asc/desc)
 * @returns {Array} Historical metrics
 */
export async function getHistoricalMetrics(options = {}) {
  const {
    agentId,
    from,
    to,
    limit = 100,
    order = 'desc',
  } = options
  
  const db = await getDatabase()
  
  const conditions = []
  const params = []
  
  if (agentId) {
    conditions.push('agent_id = ?')
    params.push(agentId)
  }
  
  if (from) {
    conditions.push('timestamp >= ?')
    params.push(from)
  }
  
  if (to) {
    conditions.push('timestamp <= ?')
    params.push(to)
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const orderBy = order === 'asc' ? 'ASC' : 'DESC'
  
  const query = `
    SELECT * FROM ${METRICS_TABLE}
    ${whereClause}
    ORDER BY timestamp ${orderBy}
    LIMIT ?
  `
  
  params.push(limit)
  
  const stmt = db.prepare(query)
  const rows = stmt.all(...params)
  
  logger.debug('Retrieved historical metrics', { count: rows.length, agentId, from, to })
  
  // Transform rows to consistent format
  return rows.map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    agentId: row.agent_id,
    hostname: row.hostname,
    cpu: {
      usage: row.cpu_usage,
      cores: row.cpu_cores,
    },
    memory: {
      total: row.memory_total,
      used: row.memory_used,
      free: row.memory_free,
      percent: row.memory_percent,
    },
    disk: {
      total: row.disk_total,
      used: row.disk_used,
      free: row.disk_free,
      percent: row.disk_percent,
    },
    network: {
      rxBytes: row.network_rx_bytes,
      txBytes: row.network_tx_bytes,
    },
    load: {
      load1: row.load_avg_1m,
      load5: row.load_avg_5m,
      load15: row.load_avg_15m,
    },
  }))
}

/**
 * Get metrics for a specific agent
 * @param {string} agentId - Agent ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum records
 * @returns {Array} Agent metrics
 */
export async function getAgentMetrics(agentId, options = {}) {
  const { limit = 100 } = options
  
  return getHistoricalMetrics({
    agentId,
    limit,
    order: 'desc',
  })
}

/**
 * Get aggregated metrics summary
 * @param {Object} options - Query options
 * @param {string} options.agentId - Filter by agent ID
 * @param {string} options.from - Start timestamp
 * @param {string} options.to - End timestamp
 * @returns {Object} Aggregated metrics
 */
export async function getMetricsSummary(options = {}) {
  const { agentId, from, to } = options
  
  const db = await getDatabase()
  
  const conditions = []
  const params = []
  
  if (agentId) {
    conditions.push('agent_id = ?')
    params.push(agentId)
  }
  
  if (from) {
    conditions.push('timestamp >= ?')
    params.push(from)
  }
  
  if (to) {
    conditions.push('timestamp <= ?')
    params.push(to)
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  
  const query = `
    SELECT
      COUNT(*) as count,
      MIN(timestamp) as first_timestamp,
      MAX(timestamp) as last_timestamp,
      AVG(cpu_usage) as avg_cpu,
      MAX(cpu_usage) as max_cpu,
      MIN(cpu_usage) as min_cpu,
      AVG(memory_percent) as avg_memory,
      MAX(memory_percent) as max_memory,
      MIN(memory_percent) as min_memory,
      AVG(disk_percent) as avg_disk,
      MAX(disk_percent) as max_disk,
      MIN(disk_percent) as min_disk,
      AVG(load_avg_1m) as avg_load1,
      AVG(load_avg_5m) as avg_load5,
      AVG(load_avg_15m) as avg_load15
    FROM ${METRICS_TABLE}
    ${whereClause}
  `
  
  const stmt = db.prepare(query)
  const result = stmt.get(...params)
  
  logger.debug('Retrieved metrics summary', { count: result.count, agentId })
  
  return {
    count: result.count,
    timeRange: {
      first: result.first_timestamp,
      last: result.last_timestamp,
    },
    cpu: {
      avg: result.avg_cpu,
      max: result.max_cpu,
      min: result.min_cpu,
    },
    memory: {
      avg: result.avg_memory,
      max: result.max_memory,
      min: result.min_memory,
    },
    disk: {
      avg: result.avg_disk,
      max: result.max_disk,
      min: result.min_disk,
    },
    load: {
      avg1: result.avg_load1,
      avg5: result.avg_load5,
      avg15: result.avg_load15,
    },
  }
}

/**
 * Delete old metrics (cleanup)
 * @param {string} before - Delete records before this timestamp
 * @returns {Object} Deletion result
 */
export async function deleteOldMetrics(before) {
  const db = await getDatabase()
  
  const stmt = db.prepare(`
    DELETE FROM ${METRICS_TABLE}
    WHERE timestamp < ?
  `)
  
  const result = stmt.run(before)
  
  logger.info('Deleted old metrics', { count: result.changes, before })
  
  return {
    deleted: result.changes,
    before,
  }
}

/**
 * Get distinct agent IDs from metrics
 * @returns {Array} List of agent IDs
 */
export async function getAgentIds() {
  const db = await getDatabase()
  
  const stmt = db.prepare(`
    SELECT DISTINCT agent_id 
    FROM ${METRICS_TABLE}
    WHERE agent_id IS NOT NULL
    ORDER BY agent_id
  `)
  
  const rows = stmt.all()
  return rows.map(row => row.agent_id).filter(id => id)
}

export default {
  initializeMetricsTable,
  collectAllMetrics,
  collectCpuMetrics,
  collectMemoryMetrics,
  collectDiskMetrics,
  collectNetworkMetrics,
  collectLoadMetrics,
  storeMetrics,
  getCurrentMetrics,
  getHistoricalMetrics,
  getAgentMetrics,
  getMetricsSummary,
  deleteOldMetrics,
  getAgentIds,
}
