import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';
import { userService } from '../services/user.service.js';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../utils/jwt.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Create new user with hashed password
    const newUser = await userService.create({
      email,
      password,
      name,
      role: 'user',
    });

    console.log(`[Auth] User registered: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
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

/**
 * @route   POST /api/auth/login
 * @desc    Login user and receive JWT tokens
 * @access  Public
 */
export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await userService.findByEmail(email);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password with bcrypt
    const isValidPassword = await userService.verifyPassword(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT tokens
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    console.log(`[Auth] User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
        message: 'Login successful',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout current user
 * @access  Private
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we just return success
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

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
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
          id: user.userId,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Private
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    // Generate new access token
    const payload = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);

    console.log(`[Auth] Token refreshed for user: ${user.userId}`);

    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: 900,
        message: 'Token refreshed successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token validity
 * @access  Public (requires token)
 */
export const verify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Token required', 400);
    }

    // Verify the token
    const payload = verifyAccessToken(token);

    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          userId: payload.userId,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        message: 'Token is valid',
      },
    });
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        data: {
          valid: false,
          error: 'Token expired',
          message: err.message,
        },
      });
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        data: {
          valid: false,
          error: 'Invalid token',
          message: err.message,
        },
      });
      return;
    }
    next(error);
  }
};
