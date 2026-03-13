/**
 * Authentication Service
 * Handles user authentication operations
 */

import { generateAccessToken, generateRefreshToken, verifyToken } from '../auth/jwt.js';
import { verifyPassword } from '../auth/password.js';
import { getUserByUsername, getUserByEmail, recordLogin } from '../repositories/user-repository.js';
import { createSession, getSessionByToken, revokeSession } from '../repositories/session-repository.js';

/**
 * Login user
 * @param {string} username - Username or email
 * @param {string} password - Plain text password
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {Promise<Object>} Tokens and user info
 */
export async function login(username, password, ipAddress = null, userAgent = null) {
  // Find user by username or email
  let user = getUserByUsername(username);
  if (!user) {
    user = getUserByEmail(username);
  }

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (user.status !== 'active') {
    throw new Error('Account is not active');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Record login
  recordLogin(user.id);

  // Create session
  try {
    createSession({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.warn('Failed to create session:', err);
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600, // 1 hour
    tokenType: 'Bearer',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Logout user
 * @param {string} refreshToken - Refresh token to revoke
 * @returns {Promise<boolean>} Success status
 */
export async function logout(refreshToken) {
  try {
    // Revoke session
    const revoked = revokeSession(refreshToken);
    return revoked;
  } catch (err) {
    console.error('Logout error:', err);
    return false;
  }
}

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New tokens
 */
export async function refreshAccessToken(refreshToken) {
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if session exists and is active
    const session = getSessionByToken(refreshToken);
    if (!session || !session.is_active) {
      throw new Error('Session expired or revoked');
    }

    // Check if refresh token is about to expire (less than 24 hours)
    const now = Date.now();
    const expiresAt = new Date(session.expires_at).getTime();
    if (expiresAt - now < 24 * 60 * 60 * 1000) {
      // Session expiring soon, generate new refresh token
      const tokenPayload = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      };
      
      const newRefreshToken = generateRefreshToken(tokenPayload);
      
      // Update session with new token
      const db = (await import('../database/index.js')).getDatabase();
      const stmt = db.prepare('UPDATE sessions SET token = ? WHERE token = ?');
      stmt.run(newRefreshToken, refreshToken);
      
      return {
        accessToken: generateAccessToken(tokenPayload),
        refreshToken: newRefreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    }

    // Generate new access token only
    const tokenPayload = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };

    return {
      accessToken: generateAccessToken(tokenPayload),
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw err;
  }
}

/**
 * Get current user info
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User info
 */
export async function getCurrentUser(userId) {
  const { getUserById } = await import('../repositories/user-repository.js');
  
  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  };
}

/**
 * Validate token
 * @param {string} token - Token to validate
 * @returns {Promise<Object>} Token info
 */
export async function validateToken(token) {
  const decoded = verifyToken(token);
  
  return {
    valid: true,
    type: decoded.type,
    userId: decoded.userId,
    username: decoded.username,
    role: decoded.role,
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
  };
}

export default {
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  validateToken,
};
