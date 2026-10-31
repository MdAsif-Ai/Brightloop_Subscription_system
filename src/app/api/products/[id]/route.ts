import { NextRequest } from 'next/server';
import { requireStaff, requireAdmin } from '@/backend/auth';
import { productService } from '@/backend/services/products';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { updateProductSchema } from '@/backend/validation/products';

export async function GET(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff(request);
    const product = await productService.getById(params.id);
    return successResponse(product);
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
    const validated = updateProductSchema.parse(body);

    const updated = await productService.update(params.id, validated);
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
    await productService.delete(params.id);
    return successResponse({ deleted: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
