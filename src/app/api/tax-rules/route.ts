import { NextRequest } from 'next/server';
import { requireStaff, requireAdmin } from '@/backend/auth';
import { taxRuleService } from '@/backend/services/tax-rules';
import { parsePagination } from '@/backend/http/pagination';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { createTaxRuleSchema, queryTaxRuleSchema } from '@/backend/validation/tax-rules';

export async function GET(request: Request | NextRequest) {
  try {
    await requireStaff(request);
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const pagination = parsePagination(rawQuery);
    const validatedQuery = queryTaxRuleSchema.parse({
      ...rawQuery,
      page: pagination.page,
      page_size: pagination.pageSize,
    });

    const activeFilter = validatedQuery.active !== undefined ? validatedQuery.active === 'true' : undefined;

    const result = await taxRuleService.list({
      limit: pagination.limit,
      offset: pagination.offset,
      search: validatedQuery.search,
      active: activeFilter,
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
    const validated = createTaxRuleSchema.parse(body);

    const taxRule = await taxRuleService.create(validated);
    return successResponse(taxRule, undefined, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
