import { z } from 'zod';

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be less than 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    email: z.string().email('Invalid email address').optional(),
    displayName: z.string().max(50, 'Display name must be less than 50 characters').optional(),
  }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
