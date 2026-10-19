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

export const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
