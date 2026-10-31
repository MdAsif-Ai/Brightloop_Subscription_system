import { NextRequest } from 'next/server';
import { requireAuth } from '@/backend/auth';
import { supabase } from '@/backend/database/client';
import { quotationService } from '@/backend/services/quotations';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';

export async function GET(
  request: Request | NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth(request);
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    const role = profile?.role || 'customer';

    const quotation = await quotationService.getById(params.id, userId, role);
    return successResponse(quotation);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
