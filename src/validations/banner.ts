import { z } from 'zod';

// ============================================================================
// 1. KONSTANTA DOMAIN BANNER
// ============================================================================

export const BANNER_MESSAGE_MIN_LENGTH = 3;
export const BANNER_MESSAGE_MAX_LENGTH = 200;

export const BANNER_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_BANNER_PAGE_SIZE = 10;

/**
 * Regex allowlist untuk tautan internal:
 * - /buku/[slug]
 * - /blog/[slug]
 * - /katalog
 * - /blog
 * - /tentang-kami
 * - /kontak
 */
export const INTERNAL_LINK_REGEX =
  /^\/(?:buku\/[a-z0-9-]+|blog\/[a-z0-9-]+|katalog|blog|tentang-kami|kontak)$/;

/**
 * Regex allowlist untuk tautan eksternal:
 * - Wajib menggunakan protokol HTTPS aman
 * - Menolak http://, javascript:, data:, vbscript:, protocol-relative //
 */
export const EXTERNAL_HTTPS_REGEX =
  /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/.*)?$/;

/**
 * Regex untuk mendeteksi tag HTML (memastikan teks pesan murni plain text)
 */
export const HTML_TAG_REGEX = /<[^>]*>/;

// ============================================================================
// 2. HELPER KONVERSI ZONA WAKTU (WIB <-> UTC)
// ============================================================================

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7

/**
 * Mengonversi tanggal (Date / string YYYY-MM-DD) dan jam (HH:mm) dalam WIB
 * ke string ISO UTC (timestamptz) untuk disimpan ke database.
 */
export function combineWibToUtc(
  dateInput: Date | string,
  timeStr: string = '00:00'
): string {
  let datePart: string;

  if (typeof dateInput === 'string') {
    datePart = dateInput.split('T')[0];
  } else {
    // Ambil tahun, bulan, hari dari objek Date
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    datePart = `${y}-${m}-${d}`;
  }

  // Normalisasi format waktu HH:mm
  const trimmedTime = timeStr.trim();
  const timePart = /^\d{2}:\d{2}$/.test(trimmedTime) ? `${trimmedTime}:00` : '00:00:00';

  // Format string ISO dengan offset +07:00
  const wibIsoString = `${datePart}T${timePart}+07:00`;
  const parsedDate = new Date(wibIsoString);

  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Format tanggal/jam WIB tidak valid: ${wibIsoString}`);
  }

  return parsedDate.toISOString();
}

/**
 * Memecah string timestamptz UTC dari database ke representasi WIB:
 * - date: Objek Date representasi kalender hari di WIB
 * - dateString: "YYYY-MM-DD"
 * - timeString: "HH:mm" (24 jam)
 * - formattedWib: format lengkap "DD MMMM YYYY, HH:mm WIB"
 */
export function splitUtcToWib(utcIso: string): {
  date: Date;
  dateString: string;
  timeString: string;
  formattedWib: string;
} {
  const utcDate = new Date(utcIso);
  if (isNaN(utcDate.getTime())) {
    throw new Error(`Format timestamptz UTC tidak valid: ${utcIso}`);
  }

  // Geser epoch dengan +7 jam untuk kalkulasi UTC-safe yang independen dari timezone server/browser
  const wibEpoch = utcDate.getTime() + WIB_OFFSET_MS;
  const shifted = new Date(wibEpoch);

  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  const hours = String(shifted.getUTCHours()).padStart(2, '0');
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0');

  const dateString = `${year}-${month}-${day}`;
  const timeString = `${hours}:${minutes}`;

  // Objek Date representasi kalender lokal
  const calendarDate = new Date(year, shifted.getUTCMonth(), shifted.getUTCDate());

  return {
    date: calendarDate,
    dateString,
    timeString,
    formattedWib: formatWibDateTime(utcDate),
  };
}

/**
 * Memformat tanggal UTC ke string berbahasa Indonesia dengan zona waktu WIB.
 * Contoh: "25 Okt 2026, 09:30 WIB"
 */
export function formatWibDateTime(dateInput: string | Date): string {
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  // Format tanggal dalam zona waktu Asia/Jakarta
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${formatter.format(dateObj)} WIB`;
}

// ============================================================================
// 3. SKEMA VALIDASI ZOD BANNER
// ============================================================================

/**
 * Validasi tautan link banner (harus internal terdaftar atau HTTPS eksternal).
 */
export const bannerLinkSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val === '') return true;
      return INTERNAL_LINK_REGEX.test(val) || EXTERNAL_HTTPS_REGEX.test(val);
    },
    {
      message:
        'Tautan harus berupa rute internal valid (mis. /buku/[slug], /blog/[slug], /katalog) atau URL eksternal dengan protokol https://',
    }
  );

/**
 * Skema validasi banner dasar
 */
export const bannerFormBaseSchema = z.object({
  message: z
    .string({ required_error: 'Pesan pengumuman promo wajib diisi' })
    .trim()
    .min(BANNER_MESSAGE_MIN_LENGTH, {
      message: `Pesan promo minimal ${BANNER_MESSAGE_MIN_LENGTH} karakter`,
    })
    .max(BANNER_MESSAGE_MAX_LENGTH, {
      message: `Pesan promo maksimal ${BANNER_MESSAGE_MAX_LENGTH} karakter`,
    })
    .refine((val) => !HTML_TAG_REGEX.test(val), {
      message: 'Pesan promo harus berupa teks polos tanpa tag HTML',
    }),

  link_url: bannerLinkSchema,

  starts_at: z
    .string({ required_error: 'Waktu mulai tayang wajib ditentukan' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format waktu mulai tayang tidak valid',
    }),

  ends_at: z
    .string({ required_error: 'Waktu selesai tayang wajib ditentukan' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format waktu selesai tayang tidak valid',
    }),

  is_active: z.boolean().default(true),
});

/**
 * Skema validasi formulir banner lengkap dengan validasi semantik: starts_at < ends_at
 */
export const bannerFormSchema = bannerFormBaseSchema.refine(
  (data) => {
    const start = new Date(data.starts_at).getTime();
    const end = new Date(data.ends_at).getTime();
    return start < end;
  },
  {
    message: 'Waktu selesai tayang harus lebih besar daripada waktu mulai tayang',
    path: ['ends_at'],
  }
);

export type BannerFormInput = z.input<typeof bannerFormSchema>;
export type BannerFormValues = z.output<typeof bannerFormSchema>;

/**
 * Skema parameter query URL untuk tabel banner admin
 */
export const bannerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .refine((val) => BANNER_PAGE_SIZE_OPTIONS.includes(val as (typeof BANNER_PAGE_SIZE_OPTIONS)[number]), {
      message: 'Ukuran halaman tidak didukung',
    })
    .default(DEFAULT_BANNER_PAGE_SIZE),
  search: z.string().trim().optional(),
  status: z.enum(['all', 'active_now', 'upcoming', 'expired', 'inactive']).default('all'),
});

export type BannerQueryParams = z.infer<typeof bannerQuerySchema>;
