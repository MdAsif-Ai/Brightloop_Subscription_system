import { supabase } from '@/backend/database/client';
import { calculateInvoicePricing, PricingItemInput } from './pricing';
import { BillingFrequency, DiscountRule, TaxRule } from '@/shared/types';
import { recordAuditEvent } from '@/backend/services/audit';

export function advanceDateByFrequency(dateStr: string, frequency: BillingFrequency): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  switch (frequency) {
    case 'daily':
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'monthly':
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case 'yearly':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }
  return d.toISOString().split('T')[0];
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

export interface IssueDueInvoiceResult {
  status: 'created' | 'already_billed' | 'skipped' | 'error';
  invoice_id?: string;
  invoice_number?: string;
  total_minor?: number;
  message?: string;
}

export const billingEngine = {
  /**
   * Generates a recurring invoice atomically for an active subscription period.
   * Enforces zero duplicates, deterministic pricing, and advances the next billing date.
   */
  async issueDueInvoice(
    subscriptionId: string,
    asOfDate: string,
    actorId?: string | null
  ): Promise<IssueDueInvoiceResult> {
    try {
      // 1. Fetch subscription details
      const { data: sub, error: subErr } = await supabase
        .from('subscriptions')
        .select(`
          *,
          items:subscription_items(*),
          plan:plans(*),
          customer:customers(*)
        `)
        .eq('id', subscriptionId)
        .single();

      if (subErr || !sub) {
        return { status: 'error', message: `Subscription '${subscriptionId}' not found` };
      }

      if (sub.status !== 'active') {
        return { status: 'skipped', message: `Subscription is in '${sub.status}' state (not active)` };
      }

      const periodStart = sub.next_billing_on;
      if (periodStart > asOfDate) {
        return { status: 'skipped', message: `Not eligible for billing yet (next billing: ${periodStart}, as of: ${asOfDate})` };
      }

      // 2. Prevent duplicate invoices for the same period cycle
      const { data: existingInv } = await supabase
        .from('invoices')
        .select('id, number, total_minor')
        .eq('subscription_id', subscriptionId)
        .eq('period_start', periodStart)
        .maybeSingle();

      if (existingInv) {
        return {
          status: 'already_billed',
          invoice_id: existingInv.id,
          invoice_number: existingInv.number,
          total_minor: existingInv.total_minor,
          message: 'An invoice for this billing period already exists',
        };
      }

      // 3. Load tax rule and discount rule
      let taxRule: TaxRule | null = null;
      const taxRuleId = sub.plan_tax_rule_id || sub.plan?.tax_rule_id;
      if (taxRuleId) {
        const { data: tr } = await supabase.from('tax_rules').select('*').eq('id', taxRuleId).maybeSingle();
        taxRule = tr as TaxRule;
      }

      let discountRule: DiscountRule | null = null;
      if (sub.discount_rule_id) {
        const { data: dr } = await supabase.from('discount_rules').select('*').eq('id', sub.discount_rule_id).maybeSingle();
        discountRule = dr as DiscountRule;
      }

      // 4. Resolve item product names
      const pricingItems: PricingItemInput[] = [];
      for (const it of sub.items || []) {
        const { data: prod } = await supabase.from('products').select('name').eq('id', it.product_id).maybeSingle();
        let varName: string | null = null;
        if (it.variant_id) {
          const { data: vr } = await supabase.from('product_variants').select('name').eq('id', it.variant_id).maybeSingle();
          varName = vr?.name || null;
        }

        pricingItems.push({
          product_id: it.product_id,
          product_name: prod?.name || 'Subscription Product',
          variant_id: it.variant_id,
          variant_name: varName,
          unit_price_minor: it.unit_price_minor,
          quantity: it.quantity,
          tax_rule_id: it.tax_rule_id,
        });
      }

      // 5. Calculate financial amounts
      const pricing = calculateInvoicePricing({
        items: pricingItems,
        base_fee_minor: sub.base_fee_snapshot_minor || 0,
        discount: discountRule,
        taxRule,
        asOfDate,
      });

      const frequency: BillingFrequency = sub.plan?.billing_frequency || 'monthly';
      const periodEnd = advanceDateByFrequency(periodStart, frequency);
      const dueDate = addDaysToDate(asOfDate, sub.payment_terms_days ?? 30);
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 6. Insert invoice
      const { data: createdInv, error: invErr } = await supabase
        .from('invoices')
        .insert({
          number: invoiceNumber,
          subscription_id: sub.id,
          customer_id: sub.customer_id,
          period_start: periodStart,
          period_end: periodEnd,
          issued_on: asOfDate,
          due_date: dueDate,
          status: 'confirmed',
          subtotal_minor: pricing.subtotal_minor,
          discount_minor: pricing.discount_minor,
          tax_minor: pricing.tax_minor,
          total_minor: pricing.total_minor,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (invErr || !createdInv) {
        return { status: 'error', message: invErr?.message || 'Failed to create invoice' };
      }

      // 7. Insert invoice items
      const invoiceItemRows = pricing.items.map((it) => ({
        invoice_id: createdInv.id,
        product_id: it.product_id,
        product_name: it.product_name,
        variant_name: it.variant_name,
        quantity: it.quantity,
        unit_price_minor: it.unit_price_minor,
        discount_minor: it.discount_minor,
        tax_minor: it.tax_minor,
        total_minor: it.total_minor,
        pricing_trace: it.pricing_trace,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('invoice_items').insert(invoiceItemRows);

      // 8. Update discount used_count if applied
      if (pricing.discount_applied && discountRule) {
        await supabase
          .from('discount_rules')
          .update({ used_count: (discountRule.used_count || 0) + 1 })
          .eq('id', discountRule.id);
      }

      // 9. Advance subscription next_billing_on
      await supabase
        .from('subscriptions')
        .update({
          next_billing_on: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

      // 10. Audit event
      await recordAuditEvent(actorId || null, 'invoice', createdInv.id, 'invoice_generated', {
        invoice_number: createdInv.number,
        subscription_id: sub.id,
        total_minor: pricing.total_minor,
        as_of_date: asOfDate,
      });

      return {
        status: 'created',
        invoice_id: createdInv.id,
        invoice_number: createdInv.number,
        total_minor: pricing.total_minor,
      };
    } catch (err: any) {
      return { status: 'error', message: err?.message || 'Unexpected billing error' };
    }
  },

  /**
   * Executes a billing batch for all active subscriptions due on or before asOfDate.
   */
  async runBatch(
    asOfDate: string,
    actorId?: string | null
  ): Promise<{
    run_id: string;
    processed: number;
    invoices_created: number;
    already_billed: number;
    failed: number;
    total_invoiced_minor: number;
  }> {
    // 1. Create billing run record
    const { data: runRecord } = await supabase
      .from('billing_runs')
      .insert({
        as_of_date: asOfDate,
        started_at: new Date().toISOString(),
        status: 'running',
        created_by: actorId || null,
      })
      .select()
      .single();

    const runId = runRecord?.id || `run-${Date.now()}`;

    // 2. Fetch eligible active subscriptions
    const { data: eligibleSubs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('status', 'active')
      .lte('next_billing_on', asOfDate)
      .limit(500);

    const subs = eligibleSubs || [];
    let createdCount = 0;
    let alreadyBilledCount = 0;
    let failedCount = 0;
    let totalInvoicedMinor = 0;

    for (const sub of subs) {
      const res = await this.issueDueInvoice(sub.id, asOfDate, actorId);
      if (res.status === 'created') {
        createdCount++;
        totalInvoicedMinor += res.total_minor || 0;
      } else if (res.status === 'already_billed') {
        alreadyBilledCount++;
      } else if (res.status === 'error') {
        failedCount++;
      }
    }

    // 3. Update billing run record
    if (runRecord?.id) {
      await supabase
        .from('billing_runs')
        .update({
          finished_at: new Date().toISOString(),
          processed_count: subs.length,
          created_count: createdCount,
          already_billed_count: alreadyBilledCount,
          failed_count: failedCount,
          status: 'completed',
        })
        .eq('id', runRecord.id);
    }

    await recordAuditEvent(actorId || null, 'billing_run', runId, 'billing_run_completed', {
      as_of_date: asOfDate,
      invoices_created: createdCount,
      total_invoiced_minor: totalInvoicedMinor,
    });

    return {
      run_id: runId,
      processed: subs.length,
      invoices_created: createdCount,
      already_billed: alreadyBilledCount,
      failed: failedCount,
      total_invoiced_minor: totalInvoicedMinor,
    };
  },
};
