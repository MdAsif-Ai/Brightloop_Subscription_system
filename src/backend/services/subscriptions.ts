import { supabase } from '@/backend/database/client';
import {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  TransitionSubscriptionInput,
} from '@/backend/validation/subscriptions';
import { Subscription, SubscriptionItem, SubscriptionStatus } from '@/shared/types';
import { NotFoundError, ValidationError } from './products';
import { AuthError } from '@/backend/auth';
import { recordAuditEvent } from './audit';

export const subscriptionService = {
  async list(params: {
    limit?: number;
    offset?: number;
    customer_id?: string;
    plan_id?: string;
    status?: SubscriptionStatus;
    search?: string;
    requestingUserId?: string;
    requestingRole?: string;
  }): Promise<{ items: Subscription[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    let query = supabase.from('subscriptions').select(
      `
        *,
        items:subscription_items(*),
        customer:customers(id, company_name, contact_name, email),
        plan:plans(id, name, billing_frequency, base_fee_minor)
      `,
      { count: 'exact' }
    );

    // Customer data isolation
    if (params.requestingRole === 'customer' && params.requestingUserId) {
      // Find the customer record for this user
      const { data: customerRecord } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', params.requestingUserId)
        .maybeSingle();

      if (!customerRecord) {
        return { items: [], total: 0 };
      }
      query = query.eq('customer_id', customerRecord.id);
    } else if (params.customer_id) {
      query = query.eq('customer_id', params.customer_id);
    }

    if (params.plan_id) {
      query = query.eq('plan_id', params.plan_id);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.search) {
      query = query.ilike('number', `%${params.search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: (data as Subscription[]) || [],
      total: count ?? (data?.length || 0),
    };
  },

  async getById(
    id: string,
    requestingUserId?: string,
    requestingRole?: string
  ): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        items:subscription_items(*),
        customer:customers(id, company_name, contact_name, email, user_id),
        plan:plans(id, name, billing_frequency, base_fee_minor, allow_pause, allow_early_close, allow_renewal, auto_close_on_expiry)
      `
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Subscription with ID '${id}' not found`);
    }

    const sub = data as Subscription & { customer?: { user_id?: string | null } };

    // Enforce customer ownership isolation
    if (requestingRole === 'customer' && requestingUserId) {
      if (sub.customer?.user_id !== requestingUserId) {
        throw new AuthError('Access denied: you cannot view subscriptions belonging to another customer', 403, 'FORBIDDEN');
      }
    }

    return sub;
  },

  async create(payload: CreateSubscriptionInput, actorId?: string | null): Promise<Subscription> {
    // 1. Verify customer exists
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('id')
      .eq('id', payload.customer_id)
      .single();

    if (custErr || !customer) {
      throw new NotFoundError(`Customer with ID '${payload.customer_id}' not found`);
    }

    // 2. Verify plan exists
    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('*')
      .eq('id', payload.plan_id)
      .single();

    if (planErr || !plan) {
      throw new NotFoundError(`Plan with ID '${payload.plan_id}' not found`);
    }

    if (!plan.active) {
      throw new ValidationError(`Plan '${plan.name}' is currently inactive`);
    }

    // 3. Validate items and minimum quantity
    const totalQty = payload.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQty < plan.minimum_quantity) {
      throw new ValidationError(
        `Total quantity across items (${totalQty}) is less than plan minimum quantity requirement (${plan.minimum_quantity})`
      );
    }

    // Resolve trusted prices
    const resolvedItems: Array<{
      product_id: string;
      variant_id?: string | null;
      quantity: number;
      unit_price_minor: number;
      tax_rule_id?: string | null;
    }> = [];

    for (const item of payload.items) {
      const { data: prod, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.product_id)
        .single();

      if (pErr || !prod) {
        throw new NotFoundError(`Product '${item.product_id}' not found`);
      }

      let price = prod.price_minor;
      if (item.variant_id) {
        const { data: variant, error: vErr } = await supabase
          .from('product_variants')
          .select('*')
          .eq('id', item.variant_id)
          .eq('product_id', item.product_id)
          .single();

        if (vErr || !variant) {
          throw new NotFoundError(`Variant '${item.variant_id}' not found for product '${item.product_id}'`);
        }
        price = price + variant.price_delta_minor;
      }

      const unitPrice = item.unit_price_minor !== undefined ? item.unit_price_minor : price;
      if (unitPrice < 0) {
        throw new ValidationError('Unit price cannot be negative');
      }

      resolvedItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_price_minor: unitPrice,
        tax_rule_id: item.tax_rule_id || null,
      });
    }

    // 4. Generate unique subscription number
    const subNumber = `SUB-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: createdSub, error: subErr } = await supabase
      .from('subscriptions')
      .insert({
        number: subNumber,
        customer_id: payload.customer_id,
        plan_id: payload.plan_id,
        status: payload.status,
        start_date: payload.start_date,
        expiry_date: payload.expiry_date,
        next_billing_on: payload.start_date,
        billing_anchor_day: payload.billing_anchor_day || null,
        payment_terms_days: payload.payment_terms_days,
        quote_valid_until: payload.quote_valid_until || null,
        discount_rule_id: payload.discount_rule_id || null,
        base_fee_snapshot_minor: plan.base_fee_minor,
        plan_tax_rule_id: payload.plan_tax_rule_id || plan.tax_rule_id || null,
      })
      .select()
      .single();

    if (subErr || !createdSub) {
      throw subErr || new Error('Failed to create subscription record');
    }

    // 5. Insert subscription items with rollback safeguard
    const itemRecords = resolvedItems.map((it) => ({
      subscription_id: createdSub.id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      quantity: it.quantity,
      unit_price_minor: it.unit_price_minor,
      tax_rule_id: it.tax_rule_id,
    }));

    const { data: insertedItems, error: itemsErr } = await supabase
      .from('subscription_items')
      .insert(itemRecords)
      .select();

    if (itemsErr) {
      await supabase.from('subscriptions').delete().eq('id', createdSub.id);
      throw itemsErr;
    }

    await recordAuditEvent(actorId || null, 'subscription', createdSub.id, 'subscription_created', {
      number: createdSub.number,
      status: createdSub.status,
      customer_id: createdSub.customer_id,
      plan_id: createdSub.plan_id,
    });

    return {
      ...(createdSub as Subscription),
      items: (insertedItems as SubscriptionItem[]) || [],
    };
  },

  async transition(
    id: string,
    payload: TransitionSubscriptionInput,
    actorId?: string | null
  ): Promise<Subscription> {
    const sub = await this.getById(id);
    const fromStatus = sub.status;
    const toStatus = payload.to_status;

    if (fromStatus === toStatus) {
      return sub;
    }

    // Validate state machine transitions
    const validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
      draft: ['quotation', 'confirmed', 'closed'],
      quotation: ['confirmed', 'closed'],
      confirmed: ['active', 'closed'],
      active: ['paused', 'closed'],
      paused: ['active', 'closed'],
      closed: [],
    };

    const allowed = validTransitions[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new ValidationError(
        `Invalid subscription state transition from '${fromStatus}' to '${toStatus}'`
      );
    }

    // Check quotation expiry
    if (fromStatus === 'quotation' && toStatus === 'confirmed') {
      if (sub.quote_valid_until) {
        const today = new Date().toISOString().split('T')[0];
        if (sub.quote_valid_until < today) {
          throw new ValidationError(
            `Quotation expired on '${sub.quote_valid_until}' and cannot be confirmed`
          );
        }
      }
    }

    // Check plan policies
    if (sub.plan) {
      if (toStatus === 'paused' && !sub.plan.allow_pause) {
        throw new ValidationError(`Plan '${sub.plan.name}' does not allow pausing subscriptions`);
      }

      if (toStatus === 'closed' && fromStatus === 'active') {
        const today = new Date().toISOString().split('T')[0];
        if (!sub.plan.allow_early_close && today < sub.expiry_date) {
          throw new ValidationError(
            `Plan '${sub.plan.name}' does not allow early close before expiry date (${sub.expiry_date})`
          );
        }
      }
    }

    const { data: updated, error } = await supabase
      .from('subscriptions')
      .update({
        status: toStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      throw error || new Error(`Failed to update subscription status`);
    }

    const actionMap: Record<SubscriptionStatus, string> = {
      draft: 'subscription_drafted',
      quotation: 'quotation_created',
      confirmed: 'quotation_confirmed',
      active: fromStatus === 'paused' ? 'subscription_resumed' : 'subscription_activated',
      paused: 'subscription_paused',
      closed: 'subscription_closed',
    };

    await recordAuditEvent(actorId || null, 'subscription', id, actionMap[toStatus] || 'subscription_status_changed', {
      from_status: fromStatus,
      to_status: toStatus,
      reason: payload.reason,
    });

    return this.getById(id);
  },

  async update(id: string, payload: UpdateSubscriptionInput, actorId?: string | null): Promise<Subscription> {
    await this.getById(id);

    const { items, ...subFields } = payload;

    if (Object.keys(subFields).length > 0) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          ...subFields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    }

    if (items) {
      await supabase.from('subscription_items').delete().eq('subscription_id', id);
      const itemRecords = items.map((it) => ({
        subscription_id: id,
        product_id: it.product_id,
        variant_id: it.variant_id || null,
        quantity: it.quantity,
        unit_price_minor: it.unit_price_minor ?? 0,
        tax_rule_id: it.tax_rule_id || null,
      }));
      const { error: insErr } = await supabase.from('subscription_items').insert(itemRecords);
      if (insErr) throw insErr;
    }

    await recordAuditEvent(actorId || null, 'subscription', id, 'subscription_updated', payload);
    return this.getById(id);
  },
};
