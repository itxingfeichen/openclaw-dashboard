import { Router } from 'express';
import { getSystemStatus } from '../controllers/system.controller';
import { generalLimiter } from '../middleware/rateLimiter';

const router: Router = Router();

/**
 * @route   GET /api/system/status
 * @desc    Get system status and health information
 * @access  Public
 */
router.get('/status', generalLimiter, getSystemStatus);

export default router;
