import { AppError } from '../action-response.ts';
import type { AuthenticatedUser } from '../auth/guards.ts';
import type { InquiryStatus } from '../../types/database.ts';
import {
  contactInquirySchema,
  updateInquiryStatusSchema,
  type ContactInquiryInput,
  type UpdateInquiryStatusInput,
  type ContactInquiryValues,
} from '../../validations/inquiry.ts';
import type { InquiryItem } from './types.ts';

export interface InquiryServiceDeps {
  auth?: {
    requireAdmin: () => Promise<AuthenticatedUser>;
  };
  rateLimit: {
    checkLimit: (
      identifier: string
    ) => Promise<{ success: boolean; remaining?: number; reset?: number }>;
  };
  db: {
    createInquiry: (
      data: Omit<ContactInquiryValues, 'hp_field'>
    ) => Promise<{ id: string }>;
    getInquiryById?: (id: string) => Promise<InquiryItem | null>;
    updateInquiryStatus?: (id: string, status: InquiryStatus) => Promise<void>;
    deleteInquiry?: (id: string) => Promise<void>;
  };
}

export interface InquiryContext {
  clientIp?: string;
}

/**
 * Logika Bisnis: Mengirim pesan inquiry kontak dari publik (PRD §6.3.7, §13, §15.11).
 * Pertahanan berlapis:
 * 1. Honeypot check: deteksi bot otomatis tanpa membebani database
 * 2. Validasi schema Zod (panjang nama, format email, panjang pesan)
 * 3. Rate limiting ganda (IP + Email) dengan batas 429
 * 4. Penyimpanan aman ke contact_inquiries dengan status default 'unread'
 */
export async function executeSubmitContactInquiry(
  deps: InquiryServiceDeps,
  rawInput: unknown,
  context: InquiryContext = {}
): Promise<{ success: true; message: string }> {
  // 1. Verifikasi Honeypot bot spam
  const inputObj = typeof rawInput === 'object' && rawInput !== null ? (rawInput as Record<string, unknown>) : {};
  if (inputObj.hp_field && typeof inputObj.hp_field === 'string' && inputObj.hp_field.trim() !== '') {
    throw new AppError('Spam terdeteksi.', 'BAD_REQUEST', 400);
  }

  // 2. Validasi input form dengan Zod
  const validated = contactInquirySchema.parse(rawInput);

  // 3. Verifikasi Rate Limit per kombinasi IP + Email
  const ip = context.clientIp || '127.0.0.1';
  const identifier = `contact:${ip}:${validated.email.toLowerCase()}`;
  const rateLimitResult = await deps.rateLimit.checkLimit(identifier);

  if (!rateLimitResult.success) {
    throw new AppError(
      'Terlalu banyak permintaan pesan. Silakan coba lagi beberapa saat lagi.',
      'TOO_MANY_REQUESTS',
      429
    );
  }

  // 4. Simpan ke database
  await deps.db.createInquiry({
    name: validated.name,
    email: validated.email,
    phone: validated.phone ?? null,
    subject: validated.subject,
    message: validated.message,
  });

  return {
    success: true,
    message: 'Pesan Anda berhasil dikirim. Tim Frasa Klausa Media akan segera menghubungi Anda.',
  };
}

/**
 * Logika Bisnis: Memperbarui status penanganan pesan (unread / replied / archived)
 * Hanya dapat dilakukan oleh admin aktif.
 */
export async function executeUpdateInquiryStatus(
  deps: InquiryServiceDeps,
  rawInput: unknown
): Promise<{ success: true; message: string }> {
  if (!deps.auth || !deps.db.updateInquiryStatus) {
    throw new AppError('Konfigurasi dependency belum lengkap.', 'INTERNAL_SERVER_ERROR', 500);
  }

  await deps.auth.requireAdmin();
  const validated = updateInquiryStatusSchema.parse(rawInput);

  await deps.db.updateInquiryStatus(validated.id, validated.status);

  return {
    success: true,
    message: 'Status pesan berhasil diperbarui.',
  };
}

/**
 * Logika Bisnis: Menghapus pesan masuk
 * Hanya dapat dilakukan oleh admin aktif.
 */
export async function executeDeleteInquiry(
  deps: InquiryServiceDeps,
  id: string
): Promise<{ success: true; message: string }> {
  if (!deps.auth || !deps.db.deleteInquiry) {
    throw new AppError('Konfigurasi dependency belum lengkap.', 'INTERNAL_SERVER_ERROR', 500);
  }

  await deps.auth.requireAdmin();

  if (!id || typeof id !== 'string') {
    throw new AppError('ID pesan tidak valid.', 'BAD_REQUEST', 400);
  }

  await deps.db.deleteInquiry(id);

  return {
    success: true,
    message: 'Pesan berhasil dihapus.',
  };
}
