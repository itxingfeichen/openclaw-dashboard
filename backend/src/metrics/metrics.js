/**
 * Prometheus Metrics Definition and Collection
 * @module metrics
 */

import client from 'prom-client'
import { createCollectors } from './collectors.js'

// Prometheus registry
export const register = new client.Registry()

// Add default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register })

// Custom metrics
export const metrics = {
  // HTTP Request metrics
  httpRequestDuration: new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5, 10],
  }),

  httpRequestTotal: new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  }),

  httpRequestsInFlight: new client.Gauge({
    name: 'http_requests_in_flight',
    help: 'Number of HTTP requests currently being processed',
    labelNames: ['method'],
  }),

  // API Response time
  apiResponseTime: new client.Histogram({
    name: 'api_response_time_milliseconds',
    help: 'API response time in milliseconds',
    labelNames: ['endpoint', 'method'],
    buckets: [1, 5, 10, 25, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000],
  }),

  // Database metrics
  dbQueryDuration: new client.Histogram({
    name: 'db_query_duration_milliseconds',
    help: 'Database query duration in milliseconds',
    labelNames: ['query_type', 'table'],
    buckets: [0.1, 0.5, 1, 5, 10, 25, 50, 100, 250, 500, 1000],
  }),

  dbQueryTotal: new client.Counter({
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['query_type', 'table'],
  }),

  // Cache metrics
  cacheHits: new client.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type'],
  }),

  cacheMisses: new client.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type'],
  }),

  cacheSize: new client.Gauge({
    name: 'cache_size_bytes',
    help: 'Current cache size in bytes',
    labelNames: ['cache_type'],
  }),

  // Error metrics
  errorTotal: new client.Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'severity'],
  }),

  // Business metrics
  activeUsers: new client.Gauge({
    name: 'active_users',
    help: 'Number of currently active users',
  }),

  // Custom collectors
  customMetrics: new client.Gauge({
    name: 'custom_metric_value',
    help: 'Custom application-specific metrics',
    labelNames: ['metric_name'],
  }),
}

// Register all custom metrics
Object.values(metrics).forEach((metric) => {
  register.registerMetric(metric)
})

// Create custom collectors
export const collectors = createCollectors(register)

/**
 * Get all metrics in Prometheus format
 * @returns {Promise<string>} Metrics in Prometheus exposition format
 */
export async function getMetrics() {
  return await register.metrics()
}

/**
 * Get metrics as JSON
 * @returns {Promise<Object>} Metrics as JSON object
 */
export async function getMetricsJSON() {
  const metricsData = await register.getMetricsAsJSON()
  return metricsData
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics() {
  register.clear()
}

export default {
  register,
  metrics,
  collectors,
  getMetrics,
  getMetricsJSON,
  resetMetrics,
}
