import { Router } from 'express';
import { register, login, logout, getCurrentUser, refreshToken } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

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
 * @desc    Refresh access token using refresh token
 * @access  Public (requires valid refresh token in body)
 */
router.post('/refresh', refreshToken);

export default router;
