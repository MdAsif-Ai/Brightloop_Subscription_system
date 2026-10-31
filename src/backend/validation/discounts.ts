import { z } from 'zod';

export const discountTypeEnum = z.enum(['fixed', 'percentage']);

export const createDiscountRuleSchema = z.object({
  name: z.string().trim().min(1, { message: 'Discount rule name is required' }),
  discount_type: discountTypeEnum,
  value: z.coerce.number().int().min(0, { message: 'Discount value must be a non-negative integer' }),
  minimum_quantity: z.coerce.number().int().min(1, { message: 'minimum_quantity must be positive' }).optional().nullable(),
  minimum_spend_minor: z.coerce.number().int().min(0, { message: 'minimum_spend_minor must be non-negative' }).optional().nullable(),
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'starts_at must be YYYY-MM-DD' }),
  ends_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'ends_at must be YYYY-MM-DD' }),
  maximum_uses: z.coerce.number().int().min(1, { message: 'maximum_uses must be positive' }).optional().nullable(),
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }).optional().nullable(),
  active: z.boolean().default(true),
}).refine(
  (data) => data.ends_at >= data.starts_at,
  {
    message: 'ends_at cannot be earlier than starts_at',
    path: ['ends_at'],
  }
).refine(
  (data) => {
    if (data.discount_type === 'percentage') {
      return data.value <= 100;
    }
    return true;
  },
  {
    message: 'Percentage discount cannot exceed 100%',
    path: ['value'],
  }
);

export const updateDiscountRuleSchema = z.object({
  name: z.string().trim().min(1, { message: 'Discount rule name cannot be empty' }).optional(),
  discount_type: discountTypeEnum.optional(),
  value: z.coerce.number().int().min(0, { message: 'Discount value must be a non-negative integer' }).optional(),
  minimum_quantity: z.coerce.number().int().min(1, { message: 'minimum_quantity must be positive' }).optional().nullable(),
  minimum_spend_minor: z.coerce.number().int().min(0, { message: 'minimum_spend_minor must be non-negative' }).optional().nullable(),
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'starts_at must be YYYY-MM-DD' }).optional(),
  ends_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'ends_at must be YYYY-MM-DD' }).optional(),
  maximum_uses: z.coerce.number().int().min(1, { message: 'maximum_uses must be positive' }).optional().nullable(),
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }).optional().nullable(),
  active: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.starts_at && data.ends_at) {
      return data.ends_at >= data.starts_at;
    }
    return true;
  },
  {
    message: 'ends_at cannot be earlier than starts_at',
    path: ['ends_at'],
  }
).refine(
  (data) => {
    if (data.discount_type === 'percentage' && data.value !== undefined) {
      return data.value <= 100;
    }
    return true;
  },
  {
    message: 'Percentage discount cannot exceed 100%',
    path: ['value'],
  }
);

export const queryDiscountRuleSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  active: z.enum(['true', 'false']).optional(),
  discount_type: discountTypeEnum.optional(),
  product_id: z.string().uuid().optional(),
});

export type CreateDiscountRuleInput = z.infer<typeof createDiscountRuleSchema>;
export type UpdateDiscountRuleInput = z.infer<typeof updateDiscountRuleSchema>;
export type QueryDiscountRuleInput = z.infer<typeof queryDiscountRuleSchema>;
