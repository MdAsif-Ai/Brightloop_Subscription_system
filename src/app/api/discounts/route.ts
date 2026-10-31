import { NextRequest } from 'next/server';
import { requireStaff, requireAdmin } from '@/backend/auth';
import { discountService } from '@/backend/services/discounts';
import { parsePagination } from '@/backend/http/pagination';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { createDiscountRuleSchema, queryDiscountRuleSchema } from '@/backend/validation/discounts';

export async function GET(request: Request | NextRequest) {
  try {
    await requireStaff(request);
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const pagination = parsePagination(rawQuery);
    const validatedQuery = queryDiscountRuleSchema.parse({
      ...rawQuery,
      page: pagination.page,
      page_size: pagination.pageSize,
    });

    const activeFilter = validatedQuery.active !== undefined ? validatedQuery.active === 'true' : undefined;

    const result = await discountService.list({
      limit: pagination.limit,
      offset: pagination.offset,
      search: validatedQuery.search,
      active: activeFilter,
      discount_type: validatedQuery.discount_type,
      product_id: validatedQuery.product_id,
    });

    return successResponse(result.items, {
      total: result.total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: Request | NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const validated = createDiscountRuleSchema.parse(body);

    const discount = await discountService.create(validated);
    return successResponse(discount, undefined, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
