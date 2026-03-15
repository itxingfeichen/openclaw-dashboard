/**
 * Alert Routes
 * API endpoints for alert management
 * 
 * Endpoints:
 * - GET    /api/alerts/rules          - Get all alert rules
 * - POST   /api/alerts/rules          - Create alert rule
 * - PUT    /api/alerts/rules/:id      - Update alert rule
 * - DELETE /api/alerts/rules/:id      - Delete alert rule
 * - GET    /api/alerts/history        - Get alert history
 * - POST   /api/alerts/acknowledge    - Acknowledge alert
 * - POST   /api/alerts/resolve        - Resolve alert
 * - POST   /api/alerts/trigger        - Manually trigger alert
 * - GET    /api/alerts/stats          - Get alert statistics
 */

import express from 'express';
import alertService from '../services/alertService.js';
import { logInfo, logError } from '../utils/logger.js';

const {
  AlertSeverity,
  AlertStatus,
  NotificationChannel,
  createAlertRuleService,
  getAlertRuleService,
  getAllAlertRulesService,
  updateAlertRuleService,
  deleteAlertRuleService,
  triggerAlertService,
  getAlertHistoryService,
  acknowledgeAlertService,
  resolveAlertService,
  getActiveAlertsCountService,
  evaluateAllRulesService,
} = alertService;

const router = express.Router();

/**
 * Validation middleware for alert rule creation
 */
function validateAlertRule(req, res, next) {
  const { name, condition, severity, channels, cooldown } = req.body;
  
  // Validate required fields
  if (!name || !name.trim()) {
    return res.status(400).json({
      error: 'Name is required',
      code: 'VALIDATION_ERROR',
    });
  }
  
  if (!condition || !condition.trim()) {
    return res.status(400).json({
      error: 'Condition is required',
      code: 'VALIDATION_ERROR',
    });
  }
  
  // Validate severity
  const validSeverities = Object.values(AlertSeverity);
  if (severity && !validSeverities.includes(severity)) {
    return res.status(400).json({
      error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`,
      code: 'VALIDATION_ERROR',
    });
  }
  
  // Validate channels
  const validChannels = Object.values(NotificationChannel);
  if (channels && !Array.isArray(channels)) {
    return res.status(400).json({
      error: 'Channels must be an array',
      code: 'VALIDATION_ERROR',
    });
  }
  
  if (channels) {
    const invalidChannels = channels.filter((c) => !validChannels.includes(c));
    if (invalidChannels.length > 0) {
      return res.status(400).json({
        error: `Invalid channels: ${invalidChannels.join(', ')}. Valid: ${validChannels.join(', ')}`,
        code: 'VALIDATION_ERROR',
      });
    }
  }
  
  // Validate cooldown
  if (cooldown !== undefined && (typeof cooldown !== 'number' || cooldown < 0)) {
    return res.status(400).json({
      error: 'Cooldown must be a non-negative number (seconds)',
      code: 'VALIDATION_ERROR',
    });
  }
  
  next();
}

/**
 * GET /api/alerts/rules
 * Get all alert rules with optional filtering
 * 
 * Query parameters:
 * - severity: Filter by severity (warning|critical|emergency)
 * - enabled: Filter by enabled status (true|false)
 * - limit: Max results (default: 100)
 * - offset: Offset for pagination (default: 0)
 */
router.get('/rules', async (req, res, next) => {
  try {
    const { severity, enabled, limit, offset } = req.query;
    
    const filters = {};
    
    if (severity) {
      filters.severity = severity;
    }
    
    if (enabled !== undefined) {
      filters.enabled = enabled === 'true';
    }
    
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }
    
    if (offset) {
      filters.offset = parseInt(offset, 10);
    }
    
    const rules = getAllAlertRulesService(filters);
    
    logInfo('Alert rules retrieved', { count: rules.length, filters });
    
    res.json({
      success: true,
      data: rules,
      count: rules.length,
    });
  } catch (error) {
    logError('Failed to get alert rules', error);
    next(error);
  }
});

/**
 * POST /api/alerts/rules
 * Create a new alert rule
 * 
 * Request body:
 * - name: Rule name (required)
 * - description: Rule description (optional)
 * - condition: Alert condition expression (required)
 * - severity: Alert severity (optional, default: warning)
 * - channels: Notification channels array (optional)
 * - cooldown: Cooldown period in seconds (optional, default: 300)
 * - enabled: Whether rule is enabled (optional, default: true)
 * - metadata: Additional metadata (optional)
 */
router.post('/rules', validateAlertRule, async (req, res, next) => {
  try {
    const ruleData = req.body;
    
    const rule = createAlertRuleService(ruleData);
    
    logInfo('Alert rule created', { id: rule.id, name: rule.name });
    
    res.status(201).json({
      success: true,
      data: rule,
      message: 'Alert rule created successfully',
    });
  } catch (error) {
    logError('Failed to create alert rule', error);
    
    if (error.code === 'INVALID_RULE_DATA') {
      return res.status(400).json({
        error: error.message,
        code: error.code,
      });
    }
    
    next(error);
  }
});

/**
 * PUT /api/alerts/rules/:id
 * Update an existing alert rule
 * 
 * Path parameters:
 * - id: Rule ID
 * 
 * Request body (all optional):
 * - name: Rule name
 * - description: Rule description
 * - condition: Alert condition expression
 * - severity: Alert severity
 * - channels: Notification channels array
 * - cooldown: Cooldown period in seconds
 * - enabled: Whether rule is enabled
 * - metadata: Additional metadata
 */
router.put('/rules/:id', validateAlertRule, async (req, res, next) => {
  try {
    const { id } = req.params;
    const ruleData = req.body;
    
    const rule = updateAlertRuleService(id, ruleData);
    
    if (!rule) {
      return res.status(404).json({
        error: 'Alert rule not found',
        code: 'RULE_NOT_FOUND',
      });
    }
    
    logInfo('Alert rule updated', { id });
    
    res.json({
      success: true,
      data: rule,
      message: 'Alert rule updated successfully',
    });
  } catch (error) {
    logError('Failed to update alert rule', error);
    
    if (error.code === 'RULE_NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    
    next(error);
  }
});

/**
 * DELETE /api/alerts/rules/:id
 * Delete an alert rule
 * 
 * Path parameters:
 * - id: Rule ID
 */
router.delete('/rules/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deleted = deleteAlertRuleService(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Alert rule not found',
        code: 'RULE_NOT_FOUND',
      });
    }
    
    logInfo('Alert rule deleted', { id });
    
    res.json({
      success: true,
      message: 'Alert rule deleted successfully',
    });
  } catch (error) {
    logError('Failed to delete alert rule', error);
    
    if (error.code === 'RULE_NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    
    next(error);
  }
});

/**
 * GET /api/alerts/history
 * Get alert history with filtering and pagination
 * 
 * Query parameters:
 * - rule_id: Filter by rule ID
 * - severity: Filter by severity
 * - status: Filter by status (active|acknowledged|resolved)
 * - from: Start date (ISO 8601)
 * - to: End date (ISO 8601)
 * - limit: Max results (default: 100)
 * - offset: Offset for pagination (default: 0)
 */
router.get('/history', async (req, res, next) => {
  try {
    const { rule_id, severity, status, from, to, limit, offset } = req.query;
    
    const filters = {};
    
    if (rule_id) {
      filters.rule_id = parseInt(rule_id, 10);
    }
    
    if (severity) {
      filters.severity = severity;
    }
    
    if (status) {
      filters.status = status;
    }
    
    if (from) {
      filters.from = from;
    }
    
    if (to) {
      filters.to = to;
    }
    
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }
    
    if (offset) {
      filters.offset = parseInt(offset, 10);
    }
    
    const history = getAlertHistoryService(filters);
    
    logInfo('Alert history retrieved', { 
      count: history.alerts.length, 
      total: history.pagination.total,
    });
    
    res.json({
      success: true,
      data: history.alerts,
      pagination: history.pagination,
    });
  } catch (error) {
    logError('Failed to get alert history', error);
    next(error);
  }
});

/**
 * POST /api/alerts/acknowledge
 * Acknowledge an active alert
 * 
 * Request body:
 * - alertId: Alert ID (required)
 * - acknowledgedBy: User who acknowledged (required)
 * - notes: Acknowledgment notes (optional)
 */
router.post('/acknowledge', async (req, res, next) => {
  try {
    const { alertId, acknowledgedBy, notes } = req.body;
    
    if (!alertId) {
      return res.status(400).json({
        error: 'Alert ID is required',
        code: 'VALIDATION_ERROR',
      });
    }
    
    if (!acknowledgedBy) {
      return res.status(400).json({
        error: 'AcknowledgedBy is required',
        code: 'VALIDATION_ERROR',
      });
    }
    
    const alert = acknowledgeAlertService(alertId, acknowledgedBy, notes);
    
    if (!alert) {
      return res.status(404).json({
        error: 'Alert not found or not active',
        code: 'ALERT_NOT_FOUND',
      });
    }
    
    logInfo('Alert acknowledged', { alertId, acknowledgedBy });
    
    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged successfully',
    });
  } catch (error) {
    logError('Failed to acknowledge alert', error);
    
    if (['ALERT_NOT_FOUND', 'ALERT_NOT_ACTIVE'].includes(error.code)) {
      return res.status(400).json({
        error: error.message,
        code: error.code,
      });
    }
    
    next(error);
  }
});

/**
 * POST /api/alerts/resolve
 * Resolve an alert
 * 
 * Request body:
 * - alertId: Alert ID (required)
 * - resolvedBy: User who resolved (required)
 * - notes: Resolution notes (optional)
 */
router.post('/resolve', async (req, res, next) => {
  try {
    const { alertId, resolvedBy, notes } = req.body;
    
    if (!alertId) {
      return res.status(400).json({
        error: 'Alert ID is required',
        code: 'VALIDATION_ERROR',
      });
    }
    
    if (!resolvedBy) {
      return res.status(400).json({
        error: 'ResolvedBy is required',
        code: 'VALIDATION_ERROR',
      });
    }
    
    const alert = resolveAlertService(alertId, resolvedBy, notes);
    
    if (!alert) {
      return res.status(404).json({
        error: 'Alert not found',
        code: 'ALERT_NOT_FOUND',
      });
    }
    
    logInfo('Alert resolved', { alertId, resolvedBy });
    
    res.json({
      success: true,
      data: alert,
      message: 'Alert resolved successfully',
    });
  } catch (error) {
    logError('Failed to resolve alert', error);
    
    if (error.code === 'ALERT_NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    
    next(error);
  }
});

/**
 * POST /api/alerts/trigger
 * Manually trigger an alert rule
 * 
 * Request body:
 * - ruleId: Rule ID (required)
 * - metrics: Metrics data for evaluation (required)
 * - triggeredBy: Who triggered the alert (optional)
 */
router.post('/trigger', async (req, res, next) => {
  try {
    const { ruleId, metrics, triggeredBy } = req.body;
    
    if (!ruleId) {
      return res.status(400).json({
        error: 'Rule ID is required',
        code: 'VALIDATION_ERROR',
      });
    }
    
    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({
        error: 'Metrics object is required',
        code: 'VALIDATION_ERROR',
      });
    }
    
    const alert = await triggerAlertService({
      ruleId,
      metrics,
      triggeredBy: triggeredBy || 'api',
    });
    
    if (!alert) {
      return res.json({
        success: true,
        data: null,
        message: 'Alert condition not met or suppressed by cooldown',
      });
    }
    
    logInfo('Alert manually triggered', { alertId: alert.id, ruleId });
    
    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert triggered successfully',
    });
  } catch (error) {
    logError('Failed to trigger alert', error);
    
    if (error.code === 'RULE_NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: error.code,
      });
    }
    
    next(error);
  }
});

/**
 * POST /api/alerts/evaluate
 * Evaluate all enabled rules against provided metrics
 * 
 * Request body:
 * - metrics: Metrics data for evaluation (required)
 */
router.post('/evaluate', async (req, res, next) => {
  try {
    const { metrics } = req.body;
    
    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({
        error: 'Metrics object is required',
        code: 'VALIDATION_ERROR',
      });
    }
    
    const triggeredAlerts = await evaluateAllRulesService(metrics);
    
    logInfo('All rules evaluated', { 
      triggeredCount: triggeredAlerts.length,
    });
    
    res.json({
      success: true,
      data: triggeredAlerts,
      count: triggeredAlerts.length,
    });
  } catch (error) {
    logError('Failed to evaluate rules', error);
    next(error);
  }
});

/**
 * GET /api/alerts/stats
 * Get alert statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = getActiveAlertsCountService();
    
    res.json({
      success: true,
      data: {
        active: stats,
        severity: AlertSeverity,
        status: AlertStatus,
        channels: NotificationChannel,
      },
    });
  } catch (error) {
    logError('Failed to get alert stats', error);
    next(error);
  }
});

export default router;
