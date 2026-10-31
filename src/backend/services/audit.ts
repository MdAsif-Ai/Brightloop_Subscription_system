import { supabase } from '@/backend/database/client';

export async function recordAuditEvent(
  actorId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('audit_events').insert({
      actor_id: actorId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      details,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Audit logging shouldn't crash primary flows but log error
    console.error('Failed to record audit event:', err);
  }
}
