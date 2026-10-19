import { z } from 'zod';

// ============================================================================
// 1. KONSTANTA DOMAIN SITE CONTENT & STORAGE
// ============================================================================

export const SITE_CONTENT_KEYS = ['hero', 'about', 'contact', 'social'] as const;
export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[number];

export const MAX_SITE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (PRD §15.8)
export const ALLOWED_SITE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Regex allowlist rute internal publik
 */
export const INTERNAL_PATH_REGEX = /^\/[a-zA-Z0-9\-_/]*$/;

/**
 * Regex validasi tautan HTTPS eksternal
 */
export const HTTPS_URL_REGEX = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/.*)?$/;

/**
 * Regex validasi iframe src Google Maps Embed
 */
export const GOOGLE_MAPS_EMBED_REGEX =
  /^https:\/\/(?:www\.)?google\.com\/maps\/embed(?:\?.*)?$/;

// ============================================================================
// 2. SKEMA ZOD: HERO SECTION
// ============================================================================

export const heroContentSchema = z.object({
  badge: z
    .string()
    .trim()
    .max(100, { message: 'Badge maksimal 100 karakter' })
    .optional()
    .default(''),
  headline: z
    .string({ required_error: 'Headline wajib diisi' })
    .trim()
    .min(5, { message: 'Headline minimal 5 karakter' })
    .max(150, { message: 'Headline maksimal 150 karakter' }),
  subheadline: z
    .string({ required_error: 'Sub-headline wajib diisi' })
    .trim()
    .min(10, { message: 'Sub-headline minimal 10 karakter' })
    .max(500, { message: 'Sub-headline maksimal 500 karakter' }),
  primary_cta_label: z
    .string({ required_error: 'Label tombol CTA utama wajib diisi' })
    .trim()
    .min(2, { message: 'Label tombol minimal 2 karakter' })
    .max(50, { message: 'Label tombol maksimal 50 karakter' }),
  primary_cta_url: z
    .string({ required_error: 'Tautan tombol CTA utama wajib diisi' })
    .trim()
    .refine((val) => INTERNAL_PATH_REGEX.test(val) || HTTPS_URL_REGEX.test(val), {
      message: 'Tautan CTA utama harus berupa path internal (mis. /katalog) atau URL https://',
    }),
  secondary_cta_label: z
    .string()
    .trim()
    .max(50, { message: 'Label tombol sekunder maksimal 50 karakter' })
    .optional()
    .default(''),
  secondary_cta_url: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || val === '' || INTERNAL_PATH_REGEX.test(val) || HTTPS_URL_REGEX.test(val),
      {
        message: 'Tautan CTA sekunder harus berupa path internal (mis. /kontak) atau URL https://',
      }
    )
    .default(''),
  cover_image_url: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || val === '' || HTTPS_URL_REGEX.test(val), {
      message: 'URL gambar cover hero harus berupa tautan https:// yang valid',
    })
    .default(''),
});

export type HeroContentInput = z.input<typeof heroContentSchema>;
export type HeroContentValues = z.output<typeof heroContentSchema>;

// ============================================================================
// 3. SKEMA ZOD: TENTANG KAMI (ABOUT)
// ============================================================================

export const aboutValueItemSchema = z.object({
  name: z
    .string({ required_error: 'Nama nilai wajib diisi' })
    .trim()
    .min(2, { message: 'Nama nilai minimal 2 karakter' })
    .max(50, { message: 'Nama nilai maksimal 50 karakter' }),
  description: z
    .string({ required_error: 'Deskripsi nilai wajib diisi' })
    .trim()
    .min(5, { message: 'Deskripsi nilai minimal 5 karakter' })
    .max(250, { message: 'Deskripsi nilai maksimal 250 karakter' }),
});

export const aboutContentSchema = z.object({
  title: z
    .string({ required_error: 'Judul halaman Tentang Kami wajib diisi' })
    .trim()
    .min(3, { message: 'Judul minimal 3 karakter' })
    .max(100, { message: 'Judul maksimal 100 karakter' }),
  subtitle: z
    .string()
    .trim()
    .max(200, { message: 'Sub-judul maksimal 200 karakter' })
    .optional()
    .default(''),
  vision: z
    .string({ required_error: 'Visi penerbit wajib diisi' })
    .trim()
    .min(10, { message: 'Visi minimal 10 karakter' })
    .max(1000, { message: 'Visi maksimal 1.000 karakter' }),
  mission: z
    .array(
      z
        .string()
        .trim()
        .min(5, { message: 'Butir misi minimal 5 karakter' })
        .max(500, { message: 'Butir misi maksimal 500 karakter' }),
      { required_error: 'Misi penerbit wajib diisi minimal 1 butir' }
    )
    .min(1, { message: 'Misi wajib memiliki minimal 1 butir' })
    .max(10, { message: 'Misi maksimal 10 butir' }),
  history: z
    .string({ required_error: 'Sejarah / narasi penerbit wajib diisi' })
    .trim()
    .min(10, { message: 'Sejarah penerbit minimal 10 karakter' })
    .max(5000, { message: 'Sejarah penerbit maksimal 5.000 karakter' }),
  values: z
    .array(aboutValueItemSchema)
    .max(10, { message: 'Nilai-nilai maksimal 10 butir' })
    .optional()
    .default([]),
});

export type AboutContentInput = z.input<typeof aboutContentSchema>;
export type AboutContentValues = z.output<typeof aboutContentSchema>;

// ============================================================================
// 4. SKEMA ZOD: KONTAK & OPERASIONAL (CONTACT)
// ============================================================================

export const contactContentSchema = z.object({
  company_name: z
    .string({ required_error: 'Nama penerbit wajib diisi' })
    .trim()
    .min(2, { message: 'Nama penerbit minimal 2 karakter' })
    .max(100, { message: 'Nama penerbit maksimal 100 karakter' })
    .default('Frasa Klausa Media'),
  tagline: z
    .string()
    .trim()
    .max(200, { message: 'Tagline maksimal 200 karakter' })
    .optional()
    .default('Mewujudkan Naskah Menjadi Buku'),
  email: z
    .string({ required_error: 'Email resmi wajib diisi' })
    .trim()
    .email({ message: 'Format alamat email tidak valid' })
    .default('frasaklausamedia@gmail.com'),
  phone: z
    .string({ required_error: 'Nomor telepon wajib diisi' })
    .trim()
    .min(8, { message: 'Nomor telepon minimal 8 digit' })
    .max(20, { message: 'Nomor telepon maksimal 20 digit' })
    .default('0813-8060-4256'),
  whatsapp: z
    .string({ required_error: 'Nomor WhatsApp wajib diisi' })
    .trim()
    .min(8, { message: 'Nomor WhatsApp minimal 8 digit' })
    .max(20, { message: 'Nomor WhatsApp maksimal 20 digit' })
    .default('0813-8060-4256'),
  address: z
    .string({ required_error: 'Alamat kantor redaksi wajib diisi' })
    .trim()
    .min(5, { message: 'Alamat minimal 5 karakter' })
    .max(500, { message: 'Alamat maksimal 500 karakter' }),
  operating_hours: z
    .string()
    .trim()
    .max(150, { message: 'Jam operasional maksimal 150 karakter' })
    .optional()
    .default('Senin – Jumat: 09.00 – 17.00 WIB'),
  maps_embed_url: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || val === '' || GOOGLE_MAPS_EMBED_REGEX.test(val),
      {
        message: 'URL embed Google Maps harus diawali https://www.google.com/maps/embed atau https://google.com/maps/embed',
      }
    )
    .default(''),
});

export type ContactContentInput = z.input<typeof contactContentSchema>;
export type ContactContentValues = z.output<typeof contactContentSchema>;

// ============================================================================
// 5. SKEMA ZOD: MEDIA SOSIAL (SOCIAL)
// ============================================================================

const optionalHttpsUrl = z
  .string()
  .trim()
  .optional()
  .refine((val) => !val || val === '' || HTTPS_URL_REGEX.test(val), {
    message: 'Tautan harus berupa URL https:// yang valid',
  })
  .default('');

export const socialContentSchema = z.object({
  instagram: optionalHttpsUrl,
  facebook: optionalHttpsUrl,
  tiktok: optionalHttpsUrl,
  twitter: optionalHttpsUrl,
  shopee: optionalHttpsUrl,
  tokopedia: optionalHttpsUrl,
  youtube: optionalHttpsUrl,
});

export type SocialContentInput = z.input<typeof socialContentSchema>;
export type SocialContentValues = z.output<typeof socialContentSchema>;

// ============================================================================
// 6. VALIDATOR PEMBERSIHAN BERKAS STORAGE (ORPHAN PREVENTION)
// ============================================================================

export const siteStorageCleanupSchema = z
  .array(
    z
      .string()
      .trim()
      .refine(
        (val) => {
          if (val.includes('..') || val.startsWith('/') || val.includes('\\')) {
            return false;
          }
          return /^(?:hero\/[a-zA-Z0-9_\-./]+)$/.test(val);
        },
        {
          message: 'Path berkas storage site tidak valid atau di luar jangkauan yang diizinkan',
        }
      )
  )
  .max(10, { message: 'Maksimal 10 berkas yang dapat dibersihkan sekaligus' });

export function validateSiteCleanupPaths(paths: string[]): string[] {
  return siteStorageCleanupSchema.parse(paths);
}
