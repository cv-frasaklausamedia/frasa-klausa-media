import { AppError } from '../action-response.ts';
import type { AuthenticatedUser } from '../auth/guards.ts';
import type { AdminAccountItem } from '../../types/accounts.ts';
import type {
  CreateAdminUserInput,
  ToggleUserStatusInput,
  ResetUserPasswordInput,
} from '../../validations/account.ts';
import type { AuditLogEntry } from '../audit/types.ts';

export interface AccountServiceDeps {
  auth: {
    requireSuperAdmin: () => Promise<AuthenticatedUser>;
  };
  rateLimit: {
    checkCreateLimit: (key: string) => Promise<{ success: boolean }>;
    checkResetLimit: (key: string) => Promise<{ success: boolean }>;
  };
  authAdmin: {
    createUser: (params: {
      email: string;
      password?: string;
      email_confirm?: boolean;
      user_metadata?: Record<string, unknown>;
    }) => Promise<{
      data: { user: { id: string; email?: string } | null } | null;
      error: { message: string; status?: number; code?: string } | null;
    }>;
    resetPasswordForEmail: (
      email: string,
      options?: { redirectTo?: string }
    ) => Promise<{
      error: { message: string; status?: number } | null;
    }>;
  };
  db: {
    getAccountById: (id: string) => Promise<AdminAccountItem | null>;
    countActiveSuperAdmins: () => Promise<number>;
    updateUserActiveStatus: (
      userId: string,
      isActive: boolean
    ) => Promise<{ success: boolean; error?: string }>;
  };
  audit: {
    record: (entry: AuditLogEntry) => Promise<void>;
  };
}

export interface ServiceContext {
  clientIp?: string;
}

/**
 * Logika Bisnis: Membuat Akun Admin Baru (Khusus Super Admin)
 * Menggunakan Supabase Auth Admin API (service role di server).
 * Akun langsung aktif tanpa dependensi server email SMTP di awal.
 * Role 'super_admin' TIDAK DAPAT diberikan lewat UI ini.
 */
export async function executeCreateAdminUser(
  deps: AccountServiceDeps,
  input: CreateAdminUserInput,
  context: ServiceContext = {}
): Promise<{ success: boolean; message: string; userId: string }> {
  // 1. Otorisasi ketat Server-Side
  const caller = await deps.auth.requireSuperAdmin();

  // 2. Rate limiting (Mencegah brute-force / mass invite)
  const ip = context.clientIp ?? '127.0.0.1';
  const rateLimitKey = `create_admin:${caller.id}:${ip}`;
  const rateLimitResult = await deps.rateLimit.checkCreateLimit(rateLimitKey);

  if (!rateLimitResult.success) {
    throw new AppError(
      'Terlalu banyak permintaan pembuatan akun. Silakan coba kembali beberapa saat lagi.',
      'TOO_MANY_REQUESTS',
      429
    );
  }

  // 3. Panggil Supabase Auth Admin API
  // Parameter email_confirm: true agar akun langsung aktif
  // user_metadata role selalu dikunci ke 'admin'
  const { data, error } = await deps.authAdmin.createUser({
    email: input.email,
    password: input.temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      role: 'admin',
    },
  });

  if (error || !data?.user) {
    const errorMsg = error?.message || 'Gagal membuat akun admin';
    const isDuplicate =
      errorMsg.toLowerCase().includes('already registered') ||
      errorMsg.toLowerCase().includes('duplicate') ||
      errorMsg.toLowerCase().includes('exists');

    // Catat kegagalan ke audit log
    await deps.audit.record({
      actorId: caller.id,
      action: 'user.create',
      targetType: 'user',
      status: 'failure',
      ipAddress: ip,
      metadata: {
        email: input.email,
        full_name: input.fullName,
        reason: isDuplicate ? 'email_already_registered' : 'admin_create_failed',
      },
    });

    if (isDuplicate) {
      throw new AppError(
        'Alamat email sudah terdaftar atau tidak dapat digunakan dalam sistem.',
        'CONFLICT',
        409
      );
    }

    throw new AppError('Terjadi kesalahan saat memproses akun admin baru.', 'INTERNAL_SERVER_ERROR', 500);
  }

  const newUserId = data.user.id;

  // 4. Catat sukses ke audit log (metadata aman tanpa kata sandi!)
  await deps.audit.record({
    actorId: caller.id,
    action: 'user.create',
    targetType: 'user',
    targetId: newUserId,
    status: 'success',
    ipAddress: ip,
    metadata: {
      email: input.email,
      full_name: input.fullName,
      role: 'admin',
      is_active: true,
    },
  });

  return {
    success: true,
    message: 'Akun admin baru berhasil dibuat dan langsung berstatus aktif.',
    userId: newUserId,
  };
}

/**
 * Logika Bisnis: Mengaktifkan atau Menonaktifkan Akun Pengguna
 * Aturan:
 * - Super Admin tidak boleh menonaktifkan dirinya sendiri
 * - Super Admin tidak boleh menonaktifkan Super Admin terakhir di sistem
 */
export async function executeToggleUserStatus(
  deps: AccountServiceDeps,
  input: ToggleUserStatusInput,
  context: ServiceContext = {}
): Promise<{ success: boolean; message: string }> {
  // 1. Otorisasi ketat Server-Side
  const caller = await deps.auth.requireSuperAdmin();

  const ip = context.clientIp ?? '127.0.0.1';

  // 2. Proteksi diri sendiri: Super Admin tidak boleh menonaktifkan akunnya sendiri
  if (caller.id === input.userId && !input.isActive) {
    throw new AppError(
      'Anda tidak dapat menonaktifkan akun Anda sendiri demi menjaga integritas akses sistem.',
      'FORBIDDEN',
      403
    );
  }

  // 3. Ambil data target akun
  const targetUser = await deps.db.getAccountById(input.userId);
  if (!targetUser) {
    throw new AppError('Data akun pengguna tidak ditemukan.', 'NOT_FOUND', 404);
  }

  // 4. Proteksi Super Admin terakhir
  if (targetUser.role === 'super_admin' && !input.isActive) {
    const activeSuperAdminCount = await deps.db.countActiveSuperAdmins();
    if (activeSuperAdminCount <= 1) {
      throw new AppError(
        'Tidak dapat menonaktifkan Super Admin terakhir yang tersisa di sistem.',
        'FORBIDDEN',
        403
      );
    }
  }

  // 5. Eksekusi pengubahan status di DB
  const updateResult = await deps.db.updateUserActiveStatus(input.userId, input.isActive);
  if (!updateResult.success) {
    throw new AppError('Gagal memperbarui status keaktifan akun pengguna.', 'INTERNAL_SERVER_ERROR', 500);
  }

  // 6. Catat audit log
  const auditAction = input.isActive ? 'user.activate' : 'user.deactivate';
  await deps.audit.record({
    actorId: caller.id,
    action: auditAction,
    targetType: 'user',
    targetId: input.userId,
    status: 'success',
    ipAddress: ip,
    metadata: {
      target_email: targetUser.email,
      target_role: targetUser.role,
      new_status: input.isActive,
    },
  });

  return {
    success: true,
    message: input.isActive
      ? 'Akun admin berhasil diaktifkan kembali.'
      : 'Akun admin berhasil dinonaktifkan. Akses ke CMS langsung diblokir.',
  };
}

/**
 * Logika Bisnis: Reset Kredensial Pengguna
 * Mengirim email tautan pemulihan kata sandi via Supabase Auth.
 * Tidak pernah membocorkan password atau token di UI maupun log.
 */
export async function executeResetUserPassword(
  deps: AccountServiceDeps,
  input: ResetUserPasswordInput,
  context: ServiceContext = {}
): Promise<{ success: boolean; message: string }> {
  // 1. Otorisasi ketat Server-Side
  const caller = await deps.auth.requireSuperAdmin();

  const ip = context.clientIp ?? '127.0.0.1';

  // 2. Rate limiting reset per target user
  const rateLimitKey = `reset_password:${input.userId}:${ip}`;
  const rateLimitResult = await deps.rateLimit.checkResetLimit(rateLimitKey);

  if (!rateLimitResult.success) {
    throw new AppError(
      'Terlalu banyak permintaan reset kata sandi untuk akun ini. Silakan coba kembali dalam 15 menit.',
      'TOO_MANY_REQUESTS',
      429
    );
  }

  // 3. Ambil data target akun
  const targetUser = await deps.db.getAccountById(input.userId);
  if (!targetUser || !targetUser.email) {
    throw new AppError('Akun pengguna atau alamat email tidak ditemukan.', 'NOT_FOUND', 404);
  }

  // 4. Kirim email reset kredensial via Supabase Auth
  const { error } = await deps.authAdmin.resetPasswordForEmail(targetUser.email);

  if (error) {
    console.error('[executeResetUserPassword] Supabase reset error:', error.message);
    await deps.audit.record({
      actorId: caller.id,
      action: 'user.reset_password',
      targetType: 'user',
      targetId: input.userId,
      status: 'failure',
      ipAddress: ip,
      metadata: {
        target_email: targetUser.email,
        reason: error.message,
      },
    });

    throw new AppError('Gagal mengirimkan email pemulihan kredensial.', 'INTERNAL_SERVER_ERROR', 500);
  }

  // 5. Catat sukses ke audit log (metadata aman tanpa token/password)
  await deps.audit.record({
    actorId: caller.id,
    action: 'user.reset_password',
    targetType: 'user',
    targetId: input.userId,
    status: 'success',
    ipAddress: ip,
    metadata: {
      target_email: targetUser.email,
      target_role: targetUser.role,
    },
  });

  return {
    success: true,
    message: 'Tautan pemulihan kata sandi telah berhasil dikirimkan ke alamat email terdaftar.',
  };
}
