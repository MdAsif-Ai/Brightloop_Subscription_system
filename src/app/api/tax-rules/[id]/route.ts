import { NextRequest } from 'next/server';
import { requireStaff, requireAdmin } from '@/backend/auth';
import { taxRuleService } from '@/backend/services/tax-rules';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { updateTaxRuleSchema } from '@/backend/validation/tax-rules';

export async function GET(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff(request);
    const taxRule = await taxRuleService.getById(params.id);
    return successResponse(taxRule);
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
    const validated = updateTaxRuleSchema.parse(body);

    const updated = await taxRuleService.update(params.id, validated);
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
    await taxRuleService.delete(params.id);
    return successResponse({ deleted: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
