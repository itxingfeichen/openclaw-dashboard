import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        displayName?: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    // In production, verify JWT token
    // For now, we'll use a simple mock validation
    // Replace with actual JWT verification in production
    if (token.length < 10) {
      throw new AppError('Invalid token format', 401);
    }

    // Mock user data (replace with actual JWT verification)
    req.user = {
      id: 'user-' + token.substring(0, 8),
      username: 'authenticated_user',
      email: 'user@example.com',
      role: 'user',
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Admin authorization middleware
 * Checks if user has admin role
 */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }

  next();
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token && token.length >= 10) {
      req.user = {
        id: 'user-' + token.substring(0, 8),
        username: 'authenticated_user',
        email: 'user@example.com',
        role: 'user',
      };
    }

    next();
  } catch (error) {
    next();
  }
};
