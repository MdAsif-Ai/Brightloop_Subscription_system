import { supabase } from '@/backend/database/client';
import { CreateProductInput, UpdateProductInput } from '@/backend/validation/products';
import { Product, ProductVariant } from '@/shared/types';

export class NotFoundError extends Error {
  status = 404;
  code = 'NOT_FOUND';
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  status = 400;
  code = 'VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const productService = {
  async list(params: {
    limit?: number;
    offset?: number;
    search?: string;
    active?: boolean;
    type?: string;
  }): Promise<{ items: Product[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    let query = supabase
      .from('products')
      .select('*, variants:product_variants(*)', { count: 'exact' });

    if (params.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    if (params.active !== undefined) {
      query = query.eq('active', params.active);
    }

    if (params.type) {
      query = query.eq('type', params.type);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: (data as Product[]) || [],
      total: count ?? (data?.length || 0),
    };
  },

  async getById(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    return data as Product;
  },

  async create(payload: CreateProductInput): Promise<Product> {
    const { variants, ...productData } = payload;

    // 1. Insert product record
    const { data: createdProduct, error: prodErr } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        type: productData.type || null,
        price_minor: productData.price_minor,
        cost_minor: productData.cost_minor,
        notes: productData.notes || null,
        active: productData.active ?? true,
      })
      .select()
      .single();

    if (prodErr || !createdProduct) {
      throw prodErr || new Error('Failed to create product');
    }

    // 2. Insert variants transactionally / with rollback safeguard
    let insertedVariants: ProductVariant[] = [];
    if (variants && variants.length > 0) {
      const variantRecords = variants.map((v) => ({
        product_id: createdProduct.id,
        name: v.name,
        price_delta_minor: v.price_delta_minor,
      }));

      const { data: varData, error: varErr } = await supabase
        .from('product_variants')
        .insert(variantRecords)
        .select();

      if (varErr) {
        // Rollback created product to maintain consistency
        await supabase.from('products').delete().eq('id', createdProduct.id);
        throw varErr;
      }

      insertedVariants = (varData as ProductVariant[]) || [];
    }

    return {
      ...(createdProduct as Product),
      variants: insertedVariants,
    };
  },

  async update(id: string, payload: UpdateProductInput): Promise<Product> {
    // Verify product exists
    const existing = await this.getById(id);

    const { variants, ...updateFields } = payload;

    // If updating price_minor, ensure existing variants don't have negative effective price
    const newPriceMinor = updateFields.price_minor ?? existing.price_minor;
    if (variants) {
      for (const v of variants) {
        if (newPriceMinor + v.price_delta_minor < 0) {
          throw new ValidationError(
            `Variant '${v.name}' results in a negative effective price (${newPriceMinor + v.price_delta_minor})`
          );
        }
      }
    } else if (updateFields.price_minor !== undefined && existing.variants) {
      for (const v of existing.variants) {
        if (newPriceMinor + v.price_delta_minor < 0) {
          throw new ValidationError(
            `Existing variant '${v.name}' results in a negative effective price with new base price`
          );
        }
      }
    }

    // Update product table
    if (Object.keys(updateFields).length > 0) {
      const { error: updErr } = await supabase
        .from('products')
        .update(updateFields)
        .eq('id', id);

      if (updErr) throw updErr;
    }

    // If variants were provided, replace existing variants
    if (variants !== undefined) {
      // Delete existing variants
      await supabase.from('product_variants').delete().eq('product_id', id);

      if (variants.length > 0) {
        const variantRecords = variants.map((v) => ({
          product_id: id,
          name: v.name,
          price_delta_minor: v.price_delta_minor,
        }));

        const { error: insErr } = await supabase
          .from('product_variants')
          .insert(variantRecords);

        if (insErr) throw insErr;
      }
    }

    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    await this.getById(id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};
