import { Router } from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  verify,
} from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, validateRequest(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and receive access token
 * @access  Public
 */
router.post('/login', authLimiter, validateRequest(loginSchema), login);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token validity
 * @access  Public (requires token)
 */
router.get('/verify', authenticate, verify);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout current user and invalidate token
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Private
 */
router.post('/refresh', authenticate, refreshToken);

export default router;
