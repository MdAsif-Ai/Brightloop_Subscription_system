import { NextRequest } from 'next/server';
import { requireStaff } from '@/backend/auth';
import { subscriptionService } from '@/backend/services/subscriptions';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { transitionSubscriptionSchema } from '@/backend/validation/subscriptions';

export async function POST(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actorId = await requireStaff(request);
    const body = await request.json();
    const validated = transitionSubscriptionSchema.parse(body);

    const updated = await subscriptionService.transition(params.id, validated, actorId);
    return successResponse(updated);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
