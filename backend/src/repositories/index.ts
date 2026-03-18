/**
 * Repository 层统一导出
 * 提供所有数据访问层的集中导入入口
 */

export { prisma } from './prisma-client.js';
export type { PrismaClient } from '@prisma/client';

export { UserRepository, userRepository } from './user-repository.js';
export { SessionRepository, sessionRepository } from './session-repository.js';
export {
  DashboardConfigRepository,
  dashboardConfigRepository,
} from './dashboard-config-repository.js';
export {
  SystemStatusRepository,
  systemStatusRepository,
} from './system-status-repository.js';
