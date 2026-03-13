/**
 * User Routes
 * Handles user management endpoints
 */

import express from 'express';
import {
  createUserAccount,
  getUserByIdService,
  getAllUsersService,
  updateUserAccount,
  updateUserStatus,
  deleteUserAccount,
} from '../services/user-service.js';
import { requireAuth, requireAdmin } from '../auth/middleware.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users (admin only)
 * @query {number} [limit=10] - Max results
 * @query {number} [offset=0] - Offset
 * @query {string} [search] - Search query
 */
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;

    const result = await getAllUsersService({ limit, offset, search });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * Create a new user (admin only)
 * @body {string} username - Username
 * @body {string} email - Email
 * @body {string} password - Password
 * @body {string} [role='user'] - Role (admin, user, readonly)
 */
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username, email, and password are required',
      });
    }

    const user = await createUserAccount({
      username,
      email,
      password,
      role,
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (err) {
    if (err.message === 'Username already exists' || err.message === 'Email already exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: err.message,
      });
    }
    
    if (err.validationErrors) {
      return res.status(400).json({
        error: 'Validation failed',
        message: err.message,
        details: err.validationErrors,
      });
    }
    
    next(err);
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (admin only)
 */
router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a number',
      });
    }

    const user = await getUserByIdService(id, true);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${id} not found`,
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/:id
 * Update user (admin only)
 * @body {string} [email] - New email
 * @body {string} [role] - New role
 * @body {string} [status] - New status
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a number',
      });
    }

    const { email, role, status } = req.body;
    const updateData = {};

    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No update data provided',
        message: 'At least one field to update is required',
      });
    }

    const user = await updateUserAccount(id, updateData);

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({
        error: 'User not found',
        message: err.message,
      });
    }
    
    if (err.message === 'Email already exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: err.message,
      });
    }
    
    next(err);
  }
});

/**
 * PATCH /api/users/:id/status
 * Update user status (admin only)
 * @body {string} status - New status (active, inactive, suspended)
 */
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a number',
      });
    }

    if (!status) {
      return res.status(400).json({
        error: 'Missing status',
        message: 'Status is required',
      });
    }

    const user = await updateUserStatus(id, status);

    res.json({
      success: true,
      data: user,
      message: 'User status updated successfully',
    });
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({
        error: 'User not found',
        message: err.message,
      });
    }
    
    if (err.message.includes('Invalid status')) {
      return res.status(400).json({
        error: 'Invalid status',
        message: err.message,
      });
    }
    
    next(err);
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a number',
      });
    }

    const success = await deleteUserAccount(id);

    if (!success) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${id} not found`,
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({
        error: 'User not found',
        message: err.message,
      });
    }
    
    if (err.message === 'Cannot delete the last admin user') {
      return res.status(400).json({
        error: 'Operation not allowed',
        message: err.message,
      });
    }
    
    next(err);
  }
});

export default router;
