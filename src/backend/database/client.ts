import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { persistSession: false },
  global: { headers: { 'x-application-name': 'brightloop-backend' } },
});

export function getServiceClient(): SupabaseClient {
  return supabase;
}
