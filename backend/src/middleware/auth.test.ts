import { describe, it, expect } from 'vitest';
import { authenticate, requireAdmin, optionalAuth } from './auth.js';
import { Request, Response, NextFunction } from 'express';
import { generateAccessToken } from '../utils/jwt.js';

describe('Auth Middleware', () => {
  const createMockRequest = (token?: string, user?: any) => {
    const req = {
      headers: {
        authorization: token ? `Bearer ${token}` : undefined,
      },
      user,
    } as unknown as Request;
    return req;
  };

  const createMockResponse = () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    return res;
  };

  const createMockNext = () => {
    const next = vi.fn() as NextFunction;
    return next;
  };

  describe('authenticate', () => {
    it('should authenticate with valid token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      const token = generateAccessToken(payload);
      const req = createMockRequest(token);
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('123');
      expect(req.user?.email).toBe('test@example.com');
    });

    it('should reject missing token', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });

    it('should reject invalid token', () => {
      const req = createMockRequest('invalid-token');
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin user', () => {
      const req = createMockRequest(undefined, {
        userId: '123',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject non-admin user', () => {
      const req = createMockRequest(undefined, {
        userId: '123',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.message).toBe('Admin access required');
      expect(error.statusCode).toBe(403);
    });

    it('should reject unauthenticated user', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('optionalAuth', () => {
    it('should attach user with valid token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      const token = generateAccessToken(payload);
      const req = createMockRequest(token);
      const res = createMockResponse();
      const next = createMockNext();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('123');
    });

    it('should proceed without token', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });

    it('should proceed with invalid token', () => {
      const req = createMockRequest('invalid-token');
      const res = createMockResponse();
      const next = createMockNext();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });
  });
});
