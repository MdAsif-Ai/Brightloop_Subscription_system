import { supabase } from '@/backend/database/client';
import { Payment, PaymentMethod } from '@/shared/types';
import { NotFoundError, ValidationError } from './products';
import { recordAuditEvent } from './audit';

export interface RecordPaymentInput {
  invoice_id: string;
  amount_minor: number;
  method: PaymentMethod;
  reference?: string | null;
  note?: string | null;
}

export const paymentService = {
  async list(params: {
    limit?: number;
    offset?: number;
    invoice_id?: string;
  }): Promise<{ items: Payment[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    let query = supabase.from('payments').select('*', { count: 'exact' });

    if (params.invoice_id) {
      query = query.eq('invoice_id', params.invoice_id);
    }

    query = query
      .order('paid_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: (data as Payment[]) || [],
      total: count ?? (data?.length || 0),
    };
  },

  async recordPayment(
    payload: RecordPaymentInput,
    actorId?: string | null
  ): Promise<{ payment: Payment; remaining_balance_minor: number; invoice_status: string }> {
    if (payload.amount_minor <= 0) {
      throw new ValidationError('Payment amount must be greater than zero');
    }

    // 1. Fetch and verify invoice
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*, payments(*)')
      .eq('id', payload.invoice_id)
      .single();

    if (invErr || !invoice) {
      throw new NotFoundError(`Invoice with ID '${payload.invoice_id}' not found`);
    }

    if (invoice.status === 'canceled') {
      throw new ValidationError('Cannot record payment against a canceled invoice');
    }

    if (invoice.status === 'draft') {
      throw new ValidationError('Invoice must be confirmed before recording payment');
    }

    // 2. Check for duplicate reference
    if (payload.reference) {
      const { data: existingRef } = await supabase
        .from('payments')
        .select('id')
        .eq('reference', payload.reference)
        .maybeSingle();

      if (existingRef) {
        throw new ValidationError(`Payment with reference '${payload.reference}' has already been recorded`);
      }
    }

    // 3. Calculate already paid total and remaining balance
    const existingPaid = (invoice.payments || []).reduce(
      (sum: number, p: any) => sum + (p.amount_minor || 0),
      0
    );
    const remainingBefore = Math.max(0, invoice.total_minor - existingPaid);

    if (remainingBefore === 0) {
      throw new ValidationError('Invoice is already fully paid');
    }

    if (payload.amount_minor > remainingBefore) {
      throw new ValidationError(
        `Payment amount (${payload.amount_minor}) exceeds remaining outstanding balance (${remainingBefore})`
      );
    }

    // 4. Insert payment
    const { data: paymentRecord, error: payErr } = await supabase
      .from('payments')
      .insert({
        invoice_id: payload.invoice_id,
        method: payload.method,
        amount_minor: payload.amount_minor,
        reference: payload.reference || null,
        note: payload.note || null,
        recorded_by: actorId || null,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (payErr || !paymentRecord) {
      throw payErr || new Error('Failed to record payment');
    }

    const remainingAfter = remainingBefore - payload.amount_minor;
    let newInvoiceStatus = invoice.status;

    // 5. If remaining balance reaches 0, update invoice status to 'paid'
    if (remainingAfter === 0) {
      newInvoiceStatus = 'paid';
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoice.id);
    }

    // 6. Record audit event
    await recordAuditEvent(actorId || null, 'payment', paymentRecord.id, 'payment_recorded', {
      invoice_id: invoice.id,
      amount_minor: payload.amount_minor,
      method: payload.method,
      reference: payload.reference,
      remaining_balance_minor: remainingAfter,
      invoice_status: newInvoiceStatus,
    });

    return {
      payment: paymentRecord as Payment,
      remaining_balance_minor: remainingAfter,
      invoice_status: newInvoiceStatus,
    };
  },
};
