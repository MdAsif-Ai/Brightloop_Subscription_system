import { NextRequest } from 'next/server';
import { requireStaff, requireAdmin } from '@/backend/auth';
import { planService } from '@/backend/services/plans';
import { parsePagination } from '@/backend/http/pagination';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { createPlanSchema, queryPlanSchema } from '@/backend/validation/plans';

export async function GET(request: Request | NextRequest) {
  try {
    await requireStaff(request);
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const pagination = parsePagination(rawQuery);
    const validatedQuery = queryPlanSchema.parse({
      ...rawQuery,
      page: pagination.page,
      page_size: pagination.pageSize,
    });

    const activeFilter = validatedQuery.active !== undefined ? validatedQuery.active === 'true' : undefined;

    const result = await planService.list({
      limit: pagination.limit,
      offset: pagination.offset,
      search: validatedQuery.search,
      active: activeFilter,
      billing_frequency: validatedQuery.billing_frequency,
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
    const validated = createPlanSchema.parse(body);

    const plan = await planService.create(validated);
    return successResponse(plan, undefined, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
