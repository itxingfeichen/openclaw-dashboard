import { z } from 'zod';

export const dashboardConfigSchema = z.object({
  body: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    language: z.string().max(10, 'Language code must be less than 10 characters').optional(),
    timezone: z.string().max(50, 'Timezone must be less than 50 characters').optional(),
    refreshInterval: z.number().int().positive('Refresh interval must be positive').optional(),
    widgets: z
      .array(
        z.object({
          id: z.string(),
          type: z.string(),
          position: z.object({
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number(),
          }),
          visible: z.boolean(),
        })
      )
      .optional(),
  }),
});

export type DashboardConfigInput = z.infer<typeof dashboardConfigSchema>['body'];
