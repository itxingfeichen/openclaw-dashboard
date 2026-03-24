import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { userService } from './user.service.js';
import { prisma } from '../lib/prisma.js';

const testUserEmail = 'service-test@example.com';
const testUserPassword = 'ServiceTest123!';
const testUserName = 'Service Test User';

describe('User Service', () => {
  let createdUserId: string = '';

  beforeAll(async () => {
    // Clean up any existing test users
    await prisma.user.deleteMany({
      where: {
        email: testUserEmail,
      },
    });
  });

  afterAll(async () => {
    // Clean up test users
    if (createdUserId) {
      try {
        await prisma.user.delete({
          where: { id: createdUserId },
        });
      } catch {
        // Ignore if user doesn't exist
      }
    }
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const user = await userService.create({
        email: testUserEmail,
        password: testUserPassword,
        name: testUserName,
        role: 'user',
      });

      createdUserId = user.id;

      expect(user.id).toBeDefined();
      expect(user.email).toBe(testUserEmail);
      expect(user.name).toBe(testUserName);
      expect(user.role).toBe('user');
      expect(user.password).not.toBe(testUserPassword); // Password should be hashed
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should hash password with bcrypt', async () => {
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });
      
      expect(user).toBeDefined();
      expect(user!.password).toMatch(/^\$2[aby]?\$\d+\$/); // bcrypt hash format
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = await userService.findByEmail(testUserEmail);

      expect(user).toBeDefined();
      expect(user!.email).toBe(testUserEmail);
      expect(user!.name).toBe(testUserName);
    });

    it('should return null for non-existent email', async () => {
      const user = await userService.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const user = await userService.findByEmail(testUserEmail);
      expect(user).toBeDefined();

      const foundUser = await userService.findById(user!.id);

      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(user!.id);
      expect(foundUser!.email).toBe(testUserEmail);
    });

    it('should return null for non-existent id', async () => {
      const user = await userService.findById('non-existent-id');

      expect(user).toBeNull();
    });
  });

  describe('existsByEmail', () => {
    it('should return true for existing email', async () => {
      const exists = await userService.existsByEmail(testUserEmail);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      const exists = await userService.existsByEmail('nonexistent@example.com');

      expect(exists).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });
      expect(user).toBeDefined();

      const isValid = await userService.verifyPassword(testUserPassword, user!.password);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });
      expect(user).toBeDefined();

      const isValid = await userService.verifyPassword('WrongPassword123!', user!.password);

      expect(isValid).toBe(false);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const user = await userService.findByEmail(testUserEmail);
      expect(user).toBeDefined();

      const updatedUser = await userService.update(user!.id, {
        name: 'Updated Name',
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser!.name).toBe('Updated Name');
      expect(updatedUser!.email).toBe(testUserEmail);
    });
  });

  describe('findAll', () => {
    it('should return users with pagination', async () => {
      const users = await userService.findAll({ offset: 0, limit: 10 });

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('count', () => {
    it('should return user count', async () => {
      const count = await userService.count();

      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});
