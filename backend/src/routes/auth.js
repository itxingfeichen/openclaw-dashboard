/**
 * Authentication Routes
 * Handles user authentication endpoints
 */

import express from 'express';
import { login, logout, refreshAccessToken, getCurrentUser } from '../services/auth-service.js';
import { requireAuth, rateLimiter } from '../auth/middleware.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * User login
 * @body {string} username - Username or email
 * @body {string} password - Password
 */
router.post('/login', rateLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required',
      });
    }

    const result = await login(
      username,
      password,
      req.ip,
      req.get('user-agent')
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    if (err.message === 'Invalid credentials' || err.message === 'Account is not active') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: err.message,
      });
    }
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * User logout
 * @body {string} [refreshToken] - Refresh token to revoke
 */
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 * @body {string} refreshToken - Refresh token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing refresh token',
        message: 'Refresh token is required',
      });
    }

    const result = await refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    if (err.message === 'Refresh token expired' || err.message === 'Invalid token type' || err.message === 'Session expired or revoked') {
      return res.status(401).json({
        error: 'Token refresh failed',
        message: err.message,
      });
    }
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 * @header {string} Authorization - Bearer token
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({
        error: 'User not found',
        message: err.message,
      });
    }
    next(err);
  }
});

/**
 * POST /api/auth/verify
 * Verify token validity
 * @header {string} Authorization - Bearer token
 */
router.post('/verify', requireAuth, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          userId: req.user.userId,
          username: req.user.username,
          role: req.user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
