import { supabase } from '@/backend/database/client';
import { Invoice, InvoiceStatus } from '@/shared/types';
import { NotFoundError, ValidationError } from './products';
import { AuthError } from '@/backend/auth';
import { recordAuditEvent } from './audit';

export const invoiceService = {
  async list(params: {
    limit?: number;
    offset?: number;
    customer_id?: string;
    subscription_id?: string;
    status?: InvoiceStatus;
    search?: string;
    requestingUserId?: string;
    requestingRole?: string;
  }): Promise<{ items: Invoice[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    let query = supabase.from('invoices').select(
      `
        *,
        items:invoice_items(*),
        payments:payments(*),
        customer:customers(id, company_name, contact_name, email)
      `,
      { count: 'exact' }
    );

    // Customer isolation
    if (params.requestingRole === 'customer' && params.requestingUserId) {
      const { data: custRecord } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', params.requestingUserId)
        .maybeSingle();

      if (!custRecord) {
        return { items: [], total: 0 };
      }
      query = query.eq('customer_id', custRecord.id);
    } else if (params.customer_id) {
      query = query.eq('customer_id', params.customer_id);
    }

    if (params.subscription_id) {
      query = query.eq('subscription_id', params.subscription_id);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.search) {
      query = query.ilike('number', `%${params.search}%`);
    }

    query = query
      .order('issued_on', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    // Attach calculated outstanding balance
    const items = ((data as any[]) || []).map((inv) => {
      const paidTotal = (inv.payments || []).reduce(
        (sum: number, p: any) => sum + (p.amount_minor || 0),
        0
      );
      const outstanding = Math.max(0, inv.total_minor - paidTotal);
      return {
        ...inv,
        outstanding_minor: outstanding,
      } as Invoice;
    });

    return {
      items,
      total: count ?? (items.length || 0),
    };
  },

  async getById(
    id: string,
    requestingUserId?: string,
    requestingRole?: string
  ): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
        *,
        items:invoice_items(*),
        payments:payments(*),
        customer:customers(id, company_name, contact_name, email, user_id),
        subscription:subscriptions(id, number, status)
      `
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Invoice with ID '${id}' not found`);
    }

    const inv = data as any;

    // Customer data isolation check
    if (requestingRole === 'customer' && requestingUserId) {
      if (inv.customer?.user_id !== requestingUserId) {
        throw new AuthError('Access denied: you cannot view invoices belonging to another customer', 403, 'FORBIDDEN');
      }
    }

    const paidTotal = (inv.payments || []).reduce(
      (sum: number, p: any) => sum + (p.amount_minor || 0),
      0
    );
    inv.outstanding_minor = Math.max(0, inv.total_minor - paidTotal);

    return inv as Invoice;
  },

  async updateStatus(
    id: string,
    newStatus: InvoiceStatus,
    actorId?: string | null
  ): Promise<Invoice> {
    const existing = await this.getById(id);

    if (existing.status === newStatus) {
      return existing;
    }

    if (existing.status === 'paid' && newStatus === 'canceled') {
      throw new ValidationError('Cannot cancel a fully paid invoice');
    }

    if (existing.status === 'canceled') {
      throw new ValidationError('Cannot change status of a canceled invoice');
    }

    const { error } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) throw error;

    await recordAuditEvent(actorId || null, 'invoice', id, `invoice_${newStatus}`, {
      from_status: existing.status,
      to_status: newStatus,
    });

    return this.getById(id);
  },
};
