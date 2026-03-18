import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

// Mock user storage (replace with database in production)
const users: Map<string, any> = new Map();

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      (u) => u.email === email || u.username === username
    );

    if (existingUser) {
      throw new AppError('User with this email or username already exists', 409);
    }

    // Create new user (in production, hash password)
    const newUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password, // TODO: Hash password in production
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.set(newUser.id, newUser);

    console.log(`[Auth] User registered: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
        message: 'User registered successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = Array.from(users.values()).find((u) => u.email === email);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password (in production, compare hashed passwords)
    if (user.password !== password) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token (in production, use JWT)
    const token = crypto.randomUUID();

    console.log(`[Auth] User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
        message: 'Login successful',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // In production, invalidate token here

    console.log(`[Auth] User logged out`);

    res.json({
      success: true,
      data: {
        message: 'Logout successful',
      },
    });
  } catch (error) {
    next(error);
  }
};
