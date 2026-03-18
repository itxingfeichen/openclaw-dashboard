import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { UpdateUserInput } from '../validators/user.validator';

// Mock user storage (replace with database in production)
const users: Map<string, any> = new Map();

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = users.get(id);

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

    const user = users.get(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check for duplicate email/username
    if (updates.email || updates.username) {
      const existingUser = Array.from(users.values()).find(
        (u) =>
          u.id !== id &&
          (updates.email && u.email === updates.email) ||
          (updates.username && u.username === updates.username)
      );

      if (existingUser) {
        throw new AppError('Email or username already in use', 409);
      }
    }

    // Update user
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    users.set(id, updatedUser);

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

// Helper function to add mock users
export const addMockUser = (user: any) => {
  users.set(user.id, user);
};
