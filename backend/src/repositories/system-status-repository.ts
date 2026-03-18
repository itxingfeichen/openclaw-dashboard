import prisma from './prisma-client.js';
import type { SystemStatus, SystemStatusType } from '@prisma/client';

/**
 * 系统状态数据访问层
 * 提供系统组件状态监控相关的数据库操作
 */
export class SystemStatusRepository {
  /**
   * 根据 ID 查找状态记录
   */
  async findById(id: string): Promise<SystemStatus | null> {
    return prisma.systemStatus.findUnique({
      where: { id },
    });
  }

  /**
   * 根据组件名称查找最新状态
   */
  async findByComponentName(componentName: string): Promise<SystemStatus | null> {
    return prisma.systemStatus.findFirst({
      where: { componentName },
      orderBy: { lastCheck: 'desc' },
    });
  }

  /**
   * 获取所有组件的最新状态
   */
  async findAllLatest(): Promise<SystemStatus[]> {
    // 获取每个组件的最新状态记录
    const components = await prisma.systemStatus.groupBy({
      by: ['componentName'],
      _max: { lastCheck: true },
    });

    const latestStatuses: SystemStatus[] = [];
    for (const component of components) {
      const status = await prisma.systemStatus.findFirst({
        where: {
          componentName: component.componentName,
          lastCheck: component._max.lastCheck!,
        },
      });
      if (status) {
        latestStatuses.push(status);
      }
    }

    return latestStatuses;
  }

  /**
   * 创建新的状态记录
   */
  async create(data: {
    componentName: string;
    status: SystemStatusType;
    metrics?: string;
  }): Promise<SystemStatus> {
    return prisma.systemStatus.create({
      data,
    });
  }

  /**
   * 更新组件状态
   */
  async updateComponentStatus(
    componentName: string,
    status: SystemStatusType,
    metrics?: Record<string, any>
  ): Promise<SystemStatus> {
    const metricsJson = metrics ? JSON.stringify(metrics) : undefined;

    return prisma.systemStatus.create({
      data: {
        componentName,
        status,
        metrics: metricsJson,
        lastCheck: new Date(),
      },
    });
  }

  /**
   * 批量更新组件状态
   */
  async bulkUpdate(
    statuses: Array<{
      componentName: string;
      status: SystemStatusType;
      metrics?: Record<string, any>;
    }>
  ): Promise<SystemStatus[]> {
    const results: SystemStatus[] = [];
    for (const status of statuses) {
      const result = await this.updateComponentStatus(
        status.componentName,
        status.status,
        status.metrics
      );
      results.push(result);
    }
    return results;
  }

  /**
   * 获取指定状态的所有组件
   */
  async findByStatus(status: SystemStatusType): Promise<SystemStatus[]> {
    const latestStatuses = await this.findAllLatest();
    return latestStatuses.filter((s) => s.status === status);
  }

  /**
   * 获取健康状态统计
   */
  async getStatusSummary(): Promise<{
    healthy: number;
    degraded: number;
    down: number;
    unknown: number;
    total: number;
  }> {
    const latestStatuses = await this.findAllLatest();
    const summary = {
      healthy: 0,
      degraded: 0,
      down: 0,
      unknown: 0,
      total: latestStatuses.length,
    };

    for (const status of latestStatuses) {
      switch (status.status) {
        case 'HEALTHY':
          summary.healthy++;
          break;
        case 'DEGRADED':
          summary.degraded++;
          break;
        case 'DOWN':
          summary.down++;
          break;
        default:
          summary.unknown++;
      }
    }

    return summary;
  }

  /**
   * 解析指标数据
   */
  parseMetrics(metricsJson: string | null): Record<string, any> | null {
    if (!metricsJson) return null;
    try {
      return JSON.parse(metricsJson);
    } catch (error) {
      console.error('Failed to parse metrics JSON:', error);
      return null;
    }
  }

  /**
   * 清理旧的状态记录（保留最近 N 条）
   */
  async cleanupOldRecords(keepCount: number = 100): Promise<number> {
    // 获取需要保留的记录 ID
    const recordsToKeep = await prisma.systemStatus.findMany({
      select: { id: true },
      orderBy: { lastCheck: 'desc' },
      take: keepCount,
    });

    const keepIds = new Set(recordsToKeep.map((r) => r.id));

    // 删除不在保留列表中的记录
    const allRecords = await prisma.systemStatus.findMany({
      select: { id: true },
    });

    let deletedCount = 0;
    for (const record of allRecords) {
      if (!keepIds.has(record.id)) {
        await prisma.systemStatus.delete({
          where: { id: record.id },
        });
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

export const systemStatusRepository = new SystemStatusRepository();
export default systemStatusRepository;
