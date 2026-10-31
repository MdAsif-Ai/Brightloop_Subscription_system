import { NextRequest } from 'next/server';
import { requireAuth, requireStaff } from '@/backend/auth';
import { supabase } from '@/backend/database/client';
import { subscriptionService } from '@/backend/services/subscriptions';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { updateSubscriptionSchema } from '@/backend/validation/subscriptions';

export async function GET(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth(request);
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    const role = profile?.role || 'customer';

    const subscription = await subscriptionService.getById(params.id, userId, role);
    return successResponse(subscription);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actorId = await requireStaff(request);
    const body = await request.json();
    const validated = updateSubscriptionSchema.parse(body);

    const updated = await subscriptionService.update(params.id, validated, actorId);
    return successResponse(updated);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
