import { NextRequest } from 'next/server';
import { requireAuth, requireStaff } from '@/backend/auth';
import { supabase } from '@/backend/database/client';
import { customerService } from '@/backend/services/customers';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { updateCustomerSchema } from '@/backend/validation/customers';

export async function GET(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth(request);

    // Fetch user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    const role = profile?.role || 'customer';

    const customer = await customerService.getById(params.id, userId, role);
    return successResponse(customer);
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
    const validated = updateCustomerSchema.parse(body);

    const updated = await customerService.update(params.id, validated, actorId);
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
    await requireStaff(request);
    await customerService.delete(params.id);
    return successResponse({ deleted: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
