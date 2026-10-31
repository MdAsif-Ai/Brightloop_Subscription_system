import { NextRequest } from 'next/server';
import { requireAuth } from '@/backend/auth';
import { supabase } from '@/backend/database/client';
import { invoiceService } from '@/backend/services/invoices';
import { parsePagination } from '@/backend/http/pagination';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { z } from 'zod';

const queryInvoiceSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  customer_id: z.string().uuid().optional(),
  subscription_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'confirmed', 'paid', 'canceled']).optional(),
  search: z.string().trim().optional(),
});

export async function GET(request: Request | NextRequest) {
  try {
    const userId = await requireAuth(request);
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    const role = profile?.role || 'customer';

    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const pagination = parsePagination(rawQuery);
    const validatedQuery = queryInvoiceSchema.parse({
      ...rawQuery,
      page: pagination.page,
      page_size: pagination.pageSize,
    });

    const result = await invoiceService.list({
      limit: pagination.limit,
      offset: pagination.offset,
      customer_id: validatedQuery.customer_id,
      subscription_id: validatedQuery.subscription_id,
      status: validatedQuery.status,
      search: validatedQuery.search,
      requestingUserId: userId,
      requestingRole: role,
    });

    return successResponse(result.items, {
      total: result.total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
