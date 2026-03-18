import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { UpdateUserInput } from '../validators/user.validator';
import { userService } from '../services/user.service';

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
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

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
          updatedAt: updatedUser.updatedAt,
        },
        message: 'User updated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};
