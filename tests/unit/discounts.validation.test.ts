import { describe, it, expect } from 'vitest';
import { createDiscountRuleSchema, updateDiscountRuleSchema } from '@/backend/validation/discounts';

describe('Discount Rules Validation', () => {
  it('validates a percentage discount', () => {
    const input = {
      name: 'Diwali Special',
      discount_type: 'percentage',
      value: 20,
      minimum_spend_minor: 50000,
      starts_at: '2026-10-01',
      ends_at: '2026-11-15',
      maximum_uses: 100,
      active: true,
    };

    const parsed = createDiscountRuleSchema.parse(input);
    expect(parsed.discount_type).toBe('percentage');
    expect(parsed.value).toBe(20);
    expect(parsed.maximum_uses).toBe(100);
  });

  it('validates a fixed discount', () => {
    const input = {
      name: 'Flat ₹500 Off',
      discount_type: 'fixed',
      value: 50000, // 50000 paise
      starts_at: '2026-01-01',
      ends_at: '2026-12-31',
    };

    const parsed = createDiscountRuleSchema.parse(input);
    expect(parsed.discount_type).toBe('fixed');
    expect(parsed.value).toBe(50000);
  });

  it('rejects percentage discount greater than 100%', () => {
    const input = {
      name: 'Impossible Discount',
      discount_type: 'percentage',
      value: 120,
      starts_at: '2026-01-01',
      ends_at: '2026-02-01',
    };

    expect(() => createDiscountRuleSchema.parse(input)).toThrow(
      /Percentage discount cannot exceed 100%/
    );
  });

  it('rejects ends_at earlier than starts_at', () => {
    const input = {
      name: 'Time Inverted Discount',
      discount_type: 'fixed',
      value: 1000,
      starts_at: '2026-12-31',
      ends_at: '2026-01-01',
    };

    expect(() => createDiscountRuleSchema.parse(input)).toThrow(
      /ends_at cannot be earlier than starts_at/
    );
  });

  it('rejects negative discount value', () => {
    const input = {
      name: 'Negative Value',
      discount_type: 'fixed',
      value: -100,
      starts_at: '2026-01-01',
      ends_at: '2026-02-01',
    };

    expect(() => createDiscountRuleSchema.parse(input)).toThrow(/Discount value must be a non-negative integer/);
  });

  it('validates updateDiscountRuleSchema', () => {
    const input = {
      value: 25,
      active: false,
    };

    const parsed = updateDiscountRuleSchema.parse(input);
    expect(parsed.value).toBe(25);
    expect(parsed.active).toBe(false);
  });
});
