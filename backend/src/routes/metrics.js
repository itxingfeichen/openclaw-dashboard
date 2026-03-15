/**
 * Metrics API Routes
 * Provides endpoints for system resource monitoring
 * @module routes/metrics
 */

import express from 'express'
import {
  getCurrentMetrics,
  getHistoricalMetrics,
  getAgentMetrics,
  getMetricsSummary,
  initializeMetricsTable,
} from '../services/metricsService.js'
import { logInfo, logError } from '../utils/logger.js'

const router = express.Router()

/**
 * Initialize metrics table on module load
 */
initializeMetricsTable().catch((error) => {
  logError('Failed to initialize metrics table', error)
})

/**
 * GET /api/metrics/current
 * Get current system resource usage
 * 
 * Query Parameters:
 * - agentId (optional): Associate metrics with an agent
 * 
 * @returns {Object} Current system metrics
 */
router.get('/current', async (req, res) => {
  try {
    const { agentId } = req.query
    
    logInfo('Fetching current metrics', { agentId })
    
    const metrics = await getCurrentMetrics(agentId || null)
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logError('Failed to get current metrics', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve current metrics',
      message: error.message,
    })
  }
})

/**
 * GET /api/metrics/history
 * Get historical metrics data
 * 
 * Query Parameters:
 * - agentId (optional): Filter by agent ID
 * - from (optional): Start timestamp (ISO 8601)
 * - to (optional): End timestamp (ISO 8601)
 * - limit (optional): Maximum records to return (default: 100)
 * - order (optional): Sort order - 'asc' or 'desc' (default: 'desc')
 * 
 * @returns {Array} Historical metrics data
 */
router.get('/history', async (req, res) => {
  try {
    const {
      agentId,
      from,
      to,
      limit = 100,
      order = 'desc',
    } = req.query
    
    // Validate and parse parameters
    const parsedLimit = parseInt(limit, 10)
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter',
        message: 'limit must be a positive integer',
      })
    }
    
    if (!['asc', 'desc'].includes(order.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order parameter',
        message: 'order must be "asc" or "desc"',
      })
    }
    
    logInfo('Fetching historical metrics', {
      agentId,
      from,
      to,
      limit: parsedLimit,
      order,
    })
    
    const metrics = await getHistoricalMetrics({
      agentId: agentId || null,
      from,
      to,
      limit: parsedLimit,
      order,
    })
    
    res.json({
      success: true,
      data: metrics,
      count: metrics.length,
      filters: {
        agentId,
        from,
        to,
        limit: parsedLimit,
        order,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logError('Failed to get historical metrics', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve historical metrics',
      message: error.message,
    })
  }
})

/**
 * GET /api/metrics/agent/:agentId
 * Get metrics for a specific agent
 * 
 * Path Parameters:
 * - agentId: Agent identifier
 * 
 * Query Parameters:
 * - limit (optional): Maximum records to return (default: 100)
 * 
 * @returns {Array} Agent-specific metrics
 */
router.get('/agent/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params
    const { limit = 100 } = req.query
    
    // Validate agentId - check for empty or missing value
    if (!agentId || agentId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required',
      })
    }
    
    // Validate limit parameter
    const parsedLimit = parseInt(limit, 10)
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter',
        message: 'limit must be a positive integer',
      })
    }
    
    logInfo('Fetching agent metrics', { agentId, limit: parsedLimit })
    
    const metrics = await getAgentMetrics(agentId, {
      limit: parsedLimit,
    })
    
    res.json({
      success: true,
      data: metrics,
      agentId,
      count: metrics.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logError('Failed to get agent metrics', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent metrics',
      message: error.message,
    })
  }
})

/**
 * GET /api/metrics/summary
 * Get aggregated metrics summary
 * 
 * Query Parameters:
 * - agentId (optional): Filter by agent ID
 * - from (optional): Start timestamp (ISO 8601)
 * - to (optional): End timestamp (ISO 8601)
 * 
 * @returns {Object} Aggregated metrics summary
 */
router.get('/summary', async (req, res) => {
  try {
    const { agentId, from, to } = req.query
    
    logInfo('Fetching metrics summary', { agentId, from, to })
    
    const summary = await getMetricsSummary({
      agentId: agentId || null,
      from,
      to,
    })
    
    res.json({
      success: true,
      data: summary,
      filters: {
        agentId,
        from,
        to,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logError('Failed to get metrics summary', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics summary',
      message: error.message,
    })
  }
})

/**
 * Error handling middleware for metrics routes
 */
router.use((error, req, res, next) => {
  logError('Metrics route error', error)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message,
  })
})

export default router
