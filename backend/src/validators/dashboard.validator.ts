import { z } from 'zod';

/**
 * Schema for creating a new dashboard
 */
export const createDashboardSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Dashboard name is required')
      .max(100, 'Dashboard name must be less than 100 characters'),
    config: z
      .record(z.string(), z.any())
      .optional(),
  }),
});

/**
 * Schema for updating a dashboard
 */
export const updateDashboardSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid dashboard ID format').or(z.string().cuid()),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Dashboard name is required')
      .max(100, 'Dashboard name must be less than 100 characters')
      .optional(),
    config: z
      .record(z.string(), z.any())
      .optional(),
  }),
});

/**
 * Schema for creating a new widget
 */
export const createWidgetSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid dashboard ID format').or(z.string().cuid()),
  }),
  body: z.object({
    type: z
      .string()
      .min(1, 'Widget type is required')
      .max(50, 'Widget type must be less than 50 characters'),
    config: z
      .record(z.string(), z.any())
      .optional(),
    position: z
      .object({
        x: z.number().int().default(0),
        y: z.number().int().default(0),
        w: z.number().int().positive().default(4),
        h: z.number().int().positive().default(4),
      })
      .optional(),
  }),
});

/**
 * Schema for updating a widget
 */
export const updateWidgetSchema = z.object({
  params: z.object({
    dashboardId: z.string().uuid('Invalid dashboard ID format').or(z.string().cuid()),
    widgetId: z.string().uuid('Invalid widget ID format').or(z.string().cuid()),
  }),
  body: z.object({
    type: z
      .string()
      .min(1, 'Widget type is required')
      .max(50, 'Widget type must be less than 50 characters')
      .optional(),
    config: z
      .record(z.string(), z.any())
      .optional(),
    position: z
      .object({
        x: z.number().int(),
        y: z.number().int(),
        w: z.number().int().positive(),
        h: z.number().int().positive(),
      })
      .optional(),
  }),
});

export type CreateDashboardInput = z.infer<typeof createDashboardSchema>['body'];
export type UpdateDashboardInput = z.infer<typeof updateDashboardSchema>['body'];
export type CreateWidgetInput = z.infer<typeof createWidgetSchema>['body'];
export type UpdateWidgetInput = z.infer<typeof updateWidgetSchema>['body'];
