import { Router } from 'express';
import { getUserById, updateUser } from '../controllers/user.controller';
import { validateRequest } from '../middleware/validateRequest';
import { updateUserSchema } from '../validators/user.validator';
import { generalLimiter } from '../middleware/rateLimiter';

const router: Router = Router();

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', generalLimiter, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user information
 * @access  Private
 */
router.put('/:id', generalLimiter, validateRequest(updateUserSchema), updateUser);

export default router;
