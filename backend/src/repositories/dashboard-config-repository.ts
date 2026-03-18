import prisma from './prisma-client.js';
import type { DashboardConfig, Prisma } from '@prisma/client';

/**
 * 仪表板配置数据访问层
 * 提供用户仪表板配置相关的数据库操作
 */
export class DashboardConfigRepository {
  /**
   * 根据 ID 查找配置
   */
  async findById(id: string): Promise<DashboardConfig | null> {
    return prisma.dashboardConfig.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  /**
   * 根据用户 ID 查找配置
   */
  async findByUserId(userId: string): Promise<DashboardConfig | null> {
    return prisma.dashboardConfig.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { user: true },
    });
  }

  /**
   * 创建新配置
   */
  async create(data: {
    userId: string;
    layout: string;
    widgets: string;
  }): Promise<DashboardConfig> {
    return prisma.dashboardConfig.create({
      data,
      include: { user: true },
    });
  }

  /**
   * 更新配置
   */
  async update(
    id: string,
    data: Prisma.DashboardConfigUpdateInput
  ): Promise<DashboardConfig> {
    return prisma.dashboardConfig.update({
      where: { id },
      data,
    });
  }

  /**
   * 更新或创建配置（Upsert）
   */
  async upsert(data: {
    userId: string;
    layout: string;
    widgets: string;
  }): Promise<DashboardConfig> {
    const existing = await this.findByUserId(data.userId);
    if (existing) {
      return prisma.dashboardConfig.update({
        where: { id: existing.id },
        data: {
          layout: data.layout,
          widgets: data.widgets,
        },
        include: { user: true },
      });
    }
    return prisma.dashboardConfig.create({
      data,
      include: { user: true },
    });
  }

  /**
   * 删除配置
   */
  async delete(id: string): Promise<DashboardConfig> {
    return prisma.dashboardConfig.delete({
      where: { id },
    });
  }

  /**
   * 解析布局配置
   */
  parseLayout(layoutJson: string): any {
    try {
      return JSON.parse(layoutJson);
    } catch (error) {
      console.error('Failed to parse layout JSON:', error);
      return null;
    }
  }

  /**
   * 解析小部件配置
   */
  parseWidgets(widgetsJson: string): any {
    try {
      return JSON.parse(widgetsJson);
    } catch (error) {
      console.error('Failed to parse widgets JSON:', error);
      return null;
    }
  }
}

export const dashboardConfigRepository = new DashboardConfigRepository();
export default dashboardConfigRepository;
