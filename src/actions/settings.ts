'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';
import { recordAuditLog } from '@/lib/audit/logger';
import {
  getSystemSettingsRecord,
  updateSystemSettingsRecord,
} from '@/lib/settings/data-access';
import {
  getSiteContentRecord,
  upsertSiteContentRecord,
} from '@/lib/site-content/data-access';
import {
  executeSaveSettings,
  type SettingsServiceDeps,
} from '@/lib/settings/service';
import { systemSettingsFormSchema } from '@/validations/settings';
import {
  actionError,
  actionSuccess,
  handleActionError,
  type ActionResponse,
} from '@/lib/action-response';

/**
 * Menyusun dependensi nyata untuk pengaturan platform
 */
function getRealSettingsServiceDeps(): SettingsServiceDeps {
  return {
    auth: {
      requireSuperAdmin: () => requireSuperAdmin(),
    },
    db: {
      getSettings: () => getSystemSettingsRecord(),
      updateSettings: (key, value) => updateSystemSettingsRecord(key, value),
      syncContactContent: async (contactPartial) => {
        const currentContact = await getSiteContentRecord('contact');
        await upsertSiteContentRecord('contact', {
          ...currentContact,
          ...contactPartial,
        });
      },
    },
    audit: {
      record: (entry) => recordAuditLog(entry),
    },
  };
}

/**
 * Server Action: Menyimpan Pengaturan Platform
 * Khusus Super Admin aktif (requireSuperAdmin).
 */
export async function saveSettingsAction(
  rawInput: unknown
): Promise<ActionResponse<{ message: string }>> {
  try {
    const validation = systemSettingsFormSchema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path.join('.') || 'form';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return actionError('Validasi formulir pengaturan gagal.', 'VALIDATION_ERROR', 422, fieldErrors);
    }

    const clientIp = await getClientIp();
    const deps = getRealSettingsServiceDeps();

    const result = await executeSaveSettings(deps, validation.data, { clientIp });

    // Revalidasi halaman admin dan layout publik
    revalidatePath('/admin/settings');
    revalidatePath('/admin/site-content');
    revalidatePath('/kontak');
    revalidatePath('/', 'layout');
    revalidateTag('site-content-contact', { expire: 0 });

    return actionSuccess({
      message: result.message,
    });
  } catch (error) {
    return handleActionError(error);
  }
}
