import { Router } from 'express';
import { getSystemStatus, getSystemHealth, getSystemMetrics } from '../controllers/system.controller';
import { generalLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

/**
 * @route   GET /api/system/status
 * @desc    Get basic system status
 * @access  Public
 */
router.get('/status', generalLimiter, getSystemStatus);

/**
 * @route   GET /api/system/health
 * @desc    Get detailed system health information
 * @access  Private (Admin)
 */
router.get('/health', generalLimiter, authenticate, getSystemHealth);

/**
 * @route   GET /api/system/metrics
 * @desc    Get system performance metrics
 * @access  Private (Admin)
 */
router.get('/metrics', generalLimiter, authenticate, getSystemMetrics);

export default router;
