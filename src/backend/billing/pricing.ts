import { DiscountRule, TaxRule } from '@/shared/types';

export interface PricingItemInput {
  product_id: string;
  product_name: string;
  variant_id?: string | null;
  variant_name?: string | null;
  unit_price_minor: number;
  quantity: number;
  tax_rule_id?: string | null;
}

export interface PricingCalculationResult {
  items: Array<{
    product_id: string;
    product_name: string;
    variant_name?: string | null;
    quantity: number;
    unit_price_minor: number;
    subtotal_minor: number;
    discount_minor: number;
    taxable_minor: number;
    tax_minor: number;
    total_minor: number;
    pricing_trace: Record<string, unknown>;
  }>;
  base_fee_minor: number;
  subtotal_minor: number;
  discount_minor: number;
  taxable_minor: number;
  tax_minor: number;
  total_minor: number;
  discount_applied?: {
    id: string;
    name: string;
    amount_minor: number;
  } | null;
}

/**
 * Deterministic financial pricing calculation.
 * All amounts are computed in integer minor currency units (paise).
 */
export function calculateInvoicePricing(params: {
  items: PricingItemInput[];
  base_fee_minor?: number;
  discount?: DiscountRule | null;
  taxRule?: TaxRule | null;
  asOfDate?: string;
}): PricingCalculationResult {
  const asOf = params.asOfDate || new Date().toISOString().split('T')[0];
  const baseFee = params.base_fee_minor || 0;

  let itemsSubtotal = 0;
  const processedItems = params.items.map((it) => {
    const itemSubtotal = it.unit_price_minor * it.quantity;
    itemsSubtotal += itemSubtotal;
    return {
      product_id: it.product_id,
      product_name: it.product_name,
      variant_name: it.variant_name || null,
      quantity: it.quantity,
      unit_price_minor: it.unit_price_minor,
      subtotal_minor: itemSubtotal,
    };
  });

  const grossSubtotal = itemsSubtotal + baseFee;

  // Evaluate discount eligibility
  let discountAmount = 0;
  let appliedDiscount: { id: string; name: string; amount_minor: number } | null = null;

  if (params.discount && params.discount.active) {
    const disc = params.discount;
    const isDateValid = asOf >= disc.starts_at && asOf <= disc.ends_at;
    const isUsageValid = disc.maximum_uses == null || disc.used_count < disc.maximum_uses;

    // Check minimum spend & quantity across applicable items
    let applicableSubtotal = 0;
    let applicableQty = 0;

    for (const it of processedItems) {
      if (!disc.product_id || disc.product_id === it.product_id) {
        applicableSubtotal += it.subtotal_minor;
        applicableQty += it.quantity;
      }
    }

    const isSpendValid = disc.minimum_spend_minor == null || applicableSubtotal >= disc.minimum_spend_minor;
    const isQtyValid = disc.minimum_quantity == null || applicableQty >= disc.minimum_quantity;

    if (isDateValid && isUsageValid && isSpendValid && isQtyValid && applicableSubtotal > 0) {
      if (disc.discount_type === 'percentage') {
        discountAmount = Math.round((applicableSubtotal * disc.value) / 100);
      } else {
        discountAmount = disc.value;
      }

      if (discountAmount > grossSubtotal) {
        discountAmount = grossSubtotal;
      }

      appliedDiscount = {
        id: disc.id,
        name: disc.name,
        amount_minor: discountAmount,
      };
    }
  }

  const taxableAmount = Math.max(0, grossSubtotal - discountAmount);

  // Evaluate tax (using basis points: 1800 bp = 18%)
  const rateBp = params.taxRule && params.taxRule.active ? params.taxRule.rate_basis_points : 0;
  const taxAmount = Math.round((taxableAmount * rateBp) / 10000);

  const grandTotal = taxableAmount + taxAmount;

  // Allocate discount and tax proportionally across line items for explainability
  const finalItems = processedItems.map((it) => {
    const itemDiscount = grossSubtotal > 0 ? Math.round((it.subtotal_minor / grossSubtotal) * discountAmount) : 0;
    const itemTaxable = Math.max(0, it.subtotal_minor - itemDiscount);
    const itemTax = rateBp > 0 ? Math.round((itemTaxable * rateBp) / 10000) : 0;
    const itemTotal = itemTaxable + itemTax;

    return {
      ...it,
      discount_minor: itemDiscount,
      taxable_minor: itemTaxable,
      tax_minor: itemTax,
      total_minor: itemTotal,
      pricing_trace: {
        unit_price_minor: it.unit_price_minor,
        quantity: it.quantity,
        subtotal_minor: it.subtotal_minor,
        allocated_discount_minor: itemDiscount,
        tax_basis_points: rateBp,
        allocated_tax_minor: itemTax,
        final_total_minor: itemTotal,
      },
    };
  });

  return {
    items: finalItems,
    base_fee_minor: baseFee,
    subtotal_minor: grossSubtotal,
    discount_minor: discountAmount,
    taxable_minor: taxableAmount,
    tax_minor: taxAmount,
    total_minor: grandTotal,
    discount_applied: appliedDiscount,
  };
}
