import prisma from './prisma-client.js';
import type { User, UserRole, Prisma } from '@prisma/client';

/**
 * 用户数据访问层
 * 提供用户相关的数据库操作
 */
export class UserRepository {
  /**
   * 根据 ID 查找用户
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * 创建新用户
   */
  async create(data: {
    email: string;
    passwordHash: string;
    name?: string;
    role?: UserRole;
  }): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  /**
   * 更新用户信息
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除用户
   */
  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  /**
   * 获取所有用户
   */
  async findAll(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 验证用户凭据（由服务层调用）
   */
  async verifyPassword(user: User, passwordHash: string): Promise<boolean> {
    return user.passwordHash === passwordHash;
  }
}

export const userRepository = new UserRepository();
export default userRepository;
