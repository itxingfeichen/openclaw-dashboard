/**
 * Authentication Tests
 * Tests for JWT token generation, password encryption
 */

import { hashPassword, comparePassword, validatePasswordStrength } from '../src/utils/password';
import { generateTokens, verifyAccessToken, verifyRefreshToken, decodeToken, JwtPayload } from '../src/utils/jwt';

describe('Password Encryption (bcrypt)', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      const result = await comparePassword(password, hash);
      
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      const result = await comparePassword('WrongPassword', hash);
      
      expect(result).toBe(false);
    });

    it('should return false for invalid hash', async () => {
      const result = await comparePassword('password', 'invalid-hash');
      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept valid password', () => {
      expect(validatePasswordStrength('Password123')).toBe(true);
    });

    it('should reject password without uppercase', () => {
      expect(validatePasswordStrength('password123')).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      expect(validatePasswordStrength('Pass1')).toBe(false);
    });
  });
});

describe('JWT Token Generation and Verification', () => {
  const mockPayload: JwtPayload = {
    userId: 'test-user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user',
  };

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = generateTokens(mockPayload);
      
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.accessTokenExpiresAt).toBeInstanceOf(Date);
      expect(tokens.refreshTokenExpiresAt).toBeInstanceOf(Date);
    });

    it('should generate tokens with correct expiration times', () => {
      const tokens = generateTokens(mockPayload);
      
      const accessDiff = tokens.accessTokenExpiresAt.getTime() - Date.now();
      // Access token expires in 1 hour
      expect(accessDiff).toBeGreaterThan(59 * 60 * 1000);
      expect(accessDiff).toBeLessThan(61 * 60 * 1000);
      
      const refreshDiff = tokens.refreshTokenExpiresAt.getTime() - Date.now();
      // Refresh token expires in 7 days
      expect(refreshDiff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
      expect(refreshDiff).toBeLessThan(8 * 24 * 60 * 60 * 1000);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const tokens = generateTokens(mockPayload);
      const verified = verifyAccessToken(tokens.accessToken);
      
      expect(verified).toBeDefined();
      expect(verified.userId).toBe(mockPayload.userId);
      expect(verified.email).toBe(mockPayload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const tokens = generateTokens(mockPayload);
      const verified = verifyRefreshToken(tokens.refreshToken);
      
      expect(verified).toBeDefined();
      expect(verified.userId).toBe(mockPayload.userId);
      expect(verified.type).toBe('refresh');
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const tokens = generateTokens(mockPayload);
      const decoded = decodeToken(tokens.accessToken);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
    });
  });
});

/**
 * Manual Test Instructions
 * ========================
 * 
 * 1. Start the backend server:
 *    cd /home/admin/openclaw-dashboard/backend
 *    npm run dev
 * 
 * 2. Test registration:
 *    curl -X POST http://localhost:3001/api/auth/register \
 *      -H "Content-Type: application/json" \
 *      -d '{"username":"testuser","email":"test@example.com","password":"TestPass123"}'
 * 
 * 3. Test login:
 *    curl -X POST http://localhost:3001/api/auth/login \
 *      -H "Content-Type: application/json" \
 *      -d '{"email":"admin@example.com","password":"admin123"}'
 * 
 * 4. Test protected route:
 *    curl -X GET http://localhost:3001/api/auth/me \
 *      -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
 * 
 * 5. Test token refresh:
 *    curl -X POST http://localhost:3001/api/auth/refresh \
 *      -H "Content-Type: application/json" \
 *      -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
 */
