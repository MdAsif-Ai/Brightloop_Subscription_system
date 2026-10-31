import { NextRequest } from 'next/server';
import { requireStaff } from '@/backend/auth';
import { billingEngine } from '@/backend/billing/engine';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { z } from 'zod';

const runBillingSchema = z.object({
  as_of_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'as_of_date must be YYYY-MM-DD' }).optional(),
});

export async function POST(request: Request | NextRequest) {
  try {
    const actorId = await requireStaff(request);
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional, defaults to today
    }

    const validated = runBillingSchema.parse(body);
    const asOfDate = validated.as_of_date || new Date().toISOString().split('T')[0];

    const result = await billingEngine.runBatch(asOfDate, actorId);
    return successResponse(result);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
