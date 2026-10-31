import { describe, it, expect } from 'vitest';
import { calculateInvoicePricing, PricingItemInput } from '@/backend/billing/pricing';
import { advanceDateByFrequency, addDaysToDate } from '@/backend/billing/engine';
import { DiscountRule, TaxRule } from '@/shared/types';

describe('Financial Pricing & Billing Calculations', () => {
  it('computes exact paise matching the specification example', () => {
    // Specification:
    // Base price: ₹2,000 (200000 paise)
    // Variant adjustment: ₹560 (56000 paise)
    // Unit price: ₹2,560 (256000 paise)
    // Quantity: 10
    // Subtotal: ₹25,600 (2560000 paise)
    // 10% discount: ₹2,560 (256000 paise)
    // Taxable amount: ₹23,040 (2304000 paise)
    // 18% tax (1800 bp): ₹4,147.20 (414720 paise)
    // Final total: ₹27,187.20 (2718720 paise)

    const items: PricingItemInput[] = [
      {
        product_id: 'prod-erp',
        product_name: 'Enterprise ERP',
        variant_id: 'var-odoo',
        variant_name: 'Odoo Addon',
        unit_price_minor: 256000, // 200000 base + 56000 variant
        quantity: 10,
      },
    ];

    const discount: DiscountRule = {
      id: 'disc-10',
      name: '10% Discount',
      discount_type: 'percentage',
      value: 10,
      starts_at: '2026-01-01',
      ends_at: '2026-12-31',
      used_count: 0,
      active: true,
    };

    const taxRule: TaxRule = {
      id: 'tax-18',
      name: 'GST 18%',
      rate_basis_points: 1800, // 18%
      active: true,
    };

    const result = calculateInvoicePricing({
      items,
      base_fee_minor: 0,
      discount,
      taxRule,
      asOfDate: '2026-10-31',
    });

    expect(result.subtotal_minor).toBe(2560000); // ₹25,600
    expect(result.discount_minor).toBe(256000);  // ₹2,560
    expect(result.taxable_minor).toBe(2304000);  // ₹23,040
    expect(result.tax_minor).toBe(414720);       // ₹4,147.20
    expect(result.total_minor).toBe(2718720);    // ₹27,187.20
    expect(result.items[0].pricing_trace).toBeDefined();
  });

  it('does not apply discount if asOfDate is after ends_at (expired)', () => {
    const items: PricingItemInput[] = [
      {
        product_id: 'p1',
        product_name: 'Product 1',
        unit_price_minor: 100000,
        quantity: 1,
      },
    ];

    const expiredDiscount: DiscountRule = {
      id: 'disc-exp',
      name: 'Expired 20%',
      discount_type: 'percentage',
      value: 20,
      starts_at: '2025-01-01',
      ends_at: '2025-12-31',
      used_count: 0,
      active: true,
    };

    const result = calculateInvoicePricing({
      items,
      discount: expiredDiscount,
      asOfDate: '2026-10-31',
    });

    expect(result.discount_minor).toBe(0);
    expect(result.discount_applied).toBeNull();
  });

  it('does not apply discount if used_count reaches maximum_uses', () => {
    const items: PricingItemInput[] = [
      {
        product_id: 'p1',
        product_name: 'Product 1',
        unit_price_minor: 100000,
        quantity: 1,
      },
    ];

    const exhaustedDiscount: DiscountRule = {
      id: 'disc-max',
      name: 'Exhausted 20%',
      discount_type: 'percentage',
      value: 20,
      starts_at: '2026-01-01',
      ends_at: '2026-12-31',
      maximum_uses: 10,
      used_count: 10,
      active: true,
    };

    const result = calculateInvoicePricing({
      items,
      discount: exhaustedDiscount,
      asOfDate: '2026-10-31',
    });

    expect(result.discount_minor).toBe(0);
  });

  it('advances dates accurately across billing frequencies', () => {
    expect(advanceDateByFrequency('2026-10-31', 'daily')).toBe('2026-11-01');
    expect(advanceDateByFrequency('2026-10-31', 'weekly')).toBe('2026-11-07');
    expect(advanceDateByFrequency('2026-10-31', 'monthly')).toBe('2026-12-01'); // JS Date roll from Oct 31 + 1 mo = Dec 1
    expect(advanceDateByFrequency('2026-10-31', 'yearly')).toBe('2027-10-31');

    expect(addDaysToDate('2026-10-31', 30)).toBe('2026-11-30');
  });
});
