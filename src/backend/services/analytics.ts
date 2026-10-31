import { supabase } from '@/backend/database/client';
import { AnalyticsResponse, MonthlyRevenuePoint } from '@/shared/types';

export const analyticsService = {
  async getMetrics(asOfDate?: string): Promise<AnalyticsResponse> {
    const today = asOfDate || new Date().toISOString().split('T')[0];

    // 1. Active subscriptions & MRR
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('*, items:subscription_items(*), plan:plans(billing_frequency, base_fee_minor)')
      .eq('status', 'active');

    const subs = activeSubs || [];
    let mrrMinor = 0;

    for (const sub of subs) {
      const baseFee = sub.base_fee_snapshot_minor || sub.plan?.base_fee_minor || 0;
      const itemsTotal = (sub.items || []).reduce(
        (sum: number, it: any) => sum + (it.unit_price_minor || 0) * (it.quantity || 1),
        0
      );
      const grossCycle = baseFee + itemsTotal;
      const freq = sub.plan?.billing_frequency || 'monthly';

      let monthlyNormalized = grossCycle;
      if (freq === 'yearly') {
        monthlyNormalized = Math.round(grossCycle / 12);
      } else if (freq === 'weekly') {
        monthlyNormalized = Math.round((grossCycle * 52) / 12);
      } else if (freq === 'daily') {
        monthlyNormalized = grossCycle * 30;
      }

      mrrMinor += monthlyNormalized;
    }

    const arrMinor = mrrMinor * 12;

    // 2. Total collected from payments
    const { data: allPayments } = await supabase.from('payments').select('amount_minor, paid_at');
    const collectedMinor = (allPayments || []).reduce((sum, p) => sum + (p.amount_minor || 0), 0);

    // 3. Invoices (for outstanding, overdue, and monthly breakdown)
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('id, total_minor, due_date, status, issued_on, payments(amount_minor)');

    let outstandingMinor = 0;
    let overdueCount = 0;
    const monthlyMap = new Map<string, { invoiced: number; collected: number }>();

    for (const inv of allInvoices || []) {
      if (inv.status === 'canceled') continue;

      const invPaid = (inv.payments || []).reduce((s: number, p: any) => s + (p.amount_minor || 0), 0);
      const remaining = Math.max(0, (inv.total_minor || 0) - invPaid);

      if (remaining > 0) {
        outstandingMinor += remaining;
        if (inv.due_date && inv.due_date < today) {
          overdueCount++;
        }
      }

      // Group by month
      if (inv.issued_on) {
        const monthKey = inv.issued_on.substring(0, 7); // YYYY-MM
        const curr = monthlyMap.get(monthKey) || { invoiced: 0, collected: 0 };
        curr.invoiced += inv.total_minor || 0;
        monthlyMap.set(monthKey, curr);
      }
    }

    for (const p of allPayments || []) {
      if (p.paid_at) {
        const monthKey = p.paid_at.substring(0, 7);
        const curr = monthlyMap.get(monthKey) || { invoiced: 0, collected: 0 };
        curr.collected += p.amount_minor || 0;
        monthlyMap.set(monthKey, curr);
      }
    }

    const monthlyRevenue: MonthlyRevenuePoint[] = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, stats]) => ({
        month,
        invoiced_minor: stats.invoiced,
        collected_minor: stats.collected,
      }));

    // 4. Upcoming renewals (active subscriptions expiring within 30 days)
    const thirtyDaysOut = new Date(new Date(today + 'T00:00:00Z').getTime() + 30 * 86400000)
      .toISOString()
      .split('T')[0];

    const upcomingRenewals = subs.filter(
      (s) => s.expiry_date >= today && s.expiry_date <= thirtyDaysOut
    ).length;

    return {
      active_subscriptions: subs.length,
      mrr_minor: mrrMinor,
      arr_minor: arrMinor,
      collected_minor: collectedMinor,
      outstanding_minor: outstandingMinor,
      overdue_invoices: overdueCount,
      upcoming_renewals: upcomingRenewals,
      monthly_revenue: monthlyRevenue,
    };
  },
};
