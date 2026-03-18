import prisma from './prisma-client.js';
import type { Session, Prisma } from '@prisma/client';

/**
 * 会话数据访问层
 * 提供用户会话相关的数据库操作
 */
export class SessionRepository {
  /**
   * 根据 ID 查找会话
   */
  async findById(id: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  /**
   * 根据 Token 查找会话
   */
  async findByToken(token: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * 根据用户 ID 查找所有会话
   */
  async findByUserId(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  /**
   * 创建新会话
   */
  async create(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<Session> {
    return prisma.session.create({
      data,
      include: { user: true },
    });
  }

  /**
   * 更新会话
   */
  async update(id: string, data: Prisma.SessionUpdateInput): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除会话
   */
  async delete(id: string): Promise<Session> {
    return prisma.session.delete({
      where: { id },
    });
  }

  /**
   * 删除用户的所有会话（用于登出）
   */
  async deleteByUserId(userId: string): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  /**
   * 删除过期的会话
   */
  async deleteExpired(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * 验证会话是否有效
   */
  async isValid(token: string): Promise<boolean> {
    const session = await this.findByToken(token);
    if (!session) return false;
    return session.expiresAt > new Date();
  }
}

export const sessionRepository = new SessionRepository();
export default sessionRepository;
