/**
 * Authentication Middleware
 * Middleware functions for authentication and authorization
 */

import { verifyToken } from './jwt.js';

/**
 * Rate limiter storage (in-memory for simplicity)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map();

/**
 * Rate limiter configuration
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 attempts per window

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No token provided',
    });
  }

  try {
    const decoded = verifyToken(token);
    
    // Check if it's an access token
    if (decoded.type !== 'access') {
      return res.status(403).json({
        error: 'Invalid token type',
        message: 'Access token required',
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your token or login again',
      });
    }
    
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token verification failed',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded.type === 'access') {
        req.user = decoded;
      }
    } catch (err) {
      // Ignore invalid tokens, just don't attach user
    }
  }
  
  next();
};

/**
 * Role-based access control middleware
 * @param {string[]} allowedRoles - Array of roles that are allowed
 * @returns {Function} Middleware function
 */
export const hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login first',
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required role: ${allowedRoles.join(' or ')}`,
        currentRole: userRole,
      });
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = hasRole('admin');

/**
 * Rate limiter middleware for login attempts
 * Prevents brute force attacks
 */
export const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const key = `login:${ip}`;
  
  const now = Date.now();
  
  // Get or initialize rate limit data for this IP
  let rateLimitData = rateLimitStore.get(key);
  
  if (!rateLimitData || now - rateLimitData.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitData = {
      windowStart: now,
      count: 0,
    };
  }
  
  rateLimitData.count++;
  rateLimitStore.set(key, rateLimitData);
  
  // Check if limit exceeded
  if (rateLimitData.count > RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((rateLimitData.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
    
    res.set('Retry-After', retryAfter.toString());
    return res.status(429).json({
      error: 'Too many attempts',
      message: 'Too many login attempts. Please try again later.',
      retryAfter,
    });
  }
  
  // Add rate limit headers to response
  res.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
  res.set('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - rateLimitData.count).toString());
  
  next();
};

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto cleanup every 5 minutes
if (typeof global !== 'undefined' && !global.rateLimitCleanupInterval) {
  global.rateLimitCleanupInterval = setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

export default {
  requireAuth,
  optionalAuth,
  hasRole,
  requireAdmin,
  rateLimiter,
  cleanupRateLimits,
};
