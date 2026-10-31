import { NextRequest } from 'next/server';
import { requireStaff } from '@/backend/auth';
import { customerService } from '@/backend/services/customers';
import { parsePagination } from '@/backend/http/pagination';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { createCustomerSchema, queryCustomerSchema } from '@/backend/validation/customers';

export async function GET(request: Request | NextRequest) {
  try {
    await requireStaff(request);
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const pagination = parsePagination(rawQuery);
    const validatedQuery = queryCustomerSchema.parse({
      ...rawQuery,
      page: pagination.page,
      page_size: pagination.pageSize,
    });

    const result = await customerService.list({
      limit: pagination.limit,
      offset: pagination.offset,
      search: validatedQuery.search,
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
    const actorId = await requireStaff(request);
    const body = await request.json();
    const validated = createCustomerSchema.parse(body);

    const customer = await customerService.create(validated, actorId);
    return successResponse(customer, undefined, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
