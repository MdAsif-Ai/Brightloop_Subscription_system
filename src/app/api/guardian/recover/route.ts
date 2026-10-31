import { NextRequest } from 'next/server';
import { requireStaff } from '@/backend/auth';
import { guardianService } from '@/backend/services/guardian';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { z } from 'zod';

const recoverSchema = z.object({
  subscription_id: z.string().uuid({ message: 'subscription_id must be a valid UUID' }),
});

export async function POST(request: Request | NextRequest) {
  try {
    const actorId = await requireStaff(request);
    const body = await request.json();
    const validated = recoverSchema.parse(body);

    const result = await guardianService.recoverMissingInvoice(validated.subscription_id, actorId);
    return successResponse(result);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
