import { NextRequest } from 'next/server';
import { requireAuth, requireStaff } from '@/backend/auth';
import { supabase } from '@/backend/database/client';
import { subscriptionService } from '@/backend/services/subscriptions';
import { parsePagination } from '@/backend/http/pagination';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { createSubscriptionSchema, querySubscriptionSchema } from '@/backend/validation/subscriptions';

export async function GET(request: Request | NextRequest) {
  try {
    const userId = await requireAuth(request);
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    const role = profile?.role || 'customer';

    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const pagination = parsePagination(rawQuery);
    const validatedQuery = querySubscriptionSchema.parse({
      ...rawQuery,
      page: pagination.page,
      page_size: pagination.pageSize,
    });

    const result = await subscriptionService.list({
      limit: pagination.limit,
      offset: pagination.offset,
      customer_id: validatedQuery.customer_id,
      plan_id: validatedQuery.plan_id,
      status: validatedQuery.status,
      search: validatedQuery.search,
      requestingUserId: userId,
      requestingRole: role,
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
    const validated = createSubscriptionSchema.parse(body);

    const subscription = await subscriptionService.create(validated, actorId);
    return successResponse(subscription, undefined, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
