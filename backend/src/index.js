import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import routes
import healthRoutes from './routes/health.js'
import cliRoutes from './routes/cli.js'
import agentControlRoutes from './routes/agents.js'
import agentCreateRoutes from './routes/agent-create.js'
import logRoutes from './routes/logs.js'
import taskRoutes from './routes/tasks.js'

// Import middleware
import { errorHandler, asyncHandler, notFoundHandler } from './middleware/error-handler.js'
import { createMetricsMiddleware } from './metrics/middleware.js'
import { logInfo, logRequest } from './utils/logger.js'
import { getPerformanceMonitor } from './utils/performance-monitor.js'

const app = express()
const PORT = process.env.PORT || 3000

// Initialize performance monitor
const performanceMonitor = getPerformanceMonitor({
  slowQueryThreshold: 1000,
  enableMemoryLeakDetection: true,
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Metrics collection middleware
app.use(createMetricsMiddleware({
  trackResponseTime: true,
  trackInFlight: true,
  logSlowRequests: true,
  slowRequestThreshold: 1000,
}))

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const route = req.route?.path || req.path
    
    // Log request
    logRequest(req, res.statusCode, duration)
    
    // Record performance metrics
    performanceMonitor.recordResponseTime(route, req.method, duration)
  })
  next()
})

// Routes
app.use('/api/health', healthRoutes)
app.use('/api', cliRoutes)
app.use('/api/agents', agentControlRoutes)
app.use('/api/agents', agentCreateRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/tasks', taskRoutes)

// Root endpoint
app.get('/', asyncHandler(async (req, res) => {
  res.json({
    name: 'OpenClaw Dashboard API',
    version: '0.1.0',
    status: 'running',
    healthCheck: '/api/health',
    metrics: '/api/health/metrics',
    logs: '/api/logs',
  })
}))

// 404 handler
app.use(notFoundHandler())

// Global error handler (must be last)
app.use(errorHandler())

// Handle performance monitor events
performanceMonitor.on('slowResponse', (data) => {
  logInfo('Slow response detected', data)
})

performanceMonitor.on('slowQuery', (data) => {
  logInfo('Slow query detected', data)
})

performanceMonitor.on('memoryLeakWarning', (data) => {
  logInfo('Memory leak warning', data)
})

// Graceful shutdown
let server

process.on('SIGTERM', () => {
  logInfo('SIGTERM received, shutting down gracefully')
  if (server) {
    server.close(() => {
      logInfo('Server closed')
      performanceMonitor.stop()
      process.exit(0)
    })
    
    // Force close after 10 seconds
    setTimeout(() => {
      logInfo('Forcing shutdown')
      performanceMonitor.stop()
      process.exit(1)
    }, 10000)
  } else {
    process.exit(0)
  }
})

process.on('SIGINT', () => {
  logInfo('SIGINT received, shutting down gracefully')
  if (server) {
    server.close(() => {
      logInfo('Server closed')
      performanceMonitor.stop()
      process.exit(0)
    })
  } else {
    process.exit(0)
  }
})

// Start server
server = app.listen(PORT, () => {
  logInfo('Server started', {
    port: PORT,
    url: `http://localhost:${PORT}`,
    healthCheck: `http://localhost:${PORT}/api/health`,
    metrics: `http://localhost:${PORT}/api/health/metrics`,
  })
})

export default app
