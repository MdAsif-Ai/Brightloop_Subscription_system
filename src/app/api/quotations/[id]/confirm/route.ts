import { NextRequest } from 'next/server';
import { requireAuth } from '@/backend/auth';
import { quotationService } from '@/backend/services/quotations';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';

export async function POST(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actorId = await requireAuth(request);
    const confirmed = await quotationService.confirm(params.id, actorId);
    return successResponse(confirmed);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
