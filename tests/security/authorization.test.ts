import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, requireStaff, requireAdmin, AuthError } from '@/backend/auth';
import { supabase } from '@/backend/database/client';

describe('Authorization Security Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects request with missing Authorization header', async () => {
    const req = new Request('http://localhost:3000/api/products');
    await expect(requireAuth(req)).rejects.toThrow(AuthError);
    await expect(requireAuth(req)).rejects.toMatchObject({ status: 401, code: 'MISSING_TOKEN' });
  });

  it('rejects request with malformed Authorization header', async () => {
    const req = new Request('http://localhost:3000/api/products', {
      headers: { authorization: 'Basic 12345' },
    });
    await expect(requireAuth(req)).rejects.toThrow(AuthError);
  });

  it('rejects request when token is invalid or expired in Supabase Auth', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'jwt expired', name: 'AuthError', status: 401 } as any,
    });

    const req = new Request('http://localhost:3000/api/products', {
      headers: { authorization: 'Bearer invalid_token' },
    });
    await expect(requireAuth(req)).rejects.toMatchObject({ status: 401, code: 'INVALID_TOKEN' });
  });

  it('rejects customer from staff access with 403 Forbidden', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
      data: { user: { id: 'cust-123' } as any },
      error: null,
    });

    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { role: 'customer' },
            error: null,
          }),
        }),
      }),
    } as any);

    const req = new Request('http://localhost:3000/api/products', {
      headers: { authorization: 'Bearer valid_cust_token' },
    });

    await expect(requireStaff(req)).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('rejects staff from admin-only mutation with 403 Forbidden', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
      data: { user: { id: 'staff-456' } as any },
      error: null,
    });

    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { role: 'staff' },
            error: null,
          }),
        }),
      }),
    } as any);

    const req = new Request('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { authorization: 'Bearer staff_token' },
    });

    await expect(requireAdmin(req)).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('allows administrator to pass requireAdmin and requireStaff', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'admin-789' } as any },
      error: null,
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { role: 'admin' },
            error: null,
          }),
        }),
      }),
    } as any);

    const req = new Request('http://localhost:3000/api/products', {
      headers: { authorization: 'Bearer admin_token' },
    });

    const staffResult = await requireStaff(req);
    expect(staffResult).toBe('admin-789');

    const adminResult = await requireAdmin(req);
    expect(adminResult).toBe('admin-789');
  });
});
