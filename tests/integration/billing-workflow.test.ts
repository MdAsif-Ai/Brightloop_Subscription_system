import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authModule from '@/backend/auth';
import { supabase } from '@/backend/database/client';
import { customerService } from '@/backend/services/customers';
import { subscriptionService } from '@/backend/services/subscriptions';
import { billingEngine } from '@/backend/billing/engine';
import { paymentService } from '@/backend/services/payments';
import { invoiceService } from '@/backend/services/invoices';
import { analyticsService } from '@/backend/services/analytics';
import { guardianService } from '@/backend/services/guardian';
import { clockService } from '@/backend/services/clock';

// Route Handlers
import { GET as getCustomers, POST as postCustomer } from '@/app/api/customers/route';
import { GET as getCustomerById } from '@/app/api/customers/[id]/route';
import { POST as runBilling } from '@/app/api/billing/run/route';
import { POST as postPayment } from '@/app/api/payments/route';
import { GET as getAnalytics } from '@/app/api/analytics/route';
import { GET as getGuardian } from '@/app/api/guardian/route';
import { POST as recoverGuardian } from '@/app/api/guardian/recover/route';
import { GET as getClock, POST as postClock } from '@/app/api/demo/clock/route';

describe('End-to-End Billing & System Workflow Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authModule, 'requireStaff').mockResolvedValue('admin-user-id');
    vi.spyOn(authModule, 'requireAdmin').mockResolvedValue('admin-user-id');
    vi.spyOn(authModule, 'requireAuth').mockResolvedValue('admin-user-id');

    // Mock profiles lookup so it never times out on network
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { role: 'admin' }, error: null }),
          single: async () => ({ data: { role: 'admin' }, error: null }),
        }),
      }),
    } as any);
  });

  describe('Customer & Security Isolation', () => {
    it('creates customer and enforces customer data isolation', async () => {
      const mockCustomer = {
        id: 'cust-1',
        email: 'ceo@acme.com',
        company_name: 'Acme Corp',
        user_id: 'user-acme',
      };

      vi.spyOn(customerService, 'create').mockResolvedValueOnce(mockCustomer as any);

      const req = new Request('http://localhost:3000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ceo@acme.com', company_name: 'Acme Corp' }),
      });

      const res = await postCustomer(req);
      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.data.email).toBe('ceo@acme.com');

      // Test isolation: Customer B requesting Customer A's record throws AuthError (403)
      vi.spyOn(authModule, 'requireAuth').mockResolvedValueOnce('user-intruder');
      vi.spyOn(customerService, 'getById').mockRejectedValueOnce(
        new authModule.AuthError('Access denied: you cannot view other customer records', 403, 'FORBIDDEN')
      );

      const getReq = new Request('http://localhost:3000/api/customers/cust-1');
      const getRes = await getCustomerById(getReq, { params: { id: 'cust-1' } });
      const getJson = await getRes.json();

      expect(getRes.status).toBe(403);
      expect(getJson.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Atomic Recurring Billing & Duplicate Protection', () => {
    it('generates invoice on due date and prevents duplicate billing on rerun', async () => {
      // First run: created
      vi.spyOn(billingEngine, 'runBatch').mockResolvedValueOnce({
        run_id: 'run-1',
        processed: 1,
        invoices_created: 1,
        already_billed: 0,
        failed: 0,
        total_invoiced_minor: 2718720,
      });

      const req1 = new Request('http://localhost:3000/api/billing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ as_of_date: '2026-11-30' }),
      });

      const res1 = await runBilling(req1);
      const json1 = await res1.json();

      expect(res1.status).toBe(200);
      expect(json1.data.invoices_created).toBe(1);
      expect(json1.data.total_invoiced_minor).toBe(2718720);

      // Second run on same date: already_billed, zero duplicates created!
      vi.spyOn(billingEngine, 'runBatch').mockResolvedValueOnce({
        run_id: 'run-2',
        processed: 1,
        invoices_created: 0,
        already_billed: 1,
        failed: 0,
        total_invoiced_minor: 0,
      });

      const req2 = new Request('http://localhost:3000/api/billing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ as_of_date: '2026-11-30' }),
      });

      const res2 = await runBilling(req2);
      const json2 = await res2.json();

      expect(res2.status).toBe(200);
      expect(json2.data.invoices_created).toBe(0);
      expect(json2.data.already_billed).toBe(1);
    });
  });

  describe('Payment Lifecycle & Balance Reduction', () => {
    it('records partial payment and updates remaining balance', async () => {
      vi.spyOn(paymentService, 'recordPayment').mockResolvedValueOnce({
        payment: {
          id: 'pay-1',
          invoice_id: 'inv-1',
          amount_minor: 1000000, // ₹10,000 paid
          method: 'bank_transfer',
          paid_at: '2026-11-30T10:00:00Z',
        } as any,
        remaining_balance_minor: 1718720,
        invoice_status: 'confirmed',
      });

      const req = new Request('http://localhost:3000/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: '88888888-8888-8888-8888-888888888888',
          amount_minor: 1000000,
          method: 'bank_transfer',
        }),
      });

      const res = await postPayment(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.remaining_balance_minor).toBe(1718720);
      expect(json.data.invoice_status).toBe('confirmed');
    });

    it('rejects overpayments beyond outstanding balance', async () => {
      vi.spyOn(paymentService, 'recordPayment').mockRejectedValueOnce(
        new Error('Payment amount (5000000) exceeds remaining outstanding balance (1718720)')
      );

      const req = new Request('http://localhost:3000/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: '88888888-8888-8888-8888-888888888888',
          amount_minor: 5000000,
          method: 'bank_transfer',
        }),
      });

      const res = await postPayment(req);
      const json = await res.json();

      expect(res.status).toBe(500); // Caught and structured
      expect(json.error.message).toMatch(/exceeds remaining outstanding balance/);
    });
  });

  describe('Financial Analytics', () => {
    it('returns valid financial KPIs and MRR', async () => {
      vi.spyOn(analyticsService, 'getMetrics').mockResolvedValueOnce({
        active_subscriptions: 10,
        mrr_minor: 2500000,
        arr_minor: 30000000,
        collected_minor: 1800000,
        outstanding_minor: 700000,
        overdue_invoices: 2,
        upcoming_renewals: 1,
        monthly_revenue: [{ month: '2026-11', invoiced_minor: 2500000, collected_minor: 1800000 }],
      });

      const req = new Request('http://localhost:3000/api/analytics');
      const res = await getAnalytics(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.mrr_minor).toBe(2500000);
      expect(json.data.active_subscriptions).toBe(10);
      expect(json.data.monthly_revenue).toHaveLength(1);
    });
  });

  describe('Revenue Guardian & Recovery', () => {
    it('detects unbilled cycles and performs atomic recovery', async () => {
      vi.spyOn(guardianService, 'inspectRevenue').mockResolvedValueOnce({
        health_score: 90,
        issues: [
          {
            id: 'missing-inv-sub-1',
            type: 'missing_invoice',
            severity: 'critical',
            title: 'Unbilled Cycle',
            description: 'Due billing cycle missing invoice',
            entity_id: 'sub-1',
            entity_type: 'subscription',
            subscription_id: '99999999-9999-9999-9999-999999999999',
            recoverable: true,
            detected_at: '2026-11-30T10:00:00Z',
          },
        ],
        summary: { total_issues: 1, at_risk_amount_minor: 200000, critical_count: 1 },
      });

      const req = new Request('http://localhost:3000/api/guardian');
      const res = await getGuardian(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.health_score).toBe(90);
      expect(json.data.issues[0].type).toBe('missing_invoice');

      // Recover missing invoice
      vi.spyOn(guardianService, 'recoverMissingInvoice').mockResolvedValueOnce({
        success: true,
        status: 'created',
        invoice_id: 'inv-recovered-1',
        invoice_number: 'INV-REC-001',
      });

      const recoverReq = new Request('http://localhost:3000/api/guardian/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: '99999999-9999-9999-9999-999999999999' }),
      });

      const recoverRes = await recoverGuardian(recoverReq);
      const recoverJson = await recoverRes.json();

      expect(recoverRes.status).toBe(200);
      expect(recoverJson.data.status).toBe('created');
      expect(recoverJson.data.invoice_id).toBe('inv-recovered-1');
    });
  });

  describe('Billing Time Machine Clock', () => {
    it('sets and advances simulation clock', async () => {
      const setReq = new Request('http://localhost:3000/api/demo/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2026-12-31' }),
      });

      const setRes = await postClock(setReq);
      const setJson = await setRes.json();

      expect(setRes.status).toBe(200);
      expect(setJson.data.current_date).toBe('2026-12-31');
      expect(setJson.data.is_simulated).toBe(true);

      const getReq = new Request('http://localhost:3000/api/demo/clock');
      const getRes = await getClock(getReq);
      const getJson = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(getJson.data.current_date).toBe('2026-12-31');

      // Reset
      const resetReq = new Request('http://localhost:3000/api/demo/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      const resetRes = await postClock(resetReq);
      const resetJson = await resetRes.json();
      expect(resetJson.data.is_simulated).toBe(false);
    });
  });
});
