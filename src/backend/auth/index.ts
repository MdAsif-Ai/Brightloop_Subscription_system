import { NextRequest } from 'next/server';
import { supabase } from '@/backend/database/client';

export class AuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 401, code = 'UNAUTHORIZED') {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Verify that the request contains a valid Bearer token.
 * Returns the authenticated user's ID.
 */
export async function requireAuth(request: Request | NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or malformed Authorization header', 401, 'MISSING_TOKEN');
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new AuthError('Invalid or expired authentication token', 401, 'INVALID_TOKEN');
  }
  return user.id;
}

/**
 * Ensures that the authenticated user has a role of 'admin' or 'staff'.
 * Returns the user's ID on success.
 */
export async function requireStaff(request: Request | NextRequest): Promise<string> {
  const userId = await requireAuth(request);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new AuthError('Unable to fetch user profile', 401, 'PROFILE_NOT_FOUND');
  }

  if (!['admin', 'staff'].includes(profile.role)) {
    throw new AuthError('Insufficient permissions: staff access required', 403, 'FORBIDDEN');
  }

  return userId;
}

/**
 * Ensures that the authenticated user has the 'admin' role.
 * Returns the user's ID on success.
 */
export async function requireAdmin(request: Request | NextRequest): Promise<string> {
  const userId = await requireAuth(request);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new AuthError('Unable to fetch user profile', 401, 'PROFILE_NOT_FOUND');
  }

  if (profile.role !== 'admin') {
    throw new AuthError('Insufficient permissions: administrator access required', 403, 'FORBIDDEN');
  }

  return userId;
}
