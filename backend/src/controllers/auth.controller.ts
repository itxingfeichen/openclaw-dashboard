import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { userService } from '../services/user.service';
import { generateTokens, verifyRefreshToken, JwtPayload } from '../utils/jwt';

// Refresh token storage (replace with Redis in production)
const refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();

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

    // Generate JWT tokens
    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } = 
      generateTokens(tokenPayload);

    // Store refresh token for later validation
    refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: refreshTokenExpiresAt,
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
        accessToken,
        refreshToken,
        accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
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
    // Invalidate refresh token
    const refreshToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
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
          id: user.userId,
          username: user.username,
          email: user.email,
          displayName: user.username,
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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if refresh token is in our store
    const tokenData = refreshTokens.get(refreshToken);

    if (!tokenData) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (tokenData.expiresAt < new Date()) {
      refreshTokens.delete(refreshToken);
      throw new AppError('Refresh token expired', 401);
    }

    // Remove old refresh token
    refreshTokens.delete(refreshToken);

    // Generate new token pair
    const tokenPayload: JwtPayload = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };

    const { accessToken, refreshToken: newRefreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } = 
      generateTokens(tokenPayload);

    // Store new refresh token
    refreshTokens.set(newRefreshToken, {
      userId: payload.userId,
      expiresAt: refreshTokenExpiresAt,
    });

    console.log(`[Auth] Token refreshed for user: ${payload.userId}`);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
        message: 'Token refreshed successfully',
      },
    });
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name === 'TokenExpiredError') {
      next(new AppError('Refresh token expired', 401));
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      next(new AppError('Invalid refresh token', 401));
      return;
    }
    next(error);
  }
};
