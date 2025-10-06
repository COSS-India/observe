import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  login: z.string().min(3, 'Login must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  OrgId: z.number().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  login: z.string().min(3, 'Login must be at least 3 characters').optional(),
  theme: z.string().optional(),
});

// Organization validation schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

// Team validation schemas
export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  email: z.string().email('Invalid email address').optional(),
  orgId: z.number().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;
export type CreateTeamFormData = z.infer<typeof createTeamSchema>;
