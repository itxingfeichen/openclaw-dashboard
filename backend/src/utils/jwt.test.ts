import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt.js';
import jwt from 'jsonwebtoken';

describe('JWT Utils', () => {
  const testPayload = {
    userId: '123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate token with correct payload', () => {
      const token = generateAccessToken(testPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.name).toBe(testPayload.name);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.exp).toBeDefined();
    });

    it('should generate token with 15 minute expiry', () => {
      const token = generateAccessToken(testPayload);
      const decoded = jwt.decode(token) as any;

      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + 900; // 15 minutes = 900 seconds

      expect(decoded.exp).toBeGreaterThanOrEqual(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5); // 5 second buffer
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate token with correct payload', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.name).toBe(testPayload.name);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.exp).toBeDefined();
    });

    it('should generate token with 7 day expiry', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = jwt.decode(token) as any;

      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + (7 * 24 * 60 * 60); // 7 days in seconds

      expect(decoded.exp).toBeGreaterThanOrEqual(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5); // 5 second buffer
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(testPayload);
      const verified = verifyAccessToken(token);

      expect(verified.userId).toBe(testPayload.userId);
      expect(verified.email).toBe(testPayload.email);
      expect(verified.name).toBe(testPayload.name);
      expect(verified.role).toBe(testPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw error for expired token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        testPayload,
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '-1s' }
      );

      expect(() => verifyAccessToken(expiredToken)).toThrow('jwt expired');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const verified = verifyRefreshToken(token);

      expect(verified.userId).toBe(testPayload.userId);
      expect(verified.email).toBe(testPayload.email);
      expect(verified.name).toBe(testPayload.name);
      expect(verified.role).toBe(testPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });

    it('should throw error for expired token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        testPayload,
        process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
        { expiresIn: '-1s' }
      );

      expect(() => verifyRefreshToken(expiredToken)).toThrow('jwt expired');
    });
  });
});
