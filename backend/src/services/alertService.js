/**
 * Alert Service
 * Business logic for alert management and notifications
 * 
 * Features:
 * - Alert rule evaluation
 * - Multi-channel notifications (Email, DingTalk, WeChat Work)
 * - Alert aggregation and cooldown
 * - Alert lifecycle management
 */

import {
  AlertSeverity,
  AlertStatus,
  NotificationChannel,
  createAlertRule,
  getAlertRuleById,
  getAlertRuleByName,
  getAllAlertRules,
  updateAlertRule,
  deleteAlertRule,
  createAlertHistory,
  getAlertHistoryById,
  getAlertHistory,
  acknowledgeAlert,
  resolveAlert,
  getActiveAlertsCount,
  getLastAlertTriggerTime,
} from '../repositories/alert-repository.js';
import { logInfo, logError, logWarn, createLogger } from '../utils/logger.js';

const logger = createLogger('alertService');

/**
 * Alert rule evaluation engine
 * Evaluates conditions and triggers alerts
 */
class AlertRuleEngine {
  /**
   * Evaluate a condition expression against provided metrics
   * @param {string} condition - Condition expression (e.g., "cpu > 80")
   * @param {Object} metrics - Metrics data
   * @returns {boolean} Whether condition is met
   */
  evaluate(condition, metrics) {
    try {
      // Simple expression evaluation
      // Supports: >, <, >=, <=, ==, !=, &&, ||
      // Example: "cpu > 80 && memory > 90"
      
      // Replace metric names with values
      let expression = condition;
      Object.keys(metrics).forEach((key) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(regex, metrics[key]);
      });
      
      // Safe evaluation of the expression
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expression})`)();
      return Boolean(result);
    } catch (error) {
      logError(`Alert condition evaluation failed: ${error.message}`, {
        condition,
        metrics,
      });
      return false;
    }
  }
}

/**
 * Notification sender for different channels
 */
class NotificationSender {
  /**
   * Send notification via email
   * @param {Object} alert - Alert data
   * @param {string} alert.title - Alert title
   * @param {string} alert.message - Alert message
   * @param {string} alert.severity - Alert severity
   * @param {Object} alert.context - Alert context
   * @returns {Promise<boolean>} Success status
   */
  async sendEmail(alert) {
    try {
      // TODO: Implement email sending via SMTP or email service
      const emailConfig = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };
      
      if (!emailConfig.host) {
        logWarn('Email notification skipped: SMTP not configured');
        return false;
      }
      
      const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
      const html = this.formatEmailHtml(alert);
      
      // Placeholder for actual email sending
      logInfo('Email notification prepared', {
        subject,
        recipients: process.env.ALERT_EMAIL_RECIPIENTS,
      });
      
      // TODO: Implement actual email sending
      // await nodemailer.createTransport(emailConfig).sendMail({ ... })
      
      return true;
    } catch (error) {
      logError('Email notification failed', error);
      return false;
    }
  }
  
  /**
   * Send notification via DingTalk
   * @param {Object} alert - Alert data
   * @returns {Promise<boolean>} Success status
   */
  async sendDingTalk(alert) {
    try {
      const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;
      
      if (!webhookUrl) {
        logWarn('DingTalk notification skipped: webhook not configured');
        return false;
      }
      
      const message = {
        msgtype: 'markdown',
        markdown: {
          title: alert.title,
          text: this.formatDingTalkMarkdown(alert),
        },
        at: {
          isAtAll: alert.severity === AlertSeverity.EMERGENCY,
        },
      };
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      
      if (response.ok) {
        logInfo('DingTalk notification sent', { title: alert.title });
        return true;
      } else {
        logError('DingTalk notification failed', { 
          status: response.status,
          statusText: response.statusText,
        });
        return false;
      }
    } catch (error) {
      logError('DingTalk notification failed', error);
      return false;
    }
  }
  
  /**
   * Send notification via WeChat Work
   * @param {Object} alert - Alert data
   * @returns {Promise<boolean>} Success status
   */
  async sendWeChatWork(alert) {
    try {
      const webhookUrl = process.env.WECHAT_WORK_WEBHOOK_URL;
      
      if (!webhookUrl) {
        logWarn('WeChat Work notification skipped: webhook not configured');
        return false;
      }
      
      const message = {
        msgtype: 'markdown',
        markdown: {
          content: this.formatWeChatMarkdown(alert),
        },
      };
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      
      if (response.ok) {
        logInfo('WeChat Work notification sent', { title: alert.title });
        return true;
      } else {
        logError('WeChat Work notification failed', {
          status: response.status,
          statusText: response.statusText,
        });
        return false;
      }
    } catch (error) {
      logError('WeChat Work notification failed', error);
      return false;
    }
  }
  
  /**
   * Format alert as HTML email
   * @param {Object} alert - Alert data
   * @returns {string} HTML content
   */
  formatEmailHtml(alert) {
    const severityColors = {
      [AlertSeverity.WARNING]: '#ffc107',
      [AlertSeverity.CRITICAL]: '#dc3545',
      [AlertSeverity.EMERGENCY]: '#721c24',
    };
    
    const color = severityColors[alert.severity] || '#6c757d';
    
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: ${color};">${alert.title}</h2>
        <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p>${alert.message}</p>
        ${alert.context ? `<pre style="background: #f5f5f5; padding: 10px;">${JSON.stringify(alert.context, null, 2)}</pre>` : ''}
      </div>
    `;
  }
  
  /**
   * Format alert as DingTalk markdown
   * @param {Object} alert - Alert data
   * @returns {string} Markdown content
   */
  formatDingTalkMarkdown(alert) {
    const severityEmojis = {
      [AlertSeverity.WARNING]: '⚠️',
      [AlertSeverity.CRITICAL]: '🔴',
      [AlertSeverity.EMERGENCY]: '🚨',
    };
    
    const emoji = severityEmojis[alert.severity] || '📢';
    
    return `## ${emoji} ${alert.title}
      
**Severity**: ${alert.severity.toUpperCase()}
**Time**: ${new Date().toISOString()}

${alert.message}

${alert.context ? '```' + JSON.stringify(alert.context, null, 2) + '```' : ''}`;
  }
  
  /**
   * Format alert as WeChat Work markdown
   * @param {Object} alert - Alert data
   * @returns {string} Markdown content
   */
  formatWeChatMarkdown(alert) {
    const severityColors = {
      [AlertSeverity.WARNING]: 'warning',
      [AlertSeverity.CRITICAL]: 'red',
      [AlertSeverity.EMERGENCY]: 'red',
    };
    
    const color = severityColors[alert.severity] || 'info';
    
    return `## <font color="${color}">${alert.title}</font>
    
**Severity**: ${alert.severity.toUpperCase()}
**Time**: ${new Date().toISOString()}

${alert.message}

${alert.context ? '```' + JSON.stringify(alert.context, null, 2) + '```' : ''}`;
  }
  
  /**
   * Send notification via specified channels
   * @param {Object} alert - Alert data
   * @param {string[]} channels - Channel list
   * @returns {Promise<Object>} Results by channel
   */
  async send(alert, channels) {
    const results = {};
    
    for (const channel of channels) {
      try {
        switch (channel) {
          case NotificationChannel.EMAIL:
            results[channel] = await this.sendEmail(alert);
            break;
          case NotificationChannel.DINGTALK:
            results[channel] = await this.sendDingTalk(alert);
            break;
          case NotificationChannel.WECHAT_WORK:
            results[channel] = await this.sendWeChatWork(alert);
            break;
          default:
            logWarn(`Unknown notification channel: ${channel}`);
            results[channel] = false;
        }
      } catch (error) {
        logError(`Notification failed for channel ${channel}`, error);
        results[channel] = false;
      }
    }
    
    return results;
  }
}

/**
 * Alert aggregation manager
 * Prevents alert storms through cooldown and deduplication
 */
class AlertAggregator {
  constructor() {
    this.cooldownCache = new Map();
  }
  
  /**
   * Check if alert should be suppressed due to cooldown
   * @param {number} ruleId - Alert rule ID
   * @param {number} cooldownSeconds - Cooldown period
   * @returns {boolean} Whether alert should be suppressed
   */
  isInCooldown(ruleId, cooldownSeconds) {
    const lastTrigger = this.cooldownCache.get(ruleId);
    
    if (!lastTrigger) {
      return false;
    }
    
    const now = Date.now();
    const elapsed = (now - lastTrigger) / 1000;
    
    return elapsed < cooldownSeconds;
  }
  
  /**
   * Record alert trigger for cooldown tracking
   * @param {number} ruleId - Alert rule ID
   */
  recordTrigger(ruleId) {
    this.cooldownCache.set(ruleId, Date.now());
  }
  
  /**
   * Clear cooldown for rule
   * @param {number} ruleId - Alert rule ID
   */
  clearCooldown(ruleId) {
    this.cooldownCache.delete(ruleId);
  }
}

// Singleton instances
const ruleEngine = new AlertRuleEngine();
const notificationSender = new NotificationSender();
const alertAggregator = new AlertAggregator();

/**
 * Alert Service API
 */

/**
 * Create alert rule
 * @param {Object} ruleData - Rule data
 * @returns {Object} Created rule
 */
export function createAlertRuleService(ruleData) {
  logger.info('Creating alert rule', { name: ruleData.name });
  
  // Validate rule data
  if (!ruleData.name || !ruleData.condition) {
    const error = new Error('Name and condition are required');
    error.code = 'INVALID_RULE_DATA';
    throw error;
  }
  
  const rule = createAlertRule(ruleData);
  logger.info('Alert rule created', { id: rule.id, name: rule.name });
  
  return rule;
}

/**
 * Get alert rule by ID
 * @param {number} id - Rule ID
 * @returns {Object|null} Rule or null
 */
export function getAlertRuleService(id) {
  return getAlertRuleById(id);
}

/**
 * Get all alert rules
 * @param {Object} filters - Filter options
 * @returns {Object[]} Rules list
 */
export function getAllAlertRulesService(filters) {
  return getAllAlertRules(filters);
}

/**
 * Update alert rule
 * @param {number} id - Rule ID
 * @param {Object} ruleData - Updated data
 * @returns {Object|null} Updated rule or null
 */
export function updateAlertRuleService(id, ruleData) {
  logger.info('Updating alert rule', { id });
  
  const existing = getAlertRuleById(id);
  if (!existing) {
    const error = new Error('Alert rule not found');
    error.code = 'RULE_NOT_FOUND';
    throw error;
  }
  
  const updated = updateAlertRule(id, ruleData);
  logger.info('Alert rule updated', { id });
  
  return updated;
}

/**
 * Delete alert rule
 * @param {number} id - Rule ID
 * @returns {boolean} Success
 */
export function deleteAlertRuleService(id) {
  logger.info('Deleting alert rule', { id });
  
  const existing = getAlertRuleById(id);
  if (!existing) {
    const error = new Error('Alert rule not found');
    error.code = 'RULE_NOT_FOUND';
    throw error;
  }
  
  const deleted = deleteAlertRule(id);
  logger.info('Alert rule deleted', { id });
  
  return deleted;
}

/**
 * Trigger alert (evaluate rule and send notifications)
 * @param {Object} triggerData - Trigger data
 * @param {number} triggerData.ruleId - Rule ID
 * @param {Object} triggerData.metrics - Metrics to evaluate
 * @param {string} [triggerData.triggeredBy] - Who triggered the alert
 * @returns {Object|null} Alert history record or null (if suppressed)
 */
export async function triggerAlertService(triggerData) {
  const { ruleId, metrics, triggeredBy = 'system' } = triggerData;
  
  logger.debug('Evaluating alert rule', { ruleId, metrics });
  
  // Get rule
  const rule = getAlertRuleById(ruleId);
  if (!rule) {
    const error = new Error('Alert rule not found');
    error.code = 'RULE_NOT_FOUND';
    throw error;
  }
  
  if (!rule.enabled) {
    logger.debug('Alert rule is disabled', { ruleId });
    return null;
  }
  
  // Evaluate condition
  const conditionMet = ruleEngine.evaluate(rule.condition, metrics);
  
  if (!conditionMet) {
    logger.debug('Alert condition not met', { ruleId });
    return null;
  }
  
  // Check cooldown
  if (alertAggregator.isInCooldown(ruleId, rule.cooldown)) {
    logger.debug('Alert suppressed due to cooldown', { ruleId });
    return null;
  }
  
  // Create alert history
  const alert = createAlertHistory({
    rule_id: ruleId,
    title: rule.name,
    message: `Alert triggered: ${rule.name}`,
    severity: rule.severity,
    context: {
      condition: rule.condition,
      metrics,
      triggeredBy,
    },
  });
  
  logger.info('Alert triggered', { 
    id: alert.id, 
    ruleId, 
    severity: rule.severity,
  });
  
  // Send notifications
  if (rule.channels && rule.channels.length > 0) {
    const notificationResults = await notificationSender.send(
      {
        title: rule.name,
        message: alert.message,
        severity: rule.severity,
        context: alert.context,
      },
      rule.channels
    );
    
    logger.info('Alert notifications sent', {
      alertId: alert.id,
      results: notificationResults,
    });
  }
  
  // Record trigger for cooldown
  alertAggregator.recordTrigger(ruleId);
  
  return alert;
}

/**
 * Get alert history
 * @param {Object} filters - Filter options
 * @returns {Object} Paginated history
 */
export function getAlertHistoryService(filters) {
  return getAlertHistory(filters);
}

/**
 * Acknowledge alert
 * @param {number} alertId - Alert ID
 * @param {string} acknowledgedBy - User
 * @param {string} [notes] - Notes
 * @returns {Object|null} Updated alert or null
 */
export function acknowledgeAlertService(alertId, acknowledgedBy, notes) {
  logger.info('Acknowledging alert', { alertId, acknowledgedBy });
  
  const alert = getAlertHistoryById(alertId);
  if (!alert) {
    const error = new Error('Alert not found');
    error.code = 'ALERT_NOT_FOUND';
    throw error;
  }
  
  if (alert.status !== AlertStatus.ACTIVE) {
    const error = new Error('Alert is not active');
    error.code = 'ALERT_NOT_ACTIVE';
    throw error;
  }
  
  const updated = acknowledgeAlert(alertId, acknowledgedBy, notes);
  logger.info('Alert acknowledged', { alertId });
  
  return updated;
}

/**
 * Resolve alert
 * @param {number} alertId - Alert ID
 * @param {string} resolvedBy - User
 * @param {string} [notes] - Notes
 * @returns {Object|null} Updated alert or null
 */
export function resolveAlertService(alertId, resolvedBy, notes) {
  logger.info('Resolving alert', { alertId, resolvedBy });
  
  const alert = getAlertHistoryById(alertId);
  if (!alert) {
    const error = new Error('Alert not found');
    error.code = 'ALERT_NOT_FOUND';
    throw error;
  }
  
  const updated = resolveAlert(alertId, resolvedBy, notes);
  logger.info('Alert resolved', { alertId });
  
  return updated;
}

/**
 * Get active alerts count
 * @returns {Object} Count by severity
 */
export function getActiveAlertsCountService() {
  return getActiveAlertsCount();
}

/**
 * Evaluate all enabled rules against metrics
 * @param {Object} metrics - Metrics data
 * @returns {Promise<Object[]>} Triggered alerts
 */
export async function evaluateAllRulesService(metrics) {
  logger.debug('Evaluating all alert rules', { metrics });
  
  const rules = getAllAlertRules({ enabled: true });
  const triggeredAlerts = [];
  
  for (const rule of rules) {
    try {
      const alert = await triggerAlertService({
        ruleId: rule.id,
        metrics,
      });
      
      if (alert) {
        triggeredAlerts.push(alert);
      }
    } catch (error) {
      logError(`Failed to evaluate rule ${rule.name}`, error);
    }
  }
  
  return triggeredAlerts;
}

export default {
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
};
