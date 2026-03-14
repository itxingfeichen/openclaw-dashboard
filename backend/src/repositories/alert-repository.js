/**
 * Alert Repository
 * Data access layer for alert management
 */

import { getDatabase } from '../database/index.js';

/**
 * Alert severity levels
 */
export const AlertSeverity = {
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
};

/**
 * Alert status values
 */
export const AlertStatus = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
};

/**
 * Notification channel types
 */
export const NotificationChannel = {
  EMAIL: 'email',
  DINGTALK: 'dingtalk',
  WECHAT_WORK: 'wechat_work',
};

/**
 * Create a new alert rule
 * @param {Object} ruleData - Alert rule data
 * @param {string} ruleData.name - Rule name
 * @param {string} ruleData.description - Rule description
 * @param {string} ruleData.condition - Alert condition expression
 * @param {string} ruleData.severity - Alert severity level
 * @param {string[]} ruleData.channels - Notification channels
 * @param {number} ruleData.cooldown - Cooldown period in seconds
 * @param {boolean} ruleData.enabled - Whether rule is enabled
 * @returns {Object} Created alert rule
 */
export function createAlertRule(ruleData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO alert_rules (
      name, description, condition, severity, 
      channels, cooldown, enabled, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  
  const result = stmt.run(
    ruleData.name,
    ruleData.description || null,
    ruleData.condition,
    ruleData.severity || AlertSeverity.WARNING,
    JSON.stringify(ruleData.channels || []),
    ruleData.cooldown || 300,
    ruleData.enabled !== undefined ? (ruleData.enabled ? 1 : 0) : 1
  );
  
  return getAlertRuleById(result.lastInsertRowid);
}

/**
 * Get alert rule by ID
 * @param {number} id - Alert rule ID
 * @returns {Object|null} Alert rule object or null
 */
export function getAlertRuleById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM alert_rules WHERE id = ?');
  const rule = stmt.get(id);
  return rule ? parseAlertRule(rule) : null;
}

/**
 * Get alert rule by name
 * @param {string} name - Alert rule name
 * @returns {Object|null} Alert rule object or null
 */
export function getAlertRuleByName(name) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM alert_rules WHERE name = ?');
  const rule = stmt.get(name);
  return rule ? parseAlertRule(rule) : null;
}

/**
 * Parse alert rule JSON fields
 * @param {Object} rule - Alert rule object
 * @returns {Object} Alert rule with parsed fields
 */
function parseAlertRule(rule) {
  if (rule && rule.channels) {
    try {
      rule.channels = JSON.parse(rule.channels);
    } catch (e) {
      rule.channels = [];
    }
  }
  if (rule && rule.metadata) {
    try {
      rule.metadata = JSON.parse(rule.metadata);
    } catch (e) {
      rule.metadata = null;
    }
  }
  rule.enabled = Boolean(rule.enabled);
  return rule;
}

/**
 * Get all alert rules with optional filtering
 * @param {Object} [filters] - Filter options
 * @param {string} [filters.severity] - Filter by severity
 * @param {boolean} [filters.enabled] - Filter by enabled status
 * @param {number} [filters.limit=100] - Max results
 * @param {number} [filters.offset=0] - Offset
 * @returns {Object[]} Array of alert rules
 */
export function getAllAlertRules(filters = {}) {
  const db = getDatabase();
  
  let where = [];
  let params = [];
  
  if (filters.severity) {
    where.push('severity = ?');
    params.push(filters.severity);
  }
  
  if (filters.enabled !== undefined) {
    where.push('enabled = ?');
    params.push(filters.enabled ? 1 : 0);
  }
  
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;
  
  const stmt = db.prepare(`
    SELECT * FROM alert_rules 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const rules = stmt.all(...params, limit, offset);
  return rules.map(parseAlertRule);
}

/**
 * Update alert rule
 * @param {number} id - Alert rule ID
 * @param {Object} ruleData - Updated rule data
 * @returns {Object|null} Updated alert rule or null
 */
export function updateAlertRule(id, ruleData) {
  const db = getDatabase();
  
  const fields = [];
  const params = [];
  
  if (ruleData.name !== undefined) {
    fields.push('name = ?');
    params.push(ruleData.name);
  }
  if (ruleData.description !== undefined) {
    fields.push('description = ?');
    params.push(ruleData.description);
  }
  if (ruleData.condition !== undefined) {
    fields.push('condition = ?');
    params.push(ruleData.condition);
  }
  if (ruleData.severity !== undefined) {
    fields.push('severity = ?');
    params.push(ruleData.severity);
  }
  if (ruleData.channels !== undefined) {
    fields.push('channels = ?');
    params.push(JSON.stringify(ruleData.channels));
  }
  if (ruleData.cooldown !== undefined) {
    fields.push('cooldown = ?');
    params.push(ruleData.cooldown);
  }
  if (ruleData.enabled !== undefined) {
    fields.push('enabled = ?');
    params.push(ruleData.enabled ? 1 : 0);
  }
  if (ruleData.metadata !== undefined) {
    fields.push('metadata = ?');
    params.push(JSON.stringify(ruleData.metadata));
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  const stmt = db.prepare(`
    UPDATE alert_rules 
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  const result = stmt.run(...params);
  
  if (result.changes === 0) {
    return null;
  }
  
  return getAlertRuleById(id);
}

/**
 * Delete alert rule
 * @param {number} id - Alert rule ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteAlertRule(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM alert_rules WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Create alert history record
 * @param {Object} alertData - Alert data
 * @param {number} alertData.rule_id - Alert rule ID
 * @param {string} alertData.title - Alert title
 * @param {string} alertData.message - Alert message
 * @param {string} alertData.severity - Alert severity
 * @param {Object} [alertData.context] - Alert context data
 * @returns {Object} Created alert record
 */
export function createAlertHistory(alertData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO alert_history (
      rule_id, title, message, severity, context, 
      status, triggered_at, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  
  const result = stmt.run(
    alertData.rule_id,
    alertData.title,
    alertData.message,
    alertData.severity,
    JSON.stringify(alertData.context || {}),
    AlertStatus.ACTIVE
  );
  
  return getAlertHistoryById(result.lastInsertRowid);
}

/**
 * Get alert history by ID
 * @param {number} id - Alert history ID
 * @returns {Object|null} Alert history object or null
 */
export function getAlertHistoryById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM alert_history WHERE id = ?');
  const alert = stmt.get(id);
  return alert ? parseAlertHistory(alert) : null;
}

/**
 * Parse alert history JSON fields
 * @param {Object} alert - Alert history object
 * @returns {Object} Alert history with parsed fields
 */
function parseAlertHistory(alert) {
  if (alert && alert.context) {
    try {
      alert.context = JSON.parse(alert.context);
    } catch (e) {
      alert.context = null;
    }
  }
  return alert;
}

/**
 * Get alert history with filtering and pagination
 * @param {Object} [filters] - Filter options
 * @param {number} [filters.rule_id] - Filter by rule ID
 * @param {string} [filters.severity] - Filter by severity
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.from] - Start date
 * @param {string} [filters.to] - End date
 * @param {number} [filters.limit=100] - Max results
 * @param {number} [filters.offset=0] - Offset
 * @returns {Object} Paginated alert history
 */
export function getAlertHistory(filters = {}) {
  const db = getDatabase();
  
  let where = [];
  let params = [];
  
  if (filters.rule_id) {
    where.push('rule_id = ?');
    params.push(filters.rule_id);
  }
  
  if (filters.severity) {
    where.push('severity = ?');
    params.push(filters.severity);
  }
  
  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  
  if (filters.from) {
    where.push('triggered_at >= ?');
    params.push(filters.from);
  }
  
  if (filters.to) {
    where.push('triggered_at <= ?');
    params.push(filters.to);
  }
  
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;
  
  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM alert_history ${whereClause}`);
  const { total } = countStmt.get(...params);
  
  // Get paginated results
  const stmt = db.prepare(`
    SELECT * FROM alert_history 
    ${whereClause}
    ORDER BY triggered_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const alerts = stmt.all(...params, limit, offset);
  
  return {
    alerts: alerts.map(parseAlertHistory),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + alerts.length < total,
    },
  };
}

/**
 * Acknowledge alert
 * @param {number} id - Alert history ID
 * @param {string} acknowledgedBy - User who acknowledged
 * @param {string} [notes] - Acknowledgment notes
 * @returns {Object|null} Updated alert or null
 */
export function acknowledgeAlert(id, acknowledgedBy, notes = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE alert_history 
    SET status = ?, 
        acknowledged_by = ?,
        acknowledged_at = CURRENT_TIMESTAMP,
        acknowledgment_notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = ?
  `);
  
  const result = stmt.run(
    AlertStatus.ACKNOWLEDGED,
    acknowledgedBy,
    notes,
    id,
    AlertStatus.ACTIVE
  );
  
  if (result.changes === 0) {
    return null;
  }
  
  return getAlertHistoryById(id);
}

/**
 * Resolve alert
 * @param {number} id - Alert history ID
 * @param {string} resolvedBy - User who resolved
 * @param {string} [notes] - Resolution notes
 * @returns {Object|null} Updated alert or null
 */
export function resolveAlert(id, resolvedBy, notes = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE alert_history 
    SET status = ?, 
        resolved_by = ?,
        resolved_at = CURRENT_TIMESTAMP,
        resolution_notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  const result = stmt.run(
    AlertStatus.RESOLVED,
    resolvedBy,
    notes,
    id
  );
  
  if (result.changes === 0) {
    return null;
  }
  
  return getAlertHistoryById(id);
}

/**
 * Get active alerts count by severity
 * @returns {Object} Count by severity
 */
export function getActiveAlertsCount() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT severity, COUNT(*) as count 
    FROM alert_history 
    WHERE status = ? 
    GROUP BY severity
  `);
  
  const results = stmt.all(AlertStatus.ACTIVE);
  
  const count = {
    [AlertSeverity.WARNING]: 0,
    [AlertSeverity.CRITICAL]: 0,
    [AlertSeverity.EMERGENCY]: 0,
    total: 0,
  };
  
  results.forEach((row) => {
    if (count[row.severity] !== undefined) {
      count[row.severity] = row.count;
      count.total += row.count;
    }
  });
  
  return count;
}

/**
 * Get last alert trigger time for rule (for cooldown)
 * @param {number} ruleId - Alert rule ID
 * @returns {string|null} Last trigger timestamp
 */
export function getLastAlertTriggerTime(ruleId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT triggered_at FROM alert_history 
    WHERE rule_id = ? 
    ORDER BY triggered_at DESC 
    LIMIT 1
  `);
  
  const result = stmt.get(ruleId);
  return result ? result.triggered_at : null;
}

export default {
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
};
