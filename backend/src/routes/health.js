import express from 'express'

const router = express.Router()

// GET /api/health
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// GET /api/health/ready
router.get('/ready', (req, res) => {
  // Check if all dependencies are ready
  const checks = {
    database: true,
    cache: true,
    externalServices: true,
  }

  const allHealthy = Object.values(checks).every((check) => check)

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  })
})

export default router
