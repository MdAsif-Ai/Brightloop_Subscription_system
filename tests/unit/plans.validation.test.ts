import { describe, it, expect } from 'vitest';
import { createPlanSchema, updatePlanSchema } from '@/backend/validation/plans';

describe('Plans Validation', () => {
  it('validates a correct subscription plan', () => {
    const input = {
      name: 'Growth Monthly Plan',
      description: 'Ideal for scaling businesses',
      billing_frequency: 'monthly',
      base_fee_minor: 499900,
      minimum_quantity: 1,
      available_from: '2026-01-01',
      available_until: '2026-12-31',
      allow_pause: true,
      allow_early_close: false,
      allow_renewal: true,
      auto_close_on_expiry: true,
    };

    const parsed = createPlanSchema.parse(input);
    expect(parsed.billing_frequency).toBe('monthly');
    expect(parsed.base_fee_minor).toBe(499900);
    expect(parsed.minimum_quantity).toBe(1);
  });

  it('rejects invalid billing frequency', () => {
    const input = {
      name: 'Invalid Frequency Plan',
      billing_frequency: 'hourly',
      base_fee_minor: 1000,
    };

    expect(() => createPlanSchema.parse(input)).toThrow();
  });

  it('rejects minimum_quantity less than 1', () => {
    const input = {
      name: 'Zero Quantity Plan',
      billing_frequency: 'yearly',
      base_fee_minor: 10000,
      minimum_quantity: 0,
    };

    expect(() => createPlanSchema.parse(input)).toThrow(/Minimum quantity must be at least 1/);
  });

  it('rejects available_until earlier than available_from', () => {
    const input = {
      name: 'Backwards Dates Plan',
      billing_frequency: 'weekly',
      base_fee_minor: 5000,
      available_from: '2026-10-01',
      available_until: '2026-05-01',
    };

    expect(() => createPlanSchema.parse(input)).toThrow(
      /available_until cannot be earlier than available_from/
    );
  });

  it('supports partial updates in updatePlanSchema', () => {
    const input = {
      base_fee_minor: 599900,
      allow_pause: false,
    };

    const parsed = updatePlanSchema.parse(input);
    expect(parsed.base_fee_minor).toBe(599900);
    expect(parsed.allow_pause).toBe(false);
  });
});
