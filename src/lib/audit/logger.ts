import { createAdminClient } from '../supabase/admin.server.ts';
import { sanitizeAuditMetadata } from './sanitizer.ts';
import type { AuditLogEntry } from './types.ts';
import type { Json } from '../../types/database.ts';

/**
 * Menyimpan rekaman audit log append-only ke basis data.
 * Menerapkan fail-safe: kegagalan penulisan log tidak boleh menggagalkan operasi bisnis utama.
 */
export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient();

    const sanitizedMetadata = sanitizeAuditMetadata(entry.metadata) as Json;

    const { error } = await supabase.from('audit_logs').insert({
      actor_id: entry.actorId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId ?? null,
      status: entry.status,
      metadata: sanitizedMetadata,
      ip_address: entry.ipAddress ?? null,
    });

    if (error) {
      console.error('[AuditLogger] Gagal menyimpan entri audit log ke database:', error.message);
    }
  } catch (err) {
    console.error('[AuditLogger] Pengecualian tidak terduga saat mencatat audit log:', err);
  }
}
