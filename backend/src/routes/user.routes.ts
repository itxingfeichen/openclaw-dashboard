import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';
import { generalLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (paginated)
 * @access  Private (Admin)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 */
router.get('/', generalLimiter, authenticate, getUsers);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Admin)
 */
router.post('/', generalLimiter, authenticate, validateRequest(createUserSchema), createUser);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', generalLimiter, authenticate, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user information
 * @access  Private
 */
router.put('/:id', generalLimiter, authenticate, validateRequest(updateUserSchema), updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/:id', generalLimiter, authenticate, deleteUser);

export default router;
