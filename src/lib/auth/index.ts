import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthError } from '@/lib/action-response';
import {
  validateUserProfile,
  validateAdminRole,
  validateSuperAdminRole,
  type AuthenticatedUser,
} from './guards';

export * from './guards';

/**
 * Mengambil data pengguna aktif saat ini tanpa melempar exception.
 * Mengembalikan null jika belum login, profil tidak ada, atau akun nonaktif.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    await connection();
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    try {
      return validateUserProfile(user, profile);
    } catch {
      return null;
    }
  } catch (error) {
    console.error('[getCurrentUser] Error fetching current user:', error);
    return null;
  }
}

/**
 * Memastikan pengguna memiliki sesi aktif dan akun berstatus aktif.
 * Melempar AuthError (401 atau 403) jika tidak memenuhi syarat.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthError('Sesi tidak valid atau telah berakhir. Silakan login kembali.', 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new AuthError('Gagal memuat profil pengguna dari basis data.', 401);
  }

  return validateUserProfile(user, profile);
}

/**
 * Memastikan pengguna adalah Admin aktif (role: 'admin' atau 'super_admin').
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  return validateAdminRole(user);
}

/**
 * Memastikan pengguna adalah Super Admin aktif (role: 'super_admin').
 */
export async function requireSuperAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  return validateSuperAdminRole(user);
}
