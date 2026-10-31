import { supabase } from '@/backend/database/client';
import { CreateDiscountRuleInput, UpdateDiscountRuleInput } from '@/backend/validation/discounts';
import { DiscountRule } from '@/shared/types';
import { NotFoundError } from './products';

export const discountService = {
  async list(params: {
    limit?: number;
    offset?: number;
    search?: string;
    active?: boolean;
    discount_type?: string;
    product_id?: string;
  }): Promise<{ items: DiscountRule[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    let query = supabase.from('discount_rules').select('*', { count: 'exact' });

    if (params.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    if (params.active !== undefined) {
      query = query.eq('active', params.active);
    }

    if (params.discount_type) {
      query = query.eq('discount_type', params.discount_type);
    }

    if (params.product_id) {
      query = query.eq('product_id', params.product_id);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: (data as DiscountRule[]) || [],
      total: count ?? (data?.length || 0),
    };
  },

  async getById(id: string): Promise<DiscountRule> {
    const { data, error } = await supabase
      .from('discount_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Discount rule with ID '${id}' not found`);
    }

    return data as DiscountRule;
  },

  async create(payload: CreateDiscountRuleInput): Promise<DiscountRule> {
    const { data, error } = await supabase
      .from('discount_rules')
      .insert({
        name: payload.name,
        discount_type: payload.discount_type,
        value: payload.value,
        minimum_quantity: payload.minimum_quantity || null,
        minimum_spend_minor: payload.minimum_spend_minor !== undefined ? payload.minimum_spend_minor : null,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
        maximum_uses: payload.maximum_uses || null,
        used_count: 0,
        product_id: payload.product_id || null,
        active: payload.active,
      })
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create discount rule');
    }

    return data as DiscountRule;
  },

  async update(id: string, payload: UpdateDiscountRuleInput): Promise<DiscountRule> {
    await this.getById(id);

    const { data, error } = await supabase
      .from('discount_rules')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error(`Failed to update discount rule '${id}'`);
    }

    return data as DiscountRule;
  },

  async delete(id: string): Promise<boolean> {
    await this.getById(id);
    const { error } = await supabase.from('discount_rules').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};
