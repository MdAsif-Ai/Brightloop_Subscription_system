import { NextRequest } from 'next/server';
import { requireStaff, requireAdmin } from '@/backend/auth';
import { discountService } from '@/backend/services/discounts';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { updateDiscountRuleSchema } from '@/backend/validation/discounts';

export async function GET(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff(request);
    const discount = await discountService.getById(params.id);
    return successResponse(discount);
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
    const validated = updateDiscountRuleSchema.parse(body);

    const updated = await discountService.update(params.id, validated);
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
    await discountService.delete(params.id);
    return successResponse({ deleted: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
