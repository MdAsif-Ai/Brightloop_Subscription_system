import { z } from 'zod';

export const billingFrequencyEnum = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

export const createPlanSchema = z.object({
  name: z.string().trim().min(1, { message: 'Plan name is required' }),
  description: z.string().trim().optional().nullable(),
  billing_frequency: billingFrequencyEnum,
  base_fee_minor: z.coerce.number().int().min(0, { message: 'Base fee must be a non-negative integer' }),
  minimum_quantity: z.coerce.number().int().min(1, { message: 'Minimum quantity must be at least 1' }).default(1),
  available_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'available_from must be YYYY-MM-DD' }).optional().nullable(),
  available_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'available_until must be YYYY-MM-DD' }).optional().nullable(),
  allow_pause: z.boolean().default(false),
  allow_early_close: z.boolean().default(false),
  allow_renewal: z.boolean().default(false),
  auto_close_on_expiry: z.boolean().default(false),
  tax_rule_id: z.string().uuid({ message: 'tax_rule_id must be a valid UUID' }).optional().nullable(),
  active: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.available_from && data.available_until) {
      return data.available_until >= data.available_from;
    }
    return true;
  },
  {
    message: 'available_until cannot be earlier than available_from',
    path: ['available_until'],
  }
);

export const updatePlanSchema = z.object({
  name: z.string().trim().min(1, { message: 'Plan name cannot be empty' }).optional(),
  description: z.string().trim().optional().nullable(),
  billing_frequency: billingFrequencyEnum.optional(),
  base_fee_minor: z.coerce.number().int().min(0, { message: 'Base fee must be a non-negative integer' }).optional(),
  minimum_quantity: z.coerce.number().int().min(1, { message: 'Minimum quantity must be at least 1' }).optional(),
  available_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'available_from must be YYYY-MM-DD' }).optional().nullable(),
  available_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'available_until must be YYYY-MM-DD' }).optional().nullable(),
  allow_pause: z.boolean().optional(),
  allow_early_close: z.boolean().optional(),
  allow_renewal: z.boolean().optional(),
  auto_close_on_expiry: z.boolean().optional(),
  tax_rule_id: z.string().uuid({ message: 'tax_rule_id must be a valid UUID' }).optional().nullable(),
  active: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.available_from && data.available_until) {
      return data.available_until >= data.available_from;
    }
    return true;
  },
  {
    message: 'available_until cannot be earlier than available_from',
    path: ['available_until'],
  }
);

export const queryPlanSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  active: z.enum(['true', 'false']).optional(),
  billing_frequency: billingFrequencyEnum.optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type QueryPlanInput = z.infer<typeof queryPlanSchema>;
