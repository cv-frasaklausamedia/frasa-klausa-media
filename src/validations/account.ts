import { z } from 'zod';

export const createAdminUserSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .email('Format alamat email tidak valid')
    .max(150, 'Panjang email maksimal 150 karakter')
    .toLowerCase(),
  fullName: z
    .string()
    .trim()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  temporaryPassword: z
    .string()
    .min(8, 'Kata sandi sementara minimal 8 karakter')
    .max(100, 'Kata sandi sementara maksimal 100 karakter')
    .regex(/[a-zA-Z]/, 'Kata sandi sementara wajib mengandung minimal 1 huruf')
    .regex(/\d/, 'Kata sandi sementara wajib mengandung minimal 1 angka'),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;

export const toggleUserStatusSchema = z.object({
  userId: z.string().uuid('ID pengguna tidak valid'),
  isActive: z.boolean({ required_error: 'Status keaktifan wajib ditentukan' }),
});

export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;

export const resetUserPasswordSchema = z.object({
  userId: z.string().uuid('ID pengguna tidak valid'),
});

export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;

export const accountQuerySchema = z.object({
  q: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : '')),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  role: z.enum(['all', 'admin', 'super_admin']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().default('created_at_desc'),
});

export type AccountQueryInput = z.infer<typeof accountQuerySchema>;
