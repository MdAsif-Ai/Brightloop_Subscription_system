import { supabase } from '@/backend/database/client';
import { CreatePlanInput, UpdatePlanInput } from '@/backend/validation/plans';
import { Plan } from '@/shared/types';
import { NotFoundError } from './products';

export const planService = {
  async list(params: {
    limit?: number;
    offset?: number;
    search?: string;
    active?: boolean;
    billing_frequency?: string;
  }): Promise<{ items: Plan[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    let query = supabase.from('plans').select('*', { count: 'exact' });

    if (params.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    if (params.active !== undefined) {
      query = query.eq('active', params.active);
    }

    if (params.billing_frequency) {
      query = query.eq('billing_frequency', params.billing_frequency);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: (data as Plan[]) || [],
      total: count ?? (data?.length || 0),
    };
  },

  async getById(id: string): Promise<Plan> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Plan with ID '${id}' not found`);
    }

    return data as Plan;
  },

  async create(payload: CreatePlanInput): Promise<Plan> {
    const { data, error } = await supabase
      .from('plans')
      .insert({
        name: payload.name,
        description: payload.description || null,
        billing_frequency: payload.billing_frequency,
        base_fee_minor: payload.base_fee_minor,
        minimum_quantity: payload.minimum_quantity,
        available_from: payload.available_from || null,
        available_until: payload.available_until || null,
        allow_pause: payload.allow_pause,
        allow_early_close: payload.allow_early_close,
        allow_renewal: payload.allow_renewal,
        auto_close_on_expiry: payload.auto_close_on_expiry,
        tax_rule_id: payload.tax_rule_id || null,
        active: payload.active,
      })
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create plan');
    }

    return data as Plan;
  },

  async update(id: string, payload: UpdatePlanInput): Promise<Plan> {
    await this.getById(id);

    const { data, error } = await supabase
      .from('plans')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error(`Failed to update plan '${id}'`);
    }

    return data as Plan;
  },

  async delete(id: string): Promise<boolean> {
    await this.getById(id);
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};
