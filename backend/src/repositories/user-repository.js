/**
 * User Repository
 * Data access layer for user management
 */

import { getDatabase, prepare } from '../database/index.js';

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email
 * @param {string} userData.passwordHash - Password hash
 * @param {string} [userData.role='user'] - User role
 * @returns {Object} Created user
 */
export function createUser(userData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    userData.username,
    userData.email,
    userData.passwordHash,
    userData.role || 'user'
  );
  
  return getUserById(result.lastInsertRowid);
}

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Object|null} User object or null
 */
export function getUserById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) || null;
}

/**
 * Get user by username
 * @param {string} username - Username
 * @returns {Object|null} User object or null
 */
export function getUserByUsername(username) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) || null;
}

/**
 * Get user by email
 * @param {string} email - Email
 * @returns {Object|null} User object or null
 */
export function getUserByEmail(email) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) || null;
}

/**
 * Get all users with pagination
 * @param {number} [limit=10] - Max results
 * @param {number} [offset=0] - Offset
 * @returns {Object[]} Array of users
 */
export function getAllUsers(limit = 10, offset = 0) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, username, email, role, status, created_at, updated_at, last_login_at
    FROM users
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset);
}

/**
 * Get total user count
 * @returns {number} Total count
 */
export function getUserCount() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = stmt.get();
  return result.count;
}

/**
 * Update user
 * @param {number} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Object|null} Updated user or null
 */
export function updateUser(id, userData) {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (userData.email !== undefined) {
    fields.push('email = ?');
    values.push(userData.email);
  }
  if (userData.passwordHash !== undefined) {
    fields.push('password_hash = ?');
    values.push(userData.passwordHash);
  }
  if (userData.role !== undefined) {
    fields.push('role = ?');
    values.push(userData.role);
  }
  if (userData.status !== undefined) {
    fields.push('status = ?');
    values.push(userData.status);
  }
  if (userData.lastLoginAt !== undefined) {
    fields.push('last_login_at = ?');
    values.push(userData.lastLoginAt);
  }
  
  if (fields.length === 0) {
    return getUserById(id);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE users SET ${fields.join(', ')} WHERE id = ?
  `);
  
  stmt.run(...values);
  return getUserById(id);
}

/**
 * Delete user
 * @param {number} id - User ID
 * @returns {boolean} Success status
 */
export function deleteUser(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Update user password
 * @param {number} id - User ID
 * @param {string} passwordHash - New password hash
 * @returns {Object|null} Updated user or null
 */
export function updatePassword(id, passwordHash) {
  return updateUser(id, { passwordHash });
}

/**
 * Update user status
 * @param {number} id - User ID
 * @param {string} status - New status
 * @returns {Object|null} Updated user or null
 */
export function updateStatus(id, status) {
  return updateUser(id, { status });
}

/**
 * Record user login
 * @param {number} id - User ID
 * @returns {Object|null} Updated user or null
 */
export function recordLogin(id) {
  return updateUser(id, { lastLoginAt: new Date().toISOString() });
}

/**
 * Search users by username or email
 * @param {string} query - Search query
 * @param {number} [limit=10] - Max results
 * @returns {Object[]} Array of users
 */
export function searchUsers(query, limit = 10) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, username, email, role, status, created_at
    FROM users
    WHERE username LIKE ? OR email LIKE ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  const searchPattern = `%${query}%`;
  return stmt.all(searchPattern, searchPattern, limit);
}

export default {
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  getAllUsers,
  getUserCount,
  updateUser,
  deleteUser,
  updatePassword,
  updateStatus,
  recordLogin,
  searchUsers
};
