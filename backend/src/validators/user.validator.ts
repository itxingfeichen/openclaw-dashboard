import { z } from 'zod';

/**
 * Schema for creating a new user
 */
export const createUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be less than 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().max(50, 'Name must be less than 50 characters').optional(),
    role: z.enum(['user', 'admin']).optional(),
  }),
});

/**
 * Schema for updating a user
 */
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format').or(z.string().cuid()),
  }),
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be less than 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    email: z.string().email('Invalid email address').optional(),
    name: z.string().max(50, 'Name must be less than 50 characters').optional(),
    displayName: z.string().max(50, 'Display name must be less than 50 characters').optional(),
    role: z.enum(['user', 'admin']).optional(),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
