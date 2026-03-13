/**
 * Session Repository
 * Data access layer for session management
 */

import { getDatabase, prepare } from '../database/index.js';

/**
 * Create a new session
 * @param {Object} sessionData - Session data
 * @param {number} sessionData.userId - User ID
 * @param {string} sessionData.token - Session token
 * @param {Date} sessionData.expiresAt - Expiration date
 * @param {string} [sessionData.ipAddress] - IP address
 * @param {string} [sessionData.userAgent] - User agent
 * @returns {Object} Created session
 */
export function createSession(sessionData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const expiresAt = sessionData.expiresAt instanceof Date 
    ? sessionData.expiresAt.toISOString()
    : sessionData.expiresAt;
  
  const result = stmt.run(
    sessionData.userId,
    sessionData.token,
    expiresAt,
    sessionData.ipAddress || null,
    sessionData.userAgent || null
  );
  
  return getSessionById(result.lastInsertRowid);
}

/**
 * Get session by ID
 * @param {number} id - Session ID
 * @returns {Object|null} Session or null
 */
export function getSessionById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return stmt.get(id) || null;
}

/**
 * Get session by token
 * @param {string} token - Session token
 * @returns {Object|null} Session or null
 */
export function getSessionByToken(token) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM sessions WHERE token = ?');
  return stmt.get(token) || null;
}

/**
 * Get all active sessions for a user
 * @param {number} userId - User ID
 * @returns {Object[]} Array of sessions
 */
export function getUserSessions(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM sessions
    WHERE user_id = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
  `);
  return stmt.all(userId);
}

/**
 * Get all active sessions count for a user
 * @param {number} userId - User ID
 * @returns {number} Session count
 */
export function getUserSessionCount(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM sessions
    WHERE user_id = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP
  `);
  const result = stmt.get(userId);
  return result.count;
}

/**
 * Update session
 * @param {number} id - Session ID
 * @param {Object} sessionData - Session data to update
 * @returns {Object|null} Updated session or null
 */
export function updateSession(id, sessionData) {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (sessionData.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(sessionData.isActive ? 1 : 0);
  }
  if (sessionData.expiresAt !== undefined) {
    fields.push('expires_at = ?');
    values.push(sessionData.expiresAt.toISOString());
  }
  
  if (fields.length === 0) {
    return getSessionById(id);
  }
  
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE sessions SET ${fields.join(', ')} WHERE id = ?
  `);
  
  stmt.run(...values);
  return getSessionById(id);
}

/**
 * Invalidate session (mark as inactive)
 * @param {number} id - Session ID
 * @returns {Object|null} Updated session or null
 */
export function invalidateSession(id) {
  return updateSession(id, { isActive: false });
}

/**
 * Invalidate session by token
 * @param {string} token - Session token
 * @returns {boolean} Success status
 */
export function invalidateSessionByToken(token) {
  const session = getSessionByToken(token);
  if (!session) {
    return false;
  }
  return invalidateSession(session.id);
}

/**
 * Revoke session by token (alias for invalidateSessionByToken)
 * @param {string} token - Session token
 * @returns {boolean} Success status
 */
export function revokeSession(token) {
  return invalidateSessionByToken(token);
}

/**
 * Invalidate all sessions for a user
 * @param {number} userId - User ID
 * @returns {number} Number of invalidated sessions
 */
export function invalidateAllUserSessions(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE sessions SET is_active = 0 WHERE user_id = ?
  `);
  const result = stmt.run(userId);
  return result.changes;
}

/**
 * Delete session
 * @param {number} id - Session ID
 * @returns {boolean} Success status
 */
export function deleteSession(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Delete expired sessions
 * @returns {number} Number of deleted sessions
 */
export function deleteExpiredSessions() {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP
  `);
  const result = stmt.run();
  return result.changes;
}

/**
 * Clean up old inactive sessions
 * @param {number} daysOld - Delete sessions older than this many days
 * @returns {number} Number of deleted sessions
 */
export function cleanupOldSessions(daysOld = 30) {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM sessions
    WHERE is_active = 0 OR expires_at < CURRENT_TIMESTAMP
    OR created_at < datetime('now', ?)
  `);
  const result = stmt.run(`-${daysOld} days`);
  return result.changes;
}

/**
 * Get active session count
 * @returns {number} Active session count
 */
export function getActiveSessionCount() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM sessions
    WHERE is_active = 1 AND expires_at > CURRENT_TIMESTAMP
  `);
  const result = stmt.get();
  return result.count;
}

/**
 * Get sessions by IP address
 * @param {string} ipAddress - IP address
 * @param {number} [limit=50] - Max results
 * @returns {Object[]} Array of sessions
 */
export function getSessionsByIp(ipAddress, limit = 50) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM sessions
    WHERE ip_address = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(ipAddress, limit);
}

export default {
  createSession,
  getSessionById,
  getSessionByToken,
  getUserSessions,
  getUserSessionCount,
  updateSession,
  invalidateSession,
  invalidateSessionByToken,
  revokeSession,
  invalidateAllUserSessions,
  deleteSession,
  deleteExpiredSessions,
  cleanupOldSessions,
  getActiveSessionCount,
  getSessionsByIp
};
