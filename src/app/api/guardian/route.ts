import { NextRequest } from 'next/server';
import { requireStaff } from '@/backend/auth';
import { guardianService } from '@/backend/services/guardian';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';

export async function GET(request: Request | NextRequest) {
  try {
    await requireStaff(request);
    const { searchParams } = new URL(request.url);
    const asOfDate = searchParams.get('as_of_date') || undefined;

    const data = await guardianService.inspectRevenue(asOfDate);
    return successResponse(data);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
