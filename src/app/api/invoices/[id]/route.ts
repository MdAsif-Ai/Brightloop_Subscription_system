import { NextRequest } from 'next/server';
import { requireAuth, requireStaff } from '@/backend/auth';
import { supabase } from '@/backend/database/client';
import { invoiceService } from '@/backend/services/invoices';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { z } from 'zod';

const patchInvoiceSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'paid', 'canceled']),
});

export async function GET(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth(request);
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    const role = profile?.role || 'customer';

    const invoice = await invoiceService.getById(params.id, userId, role);
    return successResponse(invoice);
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
    const validated = patchInvoiceSchema.parse(body);

    const updated = await invoiceService.updateStatus(params.id, validated.status, actorId);
    return successResponse(updated);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
