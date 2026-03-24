import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import 'dotenv/config';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create libsql adapter
const libsql = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:prisma/dev.db',
});

/**
 * Prisma 客户端单例实例
 * 
 * 在开发环境中使用全局变量避免热重载时创建多个实例
 * 在生产环境中直接使用新实例
 */
export const prisma = globalThis.prisma || new PrismaClient({
  adapter: libsql,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * 连接数据库
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * 断开数据库连接
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
}

export default prisma;
