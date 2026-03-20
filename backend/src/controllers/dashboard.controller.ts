import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import {
  CreateDashboardInput,
  UpdateDashboardInput,
  CreateWidgetInput,
  UpdateWidgetInput,
} from '../validators/dashboard.validator';
import { dashboardService } from '../services/dashboard.service';
import { widgetService } from '../services/widget.service';

/**
 * Get all dashboards for current user
 * GET /api/dashboards
 */
export const getDashboards = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // In production, get userId from authenticated user
    const userId = req.user?.id || 'default';

    const dashboards = dashboardService.findByUser(userId, { offset, limit });
    const total = dashboardService.countByUser(userId);

    res.json({
      success: true,
      data: {
        dashboards: dashboards.map((dashboard) => ({
          id: dashboard.id,
          userId: dashboard.userId,
          name: dashboard.name,
          config: JSON.parse(dashboard.config || '{}'),
          createdAt: dashboard.createdAt,
          updatedAt: dashboard.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new dashboard
 * POST /api/dashboards
 */
export const createDashboard = async (
  req: Request<{}, {}, CreateDashboardInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const dashboardData = req.body;
    
    // In production, get userId from authenticated user
    const userId = req.user?.id || 'default';

    const dashboard = dashboardService.create({
      ...dashboardData,
      userId,
    });

    res.status(201).json({
      success: true,
      data: {
        dashboard: {
          id: dashboard.id,
          userId: dashboard.userId,
          name: dashboard.name,
          config: JSON.parse(dashboard.config || '{}'),
          createdAt: dashboard.createdAt,
        },
        message: 'Dashboard created successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard by ID
 * GET /api/dashboards/:id
 */
export const getDashboardById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const dashboard = dashboardService.findById(id);

    if (!dashboard) {
      throw new AppError('Dashboard not found', 404);
    }

    res.json({
      success: true,
      data: {
        dashboard: {
          id: dashboard.id,
          userId: dashboard.userId,
          name: dashboard.name,
          config: JSON.parse(dashboard.config || '{}'),
          createdAt: dashboard.createdAt,
          updatedAt: dashboard.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update dashboard information
 * PUT /api/dashboards/:id
 */
export const updateDashboard = async (
  req: Request<{ id: string }, {}, UpdateDashboardInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const dashboard = dashboardService.findById(id);

    if (!dashboard) {
      throw new AppError('Dashboard not found', 404);
    }

    const updatedDashboard = dashboardService.update(id, updates);

    if (!updatedDashboard) {
      throw new AppError('Failed to update dashboard', 500);
    }

    console.log(`[Dashboard] Dashboard updated: ${id}`);

    res.json({
      success: true,
      data: {
        dashboard: {
          id: updatedDashboard.id,
          userId: updatedDashboard.userId,
          name: updatedDashboard.name,
          config: JSON.parse(updatedDashboard.config || '{}'),
          updatedAt: updatedDashboard.updatedAt,
        },
        message: 'Dashboard updated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete dashboard
 * DELETE /api/dashboards/:id
 */
export const deleteDashboard = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const dashboard = dashboardService.findById(id);

    if (!dashboard) {
      throw new AppError('Dashboard not found', 404);
    }

    const deleted = dashboardService.delete(id);

    if (!deleted) {
      throw new AppError('Failed to delete dashboard', 500);
    }

    console.log(`[Dashboard] Dashboard deleted: ${id}`);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Get all widgets for a dashboard
 * GET /api/dashboards/:id/widgets
 */
export const getDashboardWidgets = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: dashboardId } = req.params;

    const dashboard = dashboardService.findById(dashboardId);

    if (!dashboard) {
      throw new AppError('Dashboard not found', 404);
    }

    const widgets = widgetService.findByDashboard(dashboardId);

    res.json({
      success: true,
      data: {
        widgets: widgets.map((widget) => ({
          id: widget.id,
          dashboardId: widget.dashboardId,
          type: widget.type,
          config: JSON.parse(widget.config || '{}'),
          position: JSON.parse(widget.position || '{}'),
          createdAt: widget.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new widget in dashboard
 * POST /api/dashboards/:id/widgets
 */
export const createWidget = async (
  req: Request<{ id: string }, {}, CreateWidgetInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: dashboardId } = req.params;
    const widgetData = req.body;

    const dashboard = dashboardService.findById(dashboardId);

    if (!dashboard) {
      throw new AppError('Dashboard not found', 404);
    }

    const widget = widgetService.create({
      ...widgetData,
      dashboardId,
    });

    res.status(201).json({
      success: true,
      data: {
        widget: {
          id: widget.id,
          dashboardId: widget.dashboardId,
          type: widget.type,
          config: JSON.parse(widget.config || '{}'),
          position: JSON.parse(widget.position || '{}'),
          createdAt: widget.createdAt,
        },
        message: 'Widget created successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update widget configuration
 * PUT /api/dashboards/:dashboardId/widgets/:widgetId
 */
export const updateWidget = async (
  req: Request<{ dashboardId: string; widgetId: string }, {}, UpdateWidgetInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dashboardId, widgetId } = req.params;
    const updates = req.body;

    const widget = widgetService.findById(widgetId);

    if (!widget) {
      throw new AppError('Widget not found', 404);
    }

    if (widget.dashboardId !== dashboardId) {
      throw new AppError('Widget does not belong to specified dashboard', 400);
    }

    const updatedWidget = widgetService.update(widgetId, updates);

    if (!updatedWidget) {
      throw new AppError('Failed to update widget', 500);
    }

    console.log(`[Widget] Widget updated: ${widgetId}`);

    res.json({
      success: true,
      data: {
        widget: {
          id: updatedWidget.id,
          dashboardId: updatedWidget.dashboardId,
          type: updatedWidget.type,
          config: JSON.parse(updatedWidget.config || '{}'),
          position: JSON.parse(updatedWidget.position || '{}'),
        },
        message: 'Widget updated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete widget from dashboard
 * DELETE /api/dashboards/:dashboardId/widgets/:widgetId
 */
export const deleteWidget = async (
  req: Request<{ dashboardId: string; widgetId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dashboardId, widgetId } = req.params;

    const widget = widgetService.findById(widgetId);

    if (!widget) {
      throw new AppError('Widget not found', 404);
    }

    if (widget.dashboardId !== dashboardId) {
      throw new AppError('Widget does not belong to specified dashboard', 400);
    }

    const deleted = widgetService.delete(widgetId);

    if (!deleted) {
      throw new AppError('Failed to delete widget', 500);
    }

    console.log(`[Widget] Widget deleted: ${widgetId}`);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
