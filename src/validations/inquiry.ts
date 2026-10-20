import { z } from 'zod';

export const INQUIRY_STATUSES = ['unread', 'replied', 'archived'] as const;

export const INQUIRY_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_INQUIRY_PAGE_SIZE = 10;

/**
 * Regex nomor telepon fleksibel (mendukung format internasional seperti +62... atau 08...)
 */
export const PHONE_REGEX = /^(\+?[0-9\s-]{8,20})?$/;

/**
 * Skema validasi pengiriman formulir kontak publik (PRD §6.3.7, §13, §15.11).
 * Dilengkapi field honeypot 'hp_field' untuk menangkal bot spam secara deterministik.
 */
export const contactInquirySchema = z.object({
  name: z
    .string({ required_error: 'Nama wajib diisi.' })
    .trim()
    .min(2, 'Nama minimal 2 karakter.')
    .max(100, 'Nama maksimal 100 karakter.'),

  email: z
    .string({ required_error: 'Alamat email wajib diisi.' })
    .trim()
    .email('Format alamat email tidak valid.')
    .max(255, 'Alamat email maksimal 255 karakter.')
    .toLowerCase(),

  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val && val.trim() !== '' ? val.trim() : null))
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Format nomor telepon tidak valid. Gunakan 8–20 digit angka atau format +62.',
    }),

  subject: z
    .string({ required_error: 'Subjek pesan wajib diisi.' })
    .trim()
    .min(3, 'Subjek minimal 3 karakter.')
    .max(150, 'Subjek maksimal 150 karakter.'),

  message: z
    .string({ required_error: 'Pesan wajib diisi.' })
    .trim()
    .min(10, 'Pesan minimal 10 karakter.')
    .max(2000, 'Pesan maksimal 2000 karakter.'),

  /**
   * Field honeypot tersembunyi.
   * Bot spam otomatis mengisi seluruh input form; jika field ini terisi maka permintaan ditolak.
   */
  hp_field: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : ''))
    .refine((val) => val === '', {
      message: 'Spam terdeteksi.',
    }),
});

export type ContactInquiryInput = z.input<typeof contactInquirySchema>;
export type ContactInquiryValues = z.output<typeof contactInquirySchema>;

/**
 * Skema query params untuk daftar inbox pesan di admin panel
 */
export const inquiryQuerySchema = z.object({
  page: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) || num < 1 ? 1 : Math.floor(num);
  }, z.number().int().positive().catch(1)),

  pageSize: z.preprocess((val) => {
    const num = Number(val);
    return INQUIRY_PAGE_SIZE_OPTIONS.includes(num as (typeof INQUIRY_PAGE_SIZE_OPTIONS)[number])
      ? num
      : DEFAULT_INQUIRY_PAGE_SIZE;
  }, z.number().int().catch(DEFAULT_INQUIRY_PAGE_SIZE)),

  status: z.preprocess((val) => {
    if (val === 'unread' || val === 'replied' || val === 'archived') return val;
    return 'all';
  }, z.enum(['all', 'unread', 'replied', 'archived']).catch('all')),

  q: z.preprocess((val) => {
    if (typeof val === 'string') return val.trim().slice(0, 100);
    return '';
  }, z.string().catch('')),
});

export type InquiryQueryParams = z.infer<typeof inquiryQuerySchema>;

/**
 * Skema pembaruan status pesan oleh admin
 */
export const updateInquiryStatusSchema = z.object({
  id: z.string().uuid('ID pesan tidak valid.'),
  status: z.enum(['unread', 'replied', 'archived'] as const, {
    required_error: 'Status pesan wajib dipilih.',
  }),
});

export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusSchema>;
