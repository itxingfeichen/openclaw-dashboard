import { Router } from 'express';
import {
  getDashboards,
  getDashboardById,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  getDashboardWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
} from '../controllers/dashboard.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createDashboardSchema,
  updateDashboardSchema,
  createWidgetSchema,
  updateWidgetSchema,
} from '../validators/dashboard.validator';
import { generalLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

// ===== Dashboard Routes =====

/**
 * @route   GET /api/dashboards
 * @desc    Get all dashboards for current user
 * @access  Private
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 */
router.get('/', generalLimiter, authenticate, getDashboards);

/**
 * @route   POST /api/dashboards
 * @desc    Create a new dashboard
 * @access  Private
 */
router.post('/', generalLimiter, authenticate, validateRequest(createDashboardSchema), createDashboard);

/**
 * @route   GET /api/dashboards/:id
 * @desc    Get dashboard by ID
 * @access  Private
 */
router.get('/:id', generalLimiter, authenticate, getDashboardById);

/**
 * @route   PUT /api/dashboards/:id
 * @desc    Update dashboard information
 * @access  Private
 */
router.put('/:id', generalLimiter, authenticate, validateRequest(updateDashboardSchema), updateDashboard);

/**
 * @route   DELETE /api/dashboards/:id
 * @desc    Delete dashboard
 * @access  Private
 */
router.delete('/:id', generalLimiter, authenticate, deleteDashboard);

// ===== Widget Routes (nested under dashboard) =====

/**
 * @route   GET /api/dashboards/:id/widgets
 * @desc    Get all widgets for a dashboard
 * @access  Private
 */
router.get('/:id/widgets', generalLimiter, authenticate, getDashboardWidgets);

/**
 * @route   POST /api/dashboards/:id/widgets
 * @desc    Create a new widget in dashboard
 * @access  Private
 */
router.post('/:id/widgets', generalLimiter, authenticate, validateRequest(createWidgetSchema), createWidget);

/**
 * @route   PUT /api/dashboards/:dashboardId/widgets/:widgetId
 * @desc    Update widget configuration
 * @access  Private
 */
router.put('/:dashboardId/widgets/:widgetId', generalLimiter, authenticate, validateRequest(updateWidgetSchema), updateWidget);

/**
 * @route   DELETE /api/dashboards/:dashboardId/widgets/:widgetId
 * @desc    Delete widget from dashboard
 * @access  Private
 */
router.delete('/:dashboardId/widgets/:widgetId', generalLimiter, authenticate, deleteWidget);

export default router;
