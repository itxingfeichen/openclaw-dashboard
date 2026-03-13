/**
 * Authentication Module Tests
 * Tests for JWT, password, and middleware modules
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '1d';

describe('JWT Module', () => {
  let jwtModule;

  before(async () => {
    jwtModule = await import('../src/auth/jwt.js');
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload = { userId: 1, username: 'testuser', role: 'user' };
      const token = jwtModule.generateAccessToken(payload);
      
      assert.ok(token, 'Token should be generated');
      assert.strictEqual(typeof token, 'string', 'Token should be a string');
      assert.strictEqual(token.split('.').length, 3, 'Token should have 3 parts');
    });

    it('should include token type in payload', () => {
      const payload = { userId: 1, username: 'testuser' };
      const token = jwtModule.generateAccessToken(payload);
      const decoded = jwtModule.verifyToken(token);
      
      assert.strictEqual(decoded.type, 'access', 'Token type should be access');
      assert.strictEqual(decoded.userId, 1, 'User ID should match');
      assert.strictEqual(decoded.username, 'testuser', 'Username should match');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const payload = { userId: 1, username: 'testuser' };
      const token = jwtModule.generateRefreshToken(payload);
      
      assert.ok(token, 'Token should be generated');
      assert.strictEqual(typeof token, 'string', 'Token should be a string');
    });

    it('should include token type in payload', () => {
      const payload = { userId: 1 };
      const token = jwtModule.generateRefreshToken(payload);
      const decoded = jwtModule.verifyToken(token);
      
      assert.strictEqual(decoded.type, 'refresh', 'Token type should be refresh');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { userId: 1, username: 'testuser' };
      const token = jwtModule.generateAccessToken(payload);
      const decoded = jwtModule.verifyToken(token);
      
      assert.strictEqual(decoded.userId, 1, 'User ID should match');
      assert.strictEqual(decoded.username, 'testuser', 'Username should match');
    });

    it('should throw error for invalid token', () => {
      assert.throws(
        () => jwtModule.verifyToken('invalid.token.here'),
        /invalid|malformed/i,
        'Should throw error for invalid token'
      );
    });
  });

  describe('decodeToken', () => {
    it('should return null for invalid token', () => {
      const decoded = jwtModule.decodeToken('invalid.token.here');
      assert.strictEqual(decoded, null, 'Should return null for invalid token');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const payload = { userId: 1 };
      const token = jwtModule.generateAccessToken(payload);
      
      assert.strictEqual(jwtModule.isTokenExpired(token), false, 'Token should not be expired');
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration timestamp', () => {
      const payload = { userId: 1 };
      const token = jwtModule.generateAccessToken(payload);
      const expiration = jwtModule.getTokenExpiration(token);
      
      assert.ok(expiration, 'Expiration should be returned');
      assert.ok(expiration > Date.now(), 'Expiration should be in the future');
    });
  });
});

describe('Password Module', () => {
  let passwordModule;

  before(async () => {
    passwordModule = await import('../src/auth/password.js');
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = passwordModule.validatePasswordStrength('StrongPass123!');
      
      assert.strictEqual(result.valid, true, 'Strong password should be valid');
      assert.strictEqual(result.errors.length, 0, 'Should have no errors');
    });

    it('should reject password that is too short', () => {
      const result = passwordModule.validatePasswordStrength('Short1!');
      
      assert.strictEqual(result.valid, false, 'Short password should be invalid');
      assert.ok(result.errors.some(e => e.includes('8 characters')), 'Should mention minimum length');
    });

    it('should reject password without uppercase', () => {
      const result = passwordModule.validatePasswordStrength('lowercase123!');
      
      assert.strictEqual(result.valid, false, 'Password without uppercase should be invalid');
      assert.ok(result.errors.some(e => e.includes('uppercase')), 'Should mention uppercase requirement');
    });

    it('should reject password without lowercase', () => {
      const result = passwordModule.validatePasswordStrength('UPPERCASE123!');
      
      assert.strictEqual(result.valid, false, 'Password without lowercase should be invalid');
      assert.ok(result.errors.some(e => e.includes('lowercase')), 'Should mention lowercase requirement');
    });

    it('should reject password without number', () => {
      const result = passwordModule.validatePasswordStrength('NoNumbers!');
      
      assert.strictEqual(result.valid, false, 'Password without number should be invalid');
      assert.ok(result.errors.some(e => e.includes('number')), 'Should mention number requirement');
    });

    it('should reject password without special character', () => {
      const result = passwordModule.validatePasswordStrength('NoSpecial123');
      
      assert.strictEqual(result.valid, false, 'Password without special char should be invalid');
      assert.ok(result.errors.some(e => e.includes('special')), 'Should mention special character requirement');
    });

    it('should provide multiple error messages', () => {
      const result = passwordModule.validatePasswordStrength('weak');
      
      assert.strictEqual(result.valid, false, 'Weak password should be invalid');
      assert.ok(result.errors.length > 1, 'Should have multiple errors');
    });
  });

  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify password', async () => {
      const password = 'TestPass123!';
      const hash = await passwordModule.hashPassword(password);
      const isValid = await passwordModule.verifyPassword(password, hash);
      
      assert.strictEqual(isValid, true, 'Password should be valid');
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPass123!';
      const hash = await passwordModule.hashPassword(password);
      const isValid = await passwordModule.verifyPassword('WrongPass', hash);
      
      assert.strictEqual(isValid, false, 'Password should be invalid');
    });
  });
});

describe('Auth Middleware', () => {
  let middlewareModule;
  let jwtModule;

  before(async () => {
    middlewareModule = await import('../src/auth/middleware.js');
    jwtModule = await import('../src/auth/jwt.js');
  });

  describe('requireAuth', () => {
    it('should reject request without token', () => {
      const req = { headers: {} };
      const res = {
        status: function(code) {
          assert.strictEqual(code, 401, 'Should return 401');
          return this;
        },
        json: function(data) {
          assert.strictEqual(data.error, 'Authentication required', 'Should return auth error');
        },
      };
      const next = () => {
        assert.fail('Next should not be called');
      };

      middlewareModule.requireAuth(req, res, next);
    });

    it('should accept valid token and attach user to request', () => {
      const payload = { userId: 1, username: 'testuser', role: 'user' };
      const token = jwtModule.generateAccessToken(payload);
      
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = () => {
        assert.ok(req.user, 'User should be attached to request');
        assert.strictEqual(req.user.userId, 1, 'User ID should match');
        assert.strictEqual(req.user.username, 'testuser', 'Username should match');
      };

      middlewareModule.requireAuth(req, res, next);
    });
  });

  describe('optionalAuth', () => {
    it('should call next without token', () => {
      const req = { headers: {} };
      const res = {};
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      middlewareModule.optionalAuth(req, res, next);
      assert.strictEqual(nextCalled, true, 'Next should be called');
      assert.strictEqual(req.user, undefined, 'User should not be attached');
    });
  });

  describe('hasRole', () => {
    it('should allow user with matching role', () => {
      const req = { user: { userId: 1, role: 'admin' } };
      const res = {};
      const next = () => {
        assert.ok(true, 'Next should be called');
      };

      const middleware = middlewareModule.hasRole('admin');
      middleware(req, res, next);
    });

    it('should reject user without matching role', () => {
      const req = { user: { userId: 1, role: 'user' } };
      const res = {
        status: function(code) {
          assert.strictEqual(code, 403, 'Should return 403');
          return this;
        },
        json: function(data) {
          assert.strictEqual(data.error, 'Insufficient permissions', 'Should return permissions error');
        },
      };
      const next = () => {
        assert.fail('Next should not be called');
      };

      const middleware = middlewareModule.hasRole('admin');
      middleware(req, res, next);
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin user', () => {
      const req = { user: { userId: 1, role: 'admin' } };
      const res = {};
      const next = () => {
        assert.ok(true, 'Next should be called');
      };

      middlewareModule.requireAdmin(req, res, next);
    });

    it('should reject non-admin user', () => {
      const req = { user: { userId: 1, role: 'user' } };
      const res = {
        status: function(code) {
          assert.strictEqual(code, 403, 'Should return 403');
          return this;
        },
        json: function(data) {
          assert.strictEqual(data.error, 'Insufficient permissions', 'Should return permissions error');
        },
      };
      const next = () => {
        assert.fail('Next should not be called');
      };

      middlewareModule.requireAdmin(req, res, next);
    });
  });

  describe('rateLimiter', () => {
    it('should allow requests within limit', () => {
      const req = { ip: '127.0.0.1' };
      const res = {
        set: function(header, value) {
          // Headers should be set
        },
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      middlewareModule.rateLimiter(req, res, next);
      assert.strictEqual(nextCalled, true, 'Next should be called');
    });
  });
});

describe('User Service', () => {
  let userService;
  let testUserId;

  before(async () => {
    userService = await import('../src/services/user-service.js');
  });

  describe('getAllUsersService', () => {
    it('should return paginated users', async () => {
      const result = await userService.getAllUsersService({ limit: 10, offset: 0 });
      
      assert.ok(result.users, 'Should return users array');
      assert.ok(result.pagination, 'Should return pagination info');
      assert.ok(result.pagination.total >= 0, 'Should have total count');
    });
  });

  describe('getUserByIdService', () => {
    it('should return null for non-existent user', async () => {
      const user = await userService.getUserByIdService(999999);
      assert.strictEqual(user, null, 'Should return null for non-existent user');
    });
  });
});
