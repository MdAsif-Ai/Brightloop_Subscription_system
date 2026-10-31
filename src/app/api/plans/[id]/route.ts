import { NextRequest } from 'next/server';
import { requireStaff, requireAdmin } from '@/backend/auth';
import { planService } from '@/backend/services/plans';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { updatePlanSchema } from '@/backend/validation/plans';

export async function GET(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff(request);
    const plan = await planService.getById(params.id);
    return successResponse(plan);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const validated = updatePlanSchema.parse(body);

    const updated = await planService.update(params.id, validated);
    return successResponse(updated);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    await planService.delete(params.id);
    return successResponse({ deleted: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
