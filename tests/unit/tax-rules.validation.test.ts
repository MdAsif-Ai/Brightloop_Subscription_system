import { describe, it, expect } from 'vitest';
import { createTaxRuleSchema, updateTaxRuleSchema } from '@/backend/validation/tax-rules';

describe('Tax Rules Validation', () => {
  it('validates a standard GST rate in basis points', () => {
    const input = {
      name: 'GST 18%',
      rate_basis_points: 1800,
      active: true,
    };

    const parsed = createTaxRuleSchema.parse(input);
    expect(parsed.name).toBe('GST 18%');
    expect(parsed.rate_basis_points).toBe(1800);
    expect(parsed.active).toBe(true);
  });

  it('rejects negative rate basis points', () => {
    const input = {
      name: 'Negative Tax',
      rate_basis_points: -50,
    };

    expect(() => createTaxRuleSchema.parse(input)).toThrow(/rate_basis_points must be a non-negative integer/);
  });

  it('rejects empty name', () => {
    const input = {
      name: '',
      rate_basis_points: 500,
    };

    expect(() => createTaxRuleSchema.parse(input)).toThrow(/Tax rule name is required/);
  });

  it('validates updateTaxRuleSchema with partial fields', () => {
    const input = {
      rate_basis_points: 2000,
    };

    const parsed = updateTaxRuleSchema.parse(input);
    expect(parsed.rate_basis_points).toBe(2000);
    expect(parsed.name).toBeUndefined();
  });
});
