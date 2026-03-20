/**
 * Dashboard Service
 * Handles dashboard-related business logic
 */

export interface Dashboard {
  id: string;
  userId: string;
  name: string;
  config: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDashboardInput {
  userId: string;
  name: string;
  config?: Record<string, any>;
}

export interface UpdateDashboardInput {
  name?: string;
  config?: Record<string, any>;
}

export interface FindOptions {
  offset: number;
  limit: number;
}

class DashboardService {
  private dashboards: Map<string, Dashboard> = new Map();

  /**
   * Find all dashboards for a user with pagination
   */
  findByUser(userId: string, options: FindOptions): Dashboard[] {
    const userDashboards = Array.from(this.dashboards.values()).filter(
      (d) => d.userId === userId
    );
    return userDashboards.slice(options.offset, options.offset + options.limit);
  }

  /**
   * Count dashboards for a user
   */
  countByUser(userId: string): number {
    return Array.from(this.dashboards.values()).filter((d) => d.userId === userId)
      .length;
  }

  findById(id: string): Dashboard | undefined {
    return this.dashboards.get(id);
  }

  create(input: CreateDashboardInput): Dashboard {
    const dashboard: Dashboard = {
      id: crypto.randomUUID(),
      userId: input.userId,
      name: input.name,
      config: JSON.stringify(input.config || {}),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  update(id: string, updates: UpdateDashboardInput): Dashboard | undefined {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      return undefined;
    }

    const updatedDashboard: Dashboard = {
      ...dashboard,
      ...(updates.name && { name: updates.name }),
      ...(updates.config && { config: JSON.stringify(updates.config) }),
      updatedAt: new Date(),
    };

    this.dashboards.set(id, updatedDashboard);
    return updatedDashboard;
  }

  delete(id: string): boolean {
    return this.dashboards.delete(id);
  }
}

export const dashboardService = new DashboardService();
