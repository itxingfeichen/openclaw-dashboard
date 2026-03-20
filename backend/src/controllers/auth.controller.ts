import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { userService } from '../services/user.service';

// Token storage (replace with Redis in production)
const tokens: Map<string, { userId: string; expiresAt: Date }> = new Map();

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    if (userService.exists(email, username)) {
      throw new AppError('User with this email or username already exists', 409);
    }

    // Create new user
    const newUser = userService.create({
      username,
      email,
      password, // TODO: Hash password in production
      role: 'user',
    });

    console.log(`[Auth] User registered: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role,
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
    const user = userService.findByEmail(email);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password (in production, compare hashed passwords)
    if (user.password !== password) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token (in production, use JWT)
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    tokens.set(token, {
      userId: user.id,
      expiresAt,
    });

    console.log(`[Auth] User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        token,
        expiresAt: expiresAt.toISOString(),
        message: 'Login successful',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Invalidate token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      tokens.delete(token);
    }

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

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

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
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Token required', 400);
    }

    const tokenData = tokens.get(token);

    if (!tokenData) {
      throw new AppError('Invalid token', 401);
    }

    if (tokenData.expiresAt < new Date()) {
      tokens.delete(token);
      throw new AppError('Token expired', 401);
    }

    // Generate new token
    const newToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    tokens.set(newToken, {
      userId: tokenData.userId,
      expiresAt,
    });

    // Remove old token
    tokens.delete(token);

    console.log(`[Auth] Token refreshed for user: ${tokenData.userId}`);

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresAt: expiresAt.toISOString(),
        message: 'Token refreshed successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};
