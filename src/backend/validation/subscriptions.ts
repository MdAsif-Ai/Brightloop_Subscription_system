import { z } from 'zod';

export const subscriptionItemInputSchema = z.object({
  product_id: z.string().uuid({ message: 'product_id must be a valid UUID' }),
  variant_id: z.string().uuid({ message: 'variant_id must be a valid UUID' }).optional().nullable(),
  quantity: z.coerce.number().int().min(1, { message: 'Quantity must be at least 1' }),
  unit_price_minor: z.coerce.number().int().min(0).optional(),
  tax_rule_id: z.string().uuid({ message: 'tax_rule_id must be a valid UUID' }).optional().nullable(),
});

export const subscriptionStatusEnum = z.enum([
  'draft',
  'quotation',
  'confirmed',
  'active',
  'paused',
  'closed',
]);

export const createSubscriptionSchema = z.object({
  customer_id: z.string().uuid({ message: 'customer_id must be a valid UUID' }),
  plan_id: z.string().uuid({ message: 'plan_id must be a valid UUID' }),
  status: subscriptionStatusEnum.default('active'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'start_date must be YYYY-MM-DD' }),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'expiry_date must be YYYY-MM-DD' }),
  payment_terms_days: z.coerce.number().int().min(0).default(30),
  billing_anchor_day: z.coerce.number().int().min(1).max(28).optional().nullable(),
  quote_valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'quote_valid_until must be YYYY-MM-DD' }).optional().nullable(),
  discount_rule_id: z.string().uuid({ message: 'discount_rule_id must be a valid UUID' }).optional().nullable(),
  plan_tax_rule_id: z.string().uuid({ message: 'plan_tax_rule_id must be a valid UUID' }).optional().nullable(),
  items: z.array(subscriptionItemInputSchema).min(1, { message: 'Subscription must contain at least one item' }),
}).refine(
  (data) => data.expiry_date >= data.start_date,
  {
    message: 'expiry_date cannot be earlier than start_date',
    path: ['expiry_date'],
  }
);

export const updateSubscriptionSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  payment_terms_days: z.coerce.number().int().min(0).optional(),
  billing_anchor_day: z.coerce.number().int().min(1).max(28).optional().nullable(),
  discount_rule_id: z.string().uuid().optional().nullable(),
  plan_tax_rule_id: z.string().uuid().optional().nullable(),
  items: z.array(subscriptionItemInputSchema).optional(),
});

export const transitionSubscriptionSchema = z.object({
  to_status: subscriptionStatusEnum,
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reason: z.string().trim().optional(),
});

export const querySubscriptionSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  customer_id: z.string().uuid().optional(),
  plan_id: z.string().uuid().optional(),
  status: subscriptionStatusEnum.optional(),
  search: z.string().trim().optional(),
});

export const createQuotationSchema = z.object({
  customer_id: z.string().uuid({ message: 'customer_id must be a valid UUID' }),
  plan_id: z.string().uuid({ message: 'plan_id must be a valid UUID' }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'start_date must be YYYY-MM-DD' }),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'expiry_date must be YYYY-MM-DD' }),
  quote_valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'quote_valid_until must be YYYY-MM-DD' }),
  payment_terms_days: z.coerce.number().int().min(0).default(30),
  discount_rule_id: z.string().uuid().optional().nullable(),
  plan_tax_rule_id: z.string().uuid().optional().nullable(),
  items: z.array(subscriptionItemInputSchema).min(1, { message: 'Quotation must contain at least one item' }),
}).refine(
  (data) => data.expiry_date >= data.start_date,
  {
    message: 'expiry_date cannot be earlier than start_date',
    path: ['expiry_date'],
  }
).refine(
  (data) => data.quote_valid_until >= data.start_date,
  {
    message: 'quote_valid_until cannot be earlier than start_date',
    path: ['quote_valid_until'],
  }
);

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type TransitionSubscriptionInput = z.infer<typeof transitionSubscriptionSchema>;
export type QuerySubscriptionInput = z.infer<typeof querySubscriptionSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
