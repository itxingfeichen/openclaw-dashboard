/**
 * User Service
 * Handles user-related business logic with Prisma and bcrypt
 */

import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: string;
}

export interface FindAllOptions {
  offset: number;
  limit: number;
}

class UserService {
  private readonly saltRounds = 10;

  /**
   * Find all users with pagination
   */
  async findAll(options: FindAllOptions): Promise<User[]> {
    const users = await prisma.user.findMany({
      skip: options.offset,
      take: options.limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users as unknown as User[];
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    return prisma.user.count();
  }

  /**
   * Create a new user with hashed password
   */
  async create(userData: CreateUserInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'user',
      },
    });

    return user as unknown as User;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user as unknown as User | null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user as unknown as User | null;
  }

  /**
   * Update user
   */
  async update(id: string, updates: UpdateUserInput): Promise<User | null> {
    const user = await prisma.user.update({
      where: { id },
      data: updates,
    });
    return user as unknown as User | null;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    await prisma.user.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user !== null && user.id !== excludeId;
  }

  /**
   * Verify password against hashed password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Initialize database with admin user if not exists
   */
  async initializeAdmin(): Promise<void> {
    const adminExists = await this.existsByEmail('admin@example.com');
    
    if (!adminExists) {
      await this.create({
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Administrator',
        role: 'admin',
      });
      console.log('✅ Admin user created');
    }
  }
}

export const userService = new UserService();
