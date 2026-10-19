'use server';

import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin.server';
import { getClientIp, userCreateRateLimiter, userResetRateLimiter } from '@/lib/rate-limit';
import { recordAuditLog } from '@/lib/audit/logger';
import {
  getAccountById,
  countActiveSuperAdmins,
  updateUserActiveStatus,
} from '@/lib/accounts/data-access';
import {
  executeCreateAdminUser,
  executeToggleUserStatus,
  executeResetUserPassword,
  type AccountServiceDeps,
} from '@/lib/accounts/service';
import {
  createAdminUserSchema,
  toggleUserStatusSchema,
  resetUserPasswordSchema,
} from '@/validations/account';
import {
  actionError,
  actionSuccess,
  handleActionError,
  type ActionResponse,
} from '@/lib/action-response';

/**
 * Menyusun dependensi nyata untuk operasi manajemen akun admin
 */
function getRealAccountServiceDeps(): AccountServiceDeps {
  const adminClient = createAdminClient();

  return {
    auth: {
      requireSuperAdmin: () => requireSuperAdmin(),
    },
    rateLimit: {
      checkCreateLimit: async (key: string) => {
        const res = await userCreateRateLimiter.limit(key);
        return { success: res.success };
      },
      checkResetLimit: async (key: string) => {
        const res = await userResetRateLimiter.limit(key);
        return { success: res.success };
      },
    },
    authAdmin: {
      createUser: async (params) => {
        return adminClient.auth.admin.createUser(params);
      },
      resetPasswordForEmail: async (email, options) => {
        return adminClient.auth.resetPasswordForEmail(email, options);
      },
    },
    db: {
      getAccountById: (id) => getAccountById(id),
      countActiveSuperAdmins: () => countActiveSuperAdmins(),
      updateUserActiveStatus: (userId, isActive) => updateUserActiveStatus(userId, isActive),
    },
    audit: {
      record: (entry) => recordAuditLog(entry),
    },
  };
}

/**
 * Server Action: Membuat Akun Admin Baru
 * Khusus Super Admin aktif (requireSuperAdmin).
 * Menggunakan Supabase Auth Admin API (service role, server-only).
 */
export async function createAdminUserAction(
  rawInput: unknown
): Promise<ActionResponse<{ message: string; userId: string }>> {
  try {
    const validation = createAdminUserSchema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path.join('.') || 'form';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return actionError('Validasi data akun admin gagal.', 'VALIDATION_ERROR', 422, fieldErrors);
    }

    const clientIp = await getClientIp();
    const deps = getRealAccountServiceDeps();

    const result = await executeCreateAdminUser(deps, validation.data, { clientIp });

    revalidatePath('/admin/users');

    return actionSuccess({
      message: result.message,
      userId: result.userId,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Mengaktifkan atau Menonaktifkan Akun Pengguna
 * Khusus Super Admin aktif (requireSuperAdmin).
 */
export async function toggleUserStatusAction(
  rawInput: unknown
): Promise<ActionResponse<{ message: string }>> {
  try {
    const validation = toggleUserStatusSchema.safeParse(rawInput);
    if (!validation.success) {
      return actionError('Data status pengguna tidak valid.', 'VALIDATION_ERROR', 422);
    }

    const clientIp = await getClientIp();
    const deps = getRealAccountServiceDeps();

    const result = await executeToggleUserStatus(deps, validation.data, { clientIp });

    revalidatePath('/admin/users');

    return actionSuccess({
      message: result.message,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Reset Kata Sandi Pengguna
 * Mengirimkan email pemulihan via Supabase Auth tanpa membocorkan token/kata sandi.
 */
export async function resetUserPasswordAction(
  rawInput: unknown
): Promise<ActionResponse<{ message: string }>> {
  try {
    const validation = resetUserPasswordSchema.safeParse(rawInput);
    if (!validation.success) {
      return actionError('Data ID pengguna tidak valid.', 'VALIDATION_ERROR', 422);
    }

    const clientIp = await getClientIp();
    const deps = getRealAccountServiceDeps();

    const result = await executeResetUserPassword(deps, validation.data, { clientIp });

    return actionSuccess({
      message: result.message,
    });
  } catch (error) {
    return handleActionError(error);
  }
}
