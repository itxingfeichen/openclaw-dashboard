import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { CreateUserInput, UpdateUserInput } from '../validators/user.validator';
import { userService } from '../services/user.service';

/**
 * Get all users with pagination
 * GET /api/users
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const users = userService.findAll({ offset, limit });
    const total = userService.count();

    res.json({
      success: true,
      data: {
        users: users.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user
 * POST /api/users
 */
export const createUser = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = req.body;

    // Check if user already exists
    if (userService.exists(userData.email, userData.username)) {
      throw new AppError('Email or username already in use', 409);
    }

    const user = userService.create({
      ...userData,
      role: userData.role || 'user',
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          createdAt: user.createdAt,
        },
        message: 'User created successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = userService.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user information
 * PUT /api/users/:id
 */
export const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = userService.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check for duplicate email/username
    if (updates.email || updates.username) {
      if (userService.exists(updates.email, updates.username, id)) {
        throw new AppError('Email or username already in use', 409);
      }
    }

    // Update user
    const updatedUser = userService.update(id, updates);

    if (!updatedUser) {
      throw new AppError('Failed to update user', 500);
    }

    console.log(`[User] User updated: ${id}`);

    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          displayName: updatedUser.displayName,
          role: updatedUser.role,
          updatedAt: updatedUser.updatedAt,
        },
        message: 'User updated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = userService.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const deleted = userService.delete(id);

    if (!deleted) {
      throw new AppError('Failed to delete user', 500);
    }

    console.log(`[User] User deleted: ${id}`);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
