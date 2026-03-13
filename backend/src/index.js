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

// Import middleware
import { errorHandler, asyncHandler, notFoundHandler } from './middleware/error-handler.js'
import { logInfo, logRequest } from './utils/logger.js'

const app = express()
const PORT = process.env.PORT || 8080

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logRequest(req, res.statusCode, duration)
  })
  next()
})

// Routes
app.use('/api/health', healthRoutes)
app.use('/api', cliRoutes)

// Root endpoint
app.get('/', asyncHandler(async (req, res) => {
  res.json({
    name: 'OpenClaw Dashboard API',
    version: '0.1.0',
    status: 'running',
  })
}))

// 404 handler
app.use(notFoundHandler())

// Global error handler (must be last)
app.use(errorHandler())

// Start server
app.listen(PORT, () => {
  logInfo('Server started', {
    port: PORT,
    url: `http://localhost:${PORT}`,
    healthCheck: `http://localhost:${PORT}/api/health`,
  })
})
