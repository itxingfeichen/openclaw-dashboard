/**
 * Audit Repository
 * Data access layer for audit logging
 */

import { getDatabase, prepare } from '../database/index.js';

/**
 * Create an audit log entry
 * @param {Object} logData - Audit log data
 * @param {number} [logData.userId] - User ID
 * @param {string} logData.action - Action performed
 * @param {string} [logData.resourceType] - Type of resource
 * @param {string} [logData.resourceId] - Resource ID
 * @param {string} [logData.oldValue] - Old value (JSON string)
 * @param {string} [logData.newValue] - New value (JSON string)
 * @param {string} [logData.ipAddress] - IP address
 * @param {string} [logData.userAgent] - User agent
 * @param {string} [logData.status='success'] - Status
 * @param {string} [logData.errorMessage] - Error message
 * @returns {Object} Created audit log
 */
export function createAuditLog(logData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      user_id, action, resource_type, resource_id,
      old_value, new_value, ip_address, user_agent,
      status, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    logData.userId || null,
    logData.action,
    logData.resourceType || null,
    logData.resourceId || null,
    logData.oldValue || null,
    logData.newValue || null,
    logData.ipAddress || null,
    logData.userAgent || null,
    logData.status || 'success',
    logData.errorMessage || null
  );
  
  return getAuditLogById(result.lastInsertRowid);
}

/**
 * Get audit log by ID
 * @param {number} id - Audit log ID
 * @returns {Object|null} Audit log or null
 */
export function getAuditLogById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM audit_logs WHERE id = ?');
  return stmt.get(id) || null;
}

/**
 * Get audit logs with pagination and filters
 * @param {Object} [options] - Query options
 * @param {number} [options.userId] - Filter by user ID
 * @param {string} [options.action] - Filter by action
 * @param {string} [options.resourceType] - Filter by resource type
 * @param {string} [options.status] - Filter by status
 * @param {Date} [options.startDate] - Filter by start date
 * @param {Date} [options.endDate] - Filter by end date
 * @param {number} [options.limit=50] - Max results
 * @param {number} [options.offset=0] - Offset
 * @param {string} [options.orderBy='created_at'] - Order by field
 * @param {string} [options.order='DESC'] - Order direction
 * @returns {Object[]} Array of audit logs
 */
export function getAuditLogs(options = {}) {
  const {
    userId,
    action,
    resourceType,
    status,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    order = 'DESC'
  } = options;
  
  const db = getDatabase();
  
  const whereClauses = [];
  const values = [];
  
  if (userId !== undefined) {
    whereClauses.push('user_id = ?');
    values.push(userId);
  }
  if (action !== undefined) {
    whereClauses.push('action = ?');
    values.push(action);
  }
  if (resourceType !== undefined) {
    whereClauses.push('resource_type = ?');
    values.push(resourceType);
  }
  if (status !== undefined) {
    whereClauses.push('status = ?');
    values.push(status);
  }
  if (startDate !== undefined) {
    whereClauses.push('created_at >= ?');
    values.push(startDate.toISOString());
  }
  if (endDate !== undefined) {
    whereClauses.push('created_at <= ?');
    values.push(endDate.toISOString());
  }
  
  const whereClause = whereClauses.length > 0
    ? 'WHERE ' + whereClauses.join(' AND ')
    : '';
  
  // Validate order by field to prevent SQL injection
  const allowedOrderBy = ['id', 'user_id', 'action', 'created_at', 'status'];
  const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'created_at';
  const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  const stmt = db.prepare(`
    SELECT * FROM audit_logs
    ${whereClause}
    ORDER BY ${safeOrderBy} ${safeOrder}
    LIMIT ? OFFSET ?
  `);
  
  return stmt.all(...values, limit, offset);
}

/**
 * Get audit logs for a specific user
 * @param {number} userId - User ID
 * @param {number} [limit=50] - Max results
 * @param {number} [offset=0] - Offset
 * @returns {Object[]} Array of audit logs
 */
export function getUserAuditLogs(userId, limit = 50, offset = 0) {
  return getAuditLogs({ userId, limit, offset });
}

/**
 * Get audit logs for a specific resource
 * @param {string} resourceType - Resource type
 * @param {string} resourceId - Resource ID
 * @param {number} [limit=50] - Max results
 * @param {number} [offset=0] - Offset
 * @returns {Object[]} Array of audit logs
 */
export function getResourceAuditLogs(resourceType, resourceId, limit = 50, offset = 0) {
  return getAuditLogs({ resourceType, resourceId, limit, offset });
}

/**
 * Get total audit log count
 * @param {Object} [filters] - Optional filters
 * @returns {number} Total count
 */
export function getAuditLogCount(filters = {}) {
  const db = getDatabase();
  
  const whereClauses = [];
  const values = [];
  
  if (filters.userId !== undefined) {
    whereClauses.push('user_id = ?');
    values.push(filters.userId);
  }
  if (filters.action !== undefined) {
    whereClauses.push('action = ?');
    values.push(filters.action);
  }
  if (filters.status !== undefined) {
    whereClauses.push('status = ?');
    values.push(filters.status);
  }
  
  const whereClause = whereClauses.length > 0
    ? 'WHERE ' + whereClauses.join(' AND ')
    : '';
  
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`);
  const result = stmt.get(...values);
  return result.count;
}

/**
 * Get audit statistics
 * @param {Date} [startDate] - Start date
 * @param {Date} [endDate] - End date
 * @returns {Object} Statistics
 */
export function getAuditStats(startDate, endDate) {
  const db = getDatabase();
  
  const whereClauses = [];
  const values = [];
  
  if (startDate !== undefined) {
    whereClauses.push('created_at >= ?');
    values.push(startDate.toISOString());
  }
  if (endDate !== undefined) {
    whereClauses.push('created_at <= ?');
    values.push(endDate.toISOString());
  }
  
  const whereClause = whereClauses.length > 0
    ? 'WHERE ' + whereClauses.join(' AND ')
    : '';
  
  // Total count
  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`);
  const total = totalStmt.get(...values).count;
  
  // Count by status
  const statusStmt = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM audit_logs
    ${whereClause}
    GROUP BY status
  `);
  const byStatus = statusStmt.all(...values);
  
  // Count by action
  const actionStmt = db.prepare(`
    SELECT action, COUNT(*) as count
    FROM audit_logs
    ${whereClause}
    GROUP BY action
    ORDER BY count DESC
    LIMIT 10
  `);
  const byAction = actionStmt.all(...values);
  
  // Count by user
  const userStmt = db.prepare(`
    SELECT user_id, COUNT(*) as count
    FROM audit_logs
    ${whereClause}
    GROUP BY user_id
    ORDER BY count DESC
    LIMIT 10
  `);
  const byUser = userStmt.all(...values);
  
  return {
    total,
    byStatus,
    byAction,
    byUser
  };
}

/**
 * Delete old audit logs
 * @param {Date} beforeDate - Delete logs before this date
 * @returns {number} Number of deleted logs
 */
export function deleteOldAuditLogs(beforeDate) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM audit_logs WHERE created_at < ?');
  const result = stmt.run(beforeDate.toISOString());
  return result.changes;
}

/**
 * Get recent audit logs
 * @param {number} [limit=20] - Max results
 * @returns {Object[]} Array of audit logs
 */
export function getRecentAuditLogs(limit = 20) {
  return getAuditLogs({ limit, order: 'DESC' });
}

export default {
  createAuditLog,
  getAuditLogById,
  getAuditLogs,
  getUserAuditLogs,
  getResourceAuditLogs,
  getAuditLogCount,
  getAuditStats,
  deleteOldAuditLogs,
  getRecentAuditLogs
};
