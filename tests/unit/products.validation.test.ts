import { describe, it, expect } from 'vitest';
import {
  createProductSchema,
  updateProductSchema,
  queryProductSchema,
} from '@/backend/validation/products';

describe('Products Validation', () => {
  it('validates a standard product with variants', () => {
    const input = {
      name: 'Enterprise ERP',
      type: 'software',
      price_minor: 200000,
      cost_minor: 80000,
      notes: 'Main subscription package',
      variants: [
        { name: 'Odoo Addon', price_delta_minor: 56000 },
        { name: 'Discounted Tier', price_delta_minor: -20000 },
      ],
    };

    const parsed = createProductSchema.parse(input);
    expect(parsed.name).toBe('Enterprise ERP');
    expect(parsed.price_minor).toBe(200000);
    expect(parsed.variants).toHaveLength(2);
    expect(parsed.active).toBe(true);
  });

  it('rejects negative base price', () => {
    const input = {
      name: 'Faulty Product',
      price_minor: -500,
      cost_minor: 100,
    };

    expect(() => createProductSchema.parse(input)).toThrow(/Base price must be a non-negative integer/);
  });

  it('rejects negative cost price', () => {
    const input = {
      name: 'Faulty Cost Product',
      price_minor: 1000,
      cost_minor: -50,
    };

    expect(() => createProductSchema.parse(input)).toThrow(/Cost price must be a non-negative integer/);
  });

  it('rejects variants that result in a negative effective price', () => {
    const input = {
      name: 'Enterprise ERP',
      price_minor: 2000,
      cost_minor: 500,
      variants: [
        { name: 'Heavy Subsidy', price_delta_minor: -3000 }, // 2000 + (-3000) = -1000
      ],
    };

    expect(() => createProductSchema.parse(input)).toThrow(
      /Variant price adjustment cannot result in a negative effective price/
    );
  });

  it('validates partial update schema', () => {
    const updateInput = {
      price_minor: 250000,
      notes: 'Updated price',
    };

    const parsed = updateProductSchema.parse(updateInput);
    expect(parsed.price_minor).toBe(250000);
    expect(parsed.name).toBeUndefined();
  });

  it('validates pagination query schema with defaults and clamp', () => {
    const query = queryProductSchema.parse({
      page: '2',
      page_size: '50',
      active: 'true',
      search: 'ERP',
    });

    expect(query.page).toBe(2);
    expect(query.page_size).toBe(50);
    expect(query.active).toBe('true');
    expect(query.search).toBe('ERP');
  });
});
