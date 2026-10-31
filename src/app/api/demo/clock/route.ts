import { NextRequest } from 'next/server';
import { requireStaff } from '@/backend/auth';
import { clockService } from '@/backend/services/clock';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { z } from 'zod';

const clockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' }).optional(),
  reset: z.boolean().optional(),
});

export async function GET(request: Request | NextRequest) {
  try {
    await requireStaff(request);
    const currentDate = clockService.getCurrentDate();
    return successResponse({
      current_date: currentDate,
      is_simulated: currentDate !== new Date().toISOString().split('T')[0],
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: Request | NextRequest) {
  try {
    await requireStaff(request);
    const body = await request.json();
    const validated = clockSchema.parse(body);

    let currentDate: string;
    if (validated.reset) {
      currentDate = clockService.reset();
    } else if (validated.date) {
      currentDate = clockService.setDate(validated.date);
    } else {
      currentDate = clockService.getCurrentDate();
    }

    return successResponse({
      current_date: currentDate,
      is_simulated: currentDate !== new Date().toISOString().split('T')[0],
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
