import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z
    .string({ required_error: 'Nama lengkap wajib diisi' })
    .trim()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Kata sandi saat ini wajib diisi' })
      .min(1, 'Kata sandi saat ini tidak boleh kosong'),
    newPassword: z
      .string({ required_error: 'Kata sandi baru wajib diisi' })
      .min(8, 'Kata sandi baru minimal 8 karakter')
      .max(128, 'Kata sandi baru maksimal 128 karakter')
      .regex(/[A-Z]/, 'Kata sandi harus mengandung minimal 1 huruf besar (A-Z)')
      .regex(/[a-z]/, 'Kata sandi harus mengandung minimal 1 huruf kecil (a-z)')
      .regex(/[0-9]/, 'Kata sandi harus mengandung minimal 1 angka (0-9)')
      .regex(/[^A-Za-z0-9]/, 'Kata sandi harus mengandung minimal 1 karakter khusus / simbol'),
    confirmPassword: z
      .string({ required_error: 'Konfirmasi kata sandi wajib diisi' })
      .min(1, 'Konfirmasi kata sandi tidak boleh kosong'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Kata sandi baru harus berbeda dari kata sandi saat ini',
    path: ['newPassword'],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'image/pjpeg',
] as const;

export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export interface MagicBytesResult {
  isValid: boolean;
  canonicalMime: 'image/jpeg' | 'image/png' | 'image/webp' | null;
  ext: 'jpg' | 'png' | 'webp' | null;
}

/**
 * Memvalidasi magic bytes berkas untuk memastikan tipe biner asli (PRD §14.5)
 * Mengembalikan canonical MIME type dan ekstensi aman, atau invalid jika bukan JPEG, PNG, atau WebP.
 */
export function validateImageMagicBytes(buffer: Uint8Array | Buffer): MagicBytesResult {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, canonicalMime: null, ext: null };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, canonicalMime: 'image/jpeg', ext: 'jpg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, canonicalMime: 'image/png', ext: 'png' };
  }

  // 3. WebP: RIFF (bytes 0-3) dan WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, canonicalMime: 'image/webp', ext: 'webp' };
  }

  return { isValid: false, canonicalMime: null, ext: null };
}

