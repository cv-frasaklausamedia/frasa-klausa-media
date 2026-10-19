import { AuthError } from '../action-response.ts';
import type { UserRole } from '../../types/database.ts';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface RawAuthUser {
  id: string;
  email?: string | null;
}

export interface RawProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
}

/**
 * Validasi murni untuk status pengguna dan profil DB.
 * Memastikan akun valid, terdaftar, dan berstatus aktif (is_active).
 */
export function validateUserProfile(
  user: RawAuthUser | null | undefined,
  profile: RawProfile | null | undefined
): AuthenticatedUser {
  if (!user) {
    throw new AuthError('Sesi tidak valid atau telah berakhir. Silakan login kembali.', 401);
  }

  if (!profile) {
    throw new AuthError('Profil pengguna tidak ditemukan pada sistem.', 401);
  }

  if (!profile.is_active) {
    throw new AuthError('Akun Anda telah dinonaktifkan. Silakan hubungi Super Admin.', 403);
  }

  return {
    id: profile.id,
    email: user.email ?? '',
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isActive: profile.is_active,
  };
}

/**
 * Validasi otorisasi peran Admin (admin atau super_admin).
 */
export function validateAdminRole(user: AuthenticatedUser): AuthenticatedUser {
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new AuthError('Akses ditolak: Memerlukan hak akses Admin.', 403);
  }
  return user;
}

/**
 * Validasi otorisasi peran Super Admin.
 */
export function validateSuperAdminRole(user: AuthenticatedUser): AuthenticatedUser {
  if (user.role !== 'super_admin') {
    throw new AuthError('Akses ditolak: Memerlukan hak akses Super Admin.', 403);
  }
  return user;
}
