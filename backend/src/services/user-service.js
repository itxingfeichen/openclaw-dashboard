/**
 * User Service
 * Handles user management operations
 */

import { hashPassword, validatePasswordStrength } from '../auth/password.js';
import {
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
  searchUsers,
} from '../repositories/user-repository.js';

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email
 * @param {string} userData.password - Plain text password
 * @param {string} [userData.role='user'] - User role
 * @returns {Promise<Object>} Created user (without password hash)
 */
export async function createUserAccount(userData) {
  // Validate password strength
  const passwordValidation = validatePasswordStrength(userData.password);
  if (!passwordValidation.valid) {
    const error = new Error('Password does not meet requirements');
    error.validationErrors = passwordValidation.errors;
    throw error;
  }

  // Check if username already exists
  const existingUsername = getUserByUsername(userData.username);
  if (existingUsername) {
    throw new Error('Username already exists');
  }

  // Check if email already exists
  const existingEmail = getUserByEmail(userData.email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(userData.password);

  // Create user
  const user = createUser({
    username: userData.username,
    email: userData.email,
    passwordHash,
    role: userData.role || 'user',
  });

  // Return user without password hash
  return sanitizeUser(user);
}

/**
 * Get user by ID
 * @param {number} id - User ID
 * @param {boolean} includeSensitive - Include sensitive info (admin only)
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserByIdService(id, includeSensitive = false) {
  const user = getUserById(id);
  if (!user) {
    return null;
  }

  return includeSensitive ? user : sanitizeUser(user);
}

/**
 * Get all users with pagination
 * @param {Object} options - Query options
 * @param {number} [options.limit=10] - Max results
 * @param {number} [options.offset=0] - Offset
 * @param {string} [options.search] - Search query
 * @returns {Promise<Object>} Users and pagination info
 */
export async function getAllUsersService(options = {}) {
  const { limit = 10, offset = 0, search } = options;

  let users;
  if (search) {
    users = searchUsers(search, limit);
  } else {
    users = getAllUsers(limit, offset);
  }

  const total = search ? users.length : getUserCount();

  return {
    users: users.map(sanitizeUser),
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + users.length < total,
    },
  };
}

/**
 * Update user
 * @param {number} id - User ID
 * @param {Object} updateData - Data to update
 * @param {string} [updateData.email] - New email
 * @param {string} [updateData.role] - New role
 * @param {string} [updateData.status] - New status
 * @returns {Promise<Object|null>} Updated user or null
 */
export async function updateUserAccount(id, updateData) {
  const user = getUserById(id);
  if (!user) {
    throw new Error('User not found');
  }

  // Check email uniqueness if updating email
  if (updateData.email && updateData.email !== user.email) {
    const existingEmail = getUserByEmail(updateData.email);
    if (existingEmail && existingEmail.id !== id) {
      throw new Error('Email already exists');
    }
  }

  const updatedUser = updateUser(id, updateData);
  return sanitizeUser(updatedUser);
}

/**
 * Update user password
 * @param {number} id - User ID
 * @param {string} currentPassword - Current password (for verification)
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
export async function changePassword(id, currentPassword, newPassword) {
  const user = getUserById(id);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password (if not admin operation)
  const { verifyPassword } = await import('../auth/password.js');
  const isValid = await verifyPassword(currentPassword, user.password_hash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    const error = new Error('Password does not meet requirements');
    error.validationErrors = passwordValidation.errors;
    throw error;
  }

  // Hash and update password
  const passwordHash = await hashPassword(newPassword);
  const updated = updatePassword(id, passwordHash);
  
  return !!updated;
}

/**
 * Admin reset password (without current password verification)
 * @param {number} id - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
export async function adminResetPassword(id, newPassword) {
  const user = getUserById(id);
  if (!user) {
    throw new Error('User not found');
  }

  // Validate new password
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    const error = new Error('Password does not meet requirements');
    error.validationErrors = passwordValidation.errors;
    throw error;
  }

  // Hash and update password
  const passwordHash = await hashPassword(newPassword);
  const updated = updatePassword(id, passwordHash);
  
  return !!updated;
}

/**
 * Update user status
 * @param {number} id - User ID
 * @param {string} status - New status (active, inactive, suspended)
 * @returns {Promise<Object|null>} Updated user or null
 */
export async function updateUserStatus(id, status) {
  const validStatuses = ['active', 'inactive', 'suspended'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const updated = updateStatus(id, status);
  return sanitizeUser(updated);
}

/**
 * Delete user
 * @param {number} id - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteUserAccount(id) {
  const user = getUserById(id);
  if (!user) {
    throw new Error('User not found');
  }

  // Prevent deleting the last admin
  if (user.role === 'admin') {
    const allUsers = getAllUsers(1000, 0);
    const adminCount = allUsers.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      throw new Error('Cannot delete the last admin user');
    }
  }

  return deleteUser(id);
}

/**
 * Check if user has specific role
 * @param {number} userId - User ID
 * @param {string} role - Role to check
 * @returns {Promise<boolean>} True if user has role
 */
export async function userHasRole(userId, role) {
  const user = getUserById(userId);
  return user && user.role === role;
}

/**
 * Check if user is admin
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user is admin
 */
export async function userIsAdmin(userId) {
  return userHasRole(userId, 'admin');
}

/**
 * Sanitize user object (remove sensitive data)
 * @param {Object} user - User object
 * @returns {Object} Sanitized user object
 */
function sanitizeUser(user) {
  if (!user) return null;
  
  const { password_hash, ...sanitized } = user;
  return sanitized;
}

export default {
  createUserAccount,
  getUserByIdService,
  getAllUsersService,
  updateUserAccount,
  changePassword,
  adminResetPassword,
  updateUserStatus,
  deleteUserAccount,
  userHasRole,
  userIsAdmin,
};
