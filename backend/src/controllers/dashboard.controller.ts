import { Request, Response, NextFunction } from 'express';
import { DashboardConfigInput } from '../validators/dashboard.validator';

// Mock dashboard config storage (replace with database in production)
const dashboardConfigs: Map<string, any> = new Map();

export const getDashboardConfig = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // In production, get config for authenticated user
    const config = dashboardConfigs.get('default') || {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      refreshInterval: 30000,
      widgets: [],
    };

    res.json({
      success: true,
      data: {
        config,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDashboardConfig = async (
  _req: Request<{}, {}, DashboardConfigInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const updates = _req.body;

    // Get existing config
    const existingConfig = dashboardConfigs.get('default') || {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      refreshInterval: 30000,
      widgets: [],
    };

    // Merge updates
    const updatedConfig = {
      ...existingConfig,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    dashboardConfigs.set('default', updatedConfig);

    console.log(`[Dashboard] Configuration updated`);

    res.json({
      success: true,
      data: {
        config: updatedConfig,
        message: 'Dashboard configuration updated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};
