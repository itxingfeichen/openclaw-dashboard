import { Router } from 'express';
import {
  getDashboardConfig,
  updateDashboardConfig,
} from '../controllers/dashboard.controller';
import { validateRequest } from '../middleware/validateRequest';
import { dashboardConfigSchema } from '../validators/dashboard.validator';
import { generalLimiter } from '../middleware/rateLimiter';

const router: Router = Router();

/**
 * @route   GET /api/dashboard/config
 * @desc    Get dashboard configuration
 * @access  Private
 */
router.get('/config', generalLimiter, getDashboardConfig);

/**
 * @route   PUT /api/dashboard/config
 * @desc    Update dashboard configuration
 * @access  Private
 */
router.put('/config', generalLimiter, validateRequest(dashboardConfigSchema), updateDashboardConfig);

export default router;
