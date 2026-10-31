import { z } from 'zod';

export const createCustomerSchema = z.object({
  company_name: z.string().trim().optional().nullable(),
  contact_name: z.string().trim().optional().nullable(),
  email: z.string().trim().email({ message: 'Valid email address is required' }),
  billing_address: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  user_id: z.string().uuid({ message: 'user_id must be a valid UUID' }).optional().nullable(),
});

export const updateCustomerSchema = z.object({
  company_name: z.string().trim().optional().nullable(),
  contact_name: z.string().trim().optional().nullable(),
  email: z.string().trim().email({ message: 'Valid email address is required' }).optional(),
  billing_address: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  user_id: z.string().uuid({ message: 'user_id must be a valid UUID' }).optional().nullable(),
});

export const queryCustomerSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type QueryCustomerInput = z.infer<typeof queryCustomerSchema>;
