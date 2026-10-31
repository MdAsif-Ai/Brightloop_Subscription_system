import { z } from 'zod';

export const createProductVariantSchema = z.object({
  name: z.string().trim().min(1, { message: 'Variant name is required' }),
  price_delta_minor: z.coerce.number().int({ message: 'Price delta must be an integer' }),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, { message: 'Product name is required' }),
  type: z.string().trim().optional().nullable(),
  price_minor: z.coerce.number().int().min(0, { message: 'Base price must be a non-negative integer' }),
  cost_minor: z.coerce.number().int().min(0, { message: 'Cost price must be a non-negative integer' }),
  notes: z.string().trim().optional().nullable(),
  active: z.boolean().default(true),
  variants: z.array(createProductVariantSchema).optional().default([]),
}).refine(
  (data) => {
    // Effective price (price_minor + variant.price_delta_minor) must not be negative
    if (data.variants && data.variants.length > 0) {
      return data.variants.every((v) => data.price_minor + v.price_delta_minor >= 0);
    }
    return true;
  },
  {
    message: 'Variant price adjustment cannot result in a negative effective price',
    path: ['variants'],
  }
);

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, { message: 'Product name cannot be empty' }).optional(),
  type: z.string().trim().optional().nullable(),
  price_minor: z.coerce.number().int().min(0, { message: 'Base price must be a non-negative integer' }).optional(),
  cost_minor: z.coerce.number().int().min(0, { message: 'Cost price must be a non-negative integer' }).optional(),
  notes: z.string().trim().optional().nullable(),
  active: z.boolean().optional(),
  variants: z.array(createProductVariantSchema).optional(),
}).refine(
  (data) => {
    if (data.price_minor !== undefined && data.variants && data.variants.length > 0) {
      return data.variants.every((v) => (data.price_minor ?? 0) + v.price_delta_minor >= 0);
    }
    return true;
  },
  {
    message: 'Variant price adjustment cannot result in a negative effective price',
    path: ['variants'],
  }
);

export const queryProductSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  active: z.enum(['true', 'false']).optional(),
  type: z.string().trim().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;
export type QueryProductInput = z.infer<typeof queryProductSchema>;
