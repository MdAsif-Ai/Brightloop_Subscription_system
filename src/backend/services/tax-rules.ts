import { supabase } from '@/backend/database/client';
import { CreateTaxRuleInput, UpdateTaxRuleInput } from '@/backend/validation/tax-rules';
import { TaxRule } from '@/shared/types';
import { NotFoundError } from './products';

export const taxRuleService = {
  async list(params: {
    limit?: number;
    offset?: number;
    search?: string;
    active?: boolean;
  }): Promise<{ items: TaxRule[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    let query = supabase.from('tax_rules').select('*', { count: 'exact' });

    if (params.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    if (params.active !== undefined) {
      query = query.eq('active', params.active);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: (data as TaxRule[]) || [],
      total: count ?? (data?.length || 0),
    };
  },

  async getById(id: string): Promise<TaxRule> {
    const { data, error } = await supabase
      .from('tax_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Tax rule with ID '${id}' not found`);
    }

    return data as TaxRule;
  },

  async create(payload: CreateTaxRuleInput): Promise<TaxRule> {
    const { data, error } = await supabase
      .from('tax_rules')
      .insert({
        name: payload.name,
        rate_basis_points: payload.rate_basis_points,
        active: payload.active,
      })
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create tax rule');
    }

    return data as TaxRule;
  },

  async update(id: string, payload: UpdateTaxRuleInput): Promise<TaxRule> {
    await this.getById(id);

    const { data, error } = await supabase
      .from('tax_rules')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error(`Failed to update tax rule '${id}'`);
    }

    return data as TaxRule;
  },

  async delete(id: string): Promise<boolean> {
    await this.getById(id);
    const { error } = await supabase.from('tax_rules').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};
