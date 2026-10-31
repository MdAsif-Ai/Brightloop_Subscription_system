import { NextRequest } from 'next/server';
import { requireStaff } from '@/backend/auth';
import { paymentService } from '@/backend/services/payments';
import { parsePagination } from '@/backend/http/pagination';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { z } from 'zod';

const recordPaymentSchema = z.object({
  invoice_id: z.string().uuid({ message: 'invoice_id must be a valid UUID' }),
  amount_minor: z.coerce.number().int().min(1, { message: 'amount_minor must be at least 1' }),
  method: z.enum(['bank_transfer', 'upi', 'card', 'cash', 'other']),
  reference: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

export async function GET(request: Request | NextRequest) {
  try {
    await requireStaff(request);
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(Object.fromEntries(searchParams.entries()));
    const invoiceId = searchParams.get('invoice_id') || undefined;

    const result = await paymentService.list({
      limit: pagination.limit,
      offset: pagination.offset,
      invoice_id: invoiceId,
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

export async function POST(request: Request | NextRequest) {
  try {
    const actorId = await requireStaff(request);
    const body = await request.json();
    const validated = recordPaymentSchema.parse(body);

    const result = await paymentService.recordPayment(validated, actorId);
    return successResponse(result, undefined, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
