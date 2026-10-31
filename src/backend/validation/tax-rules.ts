import { z } from 'zod';

export const createTaxRuleSchema = z.object({
  name: z.string().trim().min(1, { message: 'Tax rule name is required' }),
  rate_basis_points: z.coerce.number().int().min(0, { message: 'rate_basis_points must be a non-negative integer' }),
  active: z.boolean().default(true),
});

export const updateTaxRuleSchema = z.object({
  name: z.string().trim().min(1, { message: 'Tax rule name cannot be empty' }).optional(),
  rate_basis_points: z.coerce.number().int().min(0, { message: 'rate_basis_points must be a non-negative integer' }).optional(),
  active: z.boolean().optional(),
});

export const queryTaxRuleSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  active: z.enum(['true', 'false']).optional(),
});

export type CreateTaxRuleInput = z.infer<typeof createTaxRuleSchema>;
export type UpdateTaxRuleInput = z.infer<typeof updateTaxRuleSchema>;
export type QueryTaxRuleInput = z.infer<typeof queryTaxRuleSchema>;
