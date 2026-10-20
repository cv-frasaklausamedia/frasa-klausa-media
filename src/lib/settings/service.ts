import { AppError } from '../action-response.ts';
import type { AuthenticatedUser } from '../auth/guards.ts';
import type { SystemSettingsPayload } from '../../types/settings.ts';
import type { SystemSettingsFormInput } from '../../validations/settings.ts';
import type { AuditLogEntry } from '../audit/types.ts';

export interface SettingsServiceDeps {
  auth: {
    requireSuperAdmin: () => Promise<AuthenticatedUser>;
  };
  db: {
    getSettings: () => Promise<SystemSettingsPayload>;
    updateSettings: (
      key: 'general' | 'features',
      value: Record<string, unknown>
    ) => Promise<{ success: boolean; error?: string }>;
    syncContactContent?: (
      contact: Partial<import('../../types/index.ts').ContactContentPayload>
    ) => Promise<void>;
  };
  audit: {
    record: (entry: AuditLogEntry) => Promise<void>;
  };
}

export interface ServiceContext {
  clientIp?: string;
}

/**
 * Logika Bisnis: Menyimpan Pengaturan Platform (Khusus Super Admin)
 * Menyimpan konfigurasi global tanpa menyimpan data rahasia/secret.
 */
export async function executeSaveSettings(
  deps: SettingsServiceDeps,
  input: SystemSettingsFormInput,
  context: ServiceContext = {}
): Promise<{ success: boolean; message: string }> {
  // 1. Otorisasi ketat Server-Side
  const caller = await deps.auth.requireSuperAdmin();
  const ip = context.clientIp ?? '127.0.0.1';

  // 2. Simpan pengaturan umum
  const saveGeneral = await deps.db.updateSettings('general', input.general);
  if (!saveGeneral.success) {
    throw new AppError('Gagal memperbarui konfigurasi umum situs.', 'INTERNAL_SERVER_ERROR', 500);
  }

  // 3. Sinkronkan ke tabel site_content ('contact') agar konten halaman publik otomatis terupdate
  if (deps.db.syncContactContent) {
    try {
      await deps.db.syncContactContent({
        company_name: input.general.site_name,
        tagline: input.general.site_tagline,
        email: input.general.contact_email,
        phone: input.general.contact_phone,
        whatsapp: input.general.contact_whatsapp,
        address: input.general.office_address,
      });
    } catch (syncErr) {
      console.warn('[executeSaveSettings] Gagal menyinkronkan data kontak ke site_content:', syncErr);
    }
  }

  // 4. Simpan pengaturan fitur
  const saveFeatures = await deps.db.updateSettings('features', input.features);
  if (!saveFeatures.success) {
    throw new AppError('Gagal memperbarui konfigurasi fitur platform.', 'INTERNAL_SERVER_ERROR', 500);
  }

  // 5. Catat ke audit log append-only
  await deps.audit.record({
    actorId: caller.id,
    action: 'settings.update',
    targetType: 'settings',
    targetId: 'global',
    status: 'success',
    ipAddress: ip,
    metadata: {
      site_name: input.general.site_name,
      maintenance_mode: input.features.maintenance_mode,
      enable_blog_comments: input.features.enable_blog_comments,
    },
  });

  return {
    success: true,
    message: 'Pengaturan platform berhasil diperbarui dan diterapkan.',
  };
}
