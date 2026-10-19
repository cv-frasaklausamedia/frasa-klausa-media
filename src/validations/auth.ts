import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email wajib diisi' })
    .trim()
    .min(1, 'Email tidak boleh kosong')
    .email('Format alamat email tidak valid')
    .max(255, 'Email terlalu panjang'),
  password: z
    .string({ required_error: 'Kata sandi wajib diisi' })
    .min(1, 'Kata sandi tidak boleh kosong')
    .min(6, 'Kata sandi minimal 6 karakter')
    .max(128, 'Kata sandi terlalu panjang'),
  redirectTo: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
