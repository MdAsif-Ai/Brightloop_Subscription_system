import { supabase } from '@/backend/database/client';
import { GuardianIssue, GuardianResponse } from '@/shared/types';
import { billingEngine } from '@/backend/billing/engine';
import { recordAuditEvent } from './audit';
import { NotFoundError, ValidationError } from './products';

export const guardianService = {
  async inspectRevenue(asOfDate?: string): Promise<GuardianResponse> {
    const today = asOfDate || new Date().toISOString().split('T')[0];
    const issues: GuardianIssue[] = [];

    // 1. Detect missing invoices: Active subscriptions with next_billing_on <= today without an invoice
    const { data: dueSubs } = await supabase
      .from('subscriptions')
      .select('id, number, customer_id, next_billing_on, base_fee_snapshot_minor, items:subscription_items(unit_price_minor, quantity)')
      .eq('status', 'active')
      .lte('next_billing_on', today);

    for (const sub of dueSubs || []) {
      const { data: existingInv } = await supabase
        .from('invoices')
        .select('id')
        .eq('subscription_id', sub.id)
        .eq('period_start', sub.next_billing_on)
        .maybeSingle();

      if (!existingInv) {
        const estAmount =
          (sub.base_fee_snapshot_minor || 0) +
          (sub.items || []).reduce((sum: number, it: any) => sum + (it.unit_price_minor || 0) * (it.quantity || 1), 0);

        issues.push({
          id: `missing-inv-${sub.id}-${sub.next_billing_on}`,
          type: 'missing_invoice',
          severity: 'critical',
          title: `Unbilled Cycle for Subscription ${sub.number}`,
          description: `Subscription ${sub.number} has a due billing date (${sub.next_billing_on}) with no generated invoice.`,
          entity_id: sub.id,
          entity_type: 'subscription',
          subscription_id: sub.id,
          amount_minor: estAmount,
          recoverable: true,
          detected_at: new Date().toISOString(),
        });
      }
    }

    // 2. Detect overdue payments: Confirmed invoices where due_date < today and outstanding balance > 0
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('id, number, due_date, total_minor, payments(amount_minor)')
      .eq('status', 'confirmed')
      .lt('due_date', today);

    for (const inv of overdueInvoices || []) {
      const paid = (inv.payments || []).reduce((s: number, p: any) => s + (p.amount_minor || 0), 0);
      const remaining = Math.max(0, inv.total_minor - paid);

      if (remaining > 0) {
        issues.push({
          id: `overdue-inv-${inv.id}`,
          type: 'overdue_payment',
          severity: 'high',
          title: `Invoice ${inv.number} Overdue`,
          description: `Invoice ${inv.number} was due on ${inv.due_date} and has an outstanding balance of ${remaining / 100}.`,
          entity_id: inv.id,
          entity_type: 'invoice',
          invoice_id: inv.id,
          amount_minor: remaining,
          recoverable: false,
          detected_at: new Date().toISOString(),
        });
      }
    }

    // 3. Detect failed billing runs
    const { data: failedRuns } = await supabase
      .from('billing_runs')
      .select('id, as_of_date, failed_count, status')
      .or('status.eq.failed,failed_count.gt.0')
      .order('started_at', { ascending: false })
      .limit(5);

    for (const run of failedRuns || []) {
      issues.push({
        id: `failed-run-${run.id}`,
        type: 'failed_billing',
        severity: 'high',
        title: `Billing Run Alert for ${run.as_of_date}`,
        description: `Billing run encountered ${run.failed_count} failures during execution.`,
        entity_id: run.id,
        entity_type: 'billing_run',
        recoverable: true,
        detected_at: new Date().toISOString(),
      });
    }

    // 4. Detect expiring subscriptions within 7 days
    const sevenDaysOut = new Date(new Date(today + 'T00:00:00Z').getTime() + 7 * 86400000)
      .toISOString()
      .split('T')[0];

    const { data: expiringSubs } = await supabase
      .from('subscriptions')
      .select('id, number, expiry_date')
      .eq('status', 'active')
      .gte('expiry_date', today)
      .lte('expiry_date', sevenDaysOut);

    for (const sub of expiringSubs || []) {
      issues.push({
        id: `expiring-sub-${sub.id}`,
        type: 'expiring_subscription',
        severity: 'medium',
        title: `Subscription ${sub.number} Expiring Soon`,
        description: `Subscription ${sub.number} expires on ${sub.expiry_date}. Ensure renewal has been initiated.`,
        entity_id: sub.id,
        entity_type: 'subscription',
        subscription_id: sub.id,
        recoverable: false,
        detected_at: new Date().toISOString(),
      });
    }

    // Calculate deterministic Health Score
    let score = 100;
    const criticalCount = issues.filter((i) => i.severity === 'critical').length;
    const highCount = issues.filter((i) => i.severity === 'high').length;
    const mediumCount = issues.filter((i) => i.severity === 'medium').length;

    score -= Math.min(40, criticalCount * 10);
    score -= Math.min(30, highCount * 5);
    score -= Math.min(15, mediumCount * 3);
    score = Math.max(0, Math.min(100, score));

    const atRiskAmount = issues.reduce((sum, i) => sum + (i.amount_minor || 0), 0);

    return {
      health_score: score,
      issues,
      summary: {
        total_issues: issues.length,
        at_risk_amount_minor: atRiskAmount,
        critical_count: criticalCount,
      },
    };
  },

  async recoverMissingInvoice(
    subscriptionId: string,
    actorId?: string | null
  ): Promise<{ success: boolean; status: string; invoice_id?: string; invoice_number?: string; message?: string }> {
    const { data: sub } = await supabase.from('subscriptions').select('id, status, next_billing_on').eq('id', subscriptionId).single();
    if (!sub) {
      throw new NotFoundError(`Subscription '${subscriptionId}' not found`);
    }

    if (sub.status !== 'active') {
      throw new ValidationError(`Subscription is not active (current status: ${sub.status})`);
    }

    const today = new Date().toISOString().split('T')[0];
    const res = await billingEngine.issueDueInvoice(sub.id, today, actorId);

    await recordAuditEvent(actorId || null, 'guardian', subscriptionId, 'invoice_recovered', {
      subscription_id: subscriptionId,
      result: res,
    });

    return {
      success: res.status === 'created' || res.status === 'already_billed',
      status: res.status,
      invoice_id: res.invoice_id,
      invoice_number: res.invoice_number,
      message: res.message,
    };
  },
};
