'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/validations/auth';
import { authRateLimiter, getClientIp } from '@/lib/rate-limit';
import { getSafeRedirectUrl } from '@/lib/redirect-validator';
import {
  actionError,
  actionSuccess,
  handleActionError,
  type ActionResponse,
} from '@/lib/action-response';

/**
 * Server Action: signInAction
 *
 * Mengautentikasi pengguna Admin/Super Admin dengan pengamanan:
 * 1. Validasi skema Zod di server.
 * 2. Rate limiting berbasis kombinasi IP + Email (mencegah brute-force).
 * 3. Pesan error generik anti-user enumeration.
 * 4. Pengecekan status akun aktif (is_active) di DB sebelum memberikan akses.
 * 5. Validasi rute redirect berbasis allowlist internal (mencegah open redirect).
 */
export async function signInAction(
  rawInput: unknown
): Promise<ActionResponse<{ redirectTo: string }>> {
  try {
    // 1. Validasi Input di Server
    const validation = loginSchema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path.join('.') || 'form';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return actionError(
        'Validasi formulir gagal. Silakan periksa kembali data Anda.',
        'VALIDATION_ERROR',
        422,
        fieldErrors
      );
    }

    const { email, password, redirectTo } = validation.data;

    // 2. Proteksi Brute Force / Rate Limiting per IP + Email
    const clientIp = await getClientIp();
    const rateLimitKey = `login:${clientIp}:${email.toLowerCase()}`;
    const rateLimitResult = await authRateLimiter.limit(rateLimitKey);

    if (!rateLimitResult.success) {
      return actionError(
        'Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba kembali.',
        'TOO_MANY_REQUESTS',
        429
      );
    }

    // 3. Autentikasi dengan Supabase Auth
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Pesan generik tanpa membocorkan apakah email terdaftar atau tidak (PRD §15.12)
    const GENERIC_AUTH_ERROR = 'Email atau kata sandi tidak valid.';

    if (authError || !authData.user) {
      return actionError(GENERIC_AUTH_ERROR, 'UNAUTHORIZED', 401);
    }

    // 4. Verifikasi Status Akun di Basis Data (is_active & role)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', authData.user.id)
      .maybeSingle();

    const profileRecord = profile as { id: string; role: string; is_active: boolean } | null;

    if (profileError || !profileRecord || !profileRecord.is_active) {
      // Segera batalkan sesi jika akun dinonaktifkan atau profil tidak sah
      await supabase.auth.signOut();
      return actionError(GENERIC_AUTH_ERROR, 'UNAUTHORIZED', 401);
    }

    // 5. Validasi parameter redirect (hanya boleh path internal admin)
    const safeTarget = getSafeRedirectUrl(redirectTo, '/admin');

    return actionSuccess({ redirectTo: safeTarget });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: signOutAction
 *
 * Mengakhiri sesi pengguna dan mengalihkan ke halaman login.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
