import { NextRequest } from 'next/server';
import { requireStaff, requireAdmin } from '@/backend/auth';
import { productService } from '@/backend/services/products';
import { parsePagination } from '@/backend/http/pagination';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { createProductSchema, queryProductSchema } from '@/backend/validation/products';

export async function GET(request: Request | NextRequest) {
  try {
    await requireStaff(request);
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const pagination = parsePagination(rawQuery);
    const validatedQuery = queryProductSchema.parse({
      ...rawQuery,
      page: pagination.page,
      page_size: pagination.pageSize,
    });

    const activeFilter = validatedQuery.active !== undefined ? validatedQuery.active === 'true' : undefined;

    const result = await productService.list({
      limit: pagination.limit,
      offset: pagination.offset,
      search: validatedQuery.search,
      active: activeFilter,
      type: validatedQuery.type,
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
    const validated = createProductSchema.parse(body);

    const product = await productService.create(validated);
    return successResponse(product, undefined, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
