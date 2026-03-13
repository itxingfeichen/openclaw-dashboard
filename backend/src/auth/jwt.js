/**
 * JWT Token Module
 * Handles JWT token generation and verification
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate access token
 * @param {Object} payload - Token payload (user info)
 * @returns {string} JWT access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(
    {
      ...payload,
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Generate refresh token
 * @param {Object} payload - Token payload (user info)
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(
    {
      ...payload,
      type: 'refresh',
    },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

/**
 * Verify token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Decode token without verification
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null
 */
export function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
export function isTokenExpired(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: false });
    return false;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return true;
    }
    throw err;
  }
}

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {number|null} Expiration timestamp or null
 */
export function getTokenExpiration(token) {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      return decoded.exp * 1000; // Convert to milliseconds
    }
    return null;
  } catch (err) {
    return null;
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
};
