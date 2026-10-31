import { supabase } from '@/backend/database/client';
import { CreateCustomerInput, UpdateCustomerInput } from '@/backend/validation/customers';
import { Customer } from '@/shared/types';
import { NotFoundError, ValidationError } from './products';
import { AuthError } from '@/backend/auth';
import { recordAuditEvent } from './audit';

export const customerService = {
  async list(params: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<{ items: Customer[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    let query = supabase.from('customers').select('*', { count: 'exact' });

    if (params.search) {
      query = query.or(
        `company_name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
      );
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: (data as Customer[]) || [],
      total: count ?? (data?.length || 0),
    };
  },

  async getById(
    id: string,
    requestingUserId?: string,
    requestingRole?: string
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Customer with ID '${id}' not found`);
    }

    const customer = data as Customer;

    // Customer isolation check
    if (requestingRole === 'customer' && requestingUserId) {
      if (customer.user_id !== requestingUserId && customer.id !== requestingUserId) {
        throw new AuthError('Access denied: you cannot view other customer records', 403, 'FORBIDDEN');
      }
    }

    return customer;
  },

  async create(payload: CreateCustomerInput, actorId?: string | null): Promise<Customer> {
    const normalizedEmail = payload.email.trim().toLowerCase();

    // Check duplicate email
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      throw new ValidationError(`Customer with email '${payload.email}' already exists`);
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        company_name: payload.company_name || null,
        contact_name: payload.contact_name || null,
        email: normalizedEmail,
        billing_address: payload.billing_address || null,
        notes: payload.notes || null,
        user_id: payload.user_id || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create customer');
    }

    const created = data as Customer;
    await recordAuditEvent(actorId || null, 'customer', created.id, 'customer_created', {
      email: created.email,
      company_name: created.company_name,
    });

    return created;
  },

  async update(id: string, payload: UpdateCustomerInput, actorId?: string | null): Promise<Customer> {
    await this.getById(id);

    if (payload.email) {
      const normalizedEmail = payload.email.trim().toLowerCase();
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .ilike('email', normalizedEmail)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        throw new ValidationError(`Another customer with email '${payload.email}' already exists`);
      }
    }

    const { data, error } = await supabase
      .from('customers')
      .update({
        ...(payload.company_name !== undefined ? { company_name: payload.company_name } : {}),
        ...(payload.contact_name !== undefined ? { contact_name: payload.contact_name } : {}),
        ...(payload.email !== undefined ? { email: payload.email.trim().toLowerCase() } : {}),
        ...(payload.billing_address !== undefined ? { billing_address: payload.billing_address } : {}),
        ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
        ...(payload.user_id !== undefined ? { user_id: payload.user_id } : {}),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error(`Failed to update customer '${id}'`);
    }

    const updated = data as Customer;
    await recordAuditEvent(actorId || null, 'customer', updated.id, 'customer_updated', payload);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await this.getById(id);

    // Prevent deletion if financial history exists
    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', id);

    if (invoiceCount && invoiceCount > 0) {
      throw new ValidationError('Cannot delete customer with existing invoice history. Deactivate or archive instead.');
    }

    const { count: subCount } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', id);

    if (subCount && subCount > 0) {
      throw new ValidationError('Cannot delete customer with existing subscriptions.');
    }

    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};
