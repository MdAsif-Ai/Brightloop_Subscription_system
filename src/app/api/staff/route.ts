import { NextRequest } from 'next/server';
import { requireAdmin } from '@/backend/auth';
import { supabase } from '@/backend/database/client';
import { successResponse } from '@/backend/http/response';
import { handleApiError } from '@/backend/http/errors';
import { parsePagination } from '@/backend/http/pagination';
import { recordAuditEvent } from '@/backend/services/audit';
import { z } from 'zod';

const createStaffSchema = z.object({
  email: z.string().trim().email(),
  full_name: z.string().trim().min(1),
  role: z.enum(['staff', 'admin']).default('staff'),
  password: z.string().min(6).optional(),
});

export async function GET(request: Request | NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(Object.fromEntries(searchParams.entries()));

    const { data, count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .in('role', ['admin', 'staff'])
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) throw error;

    return successResponse(data, {
      total: count || 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: Request | NextRequest) {
  try {
    const actorId = await requireAdmin(request);
    const body = await request.json();
    const validated = createStaffSchema.parse(body);

    let userId: string;

    // Create auth user if password is provided via admin auth
    if (validated.password) {
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: validated.email,
        password: validated.password,
        email_confirm: true,
        user_metadata: { full_name: validated.full_name, role: validated.role },
      });

      if (authErr) {
        throw authErr;
      }
      userId = authData.user.id;
    } else {
      userId = crypto.randomUUID();
    }

    // Insert or update profile
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: validated.full_name,
        role: validated.role,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profErr) throw profErr;

    await recordAuditEvent(actorId, 'profile', userId, 'staff_created', {
      email: validated.email,
      role: validated.role,
    });

    return successResponse(profile, undefined, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
