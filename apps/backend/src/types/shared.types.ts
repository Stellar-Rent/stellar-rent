import { z } from 'zod';

// Common validation schemas
export const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 50, 'Limit must be between 1 and 50'),
});

export const locationQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Query must be at least 1 character')
    .max(100, 'Query must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-'.,áéíóúñüÁÉÍÓÚÑÜ]+$/, 'Query contains invalid characters'),
});

// Common response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> extends ApiResponse {
  data?: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
}

// Error response helpers
export const formatSuccessResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

export const formatErrorResponse = (error: string, details?: unknown): ApiResponse => ({
  success: false,
  error,
  details,
});
