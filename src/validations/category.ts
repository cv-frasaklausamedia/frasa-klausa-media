import { z } from 'zod';

/**
 * Regex standar untuk slug URL ramah SEO.
 * Hanya mengizinkan huruf kecil, angka, dan tanda hubung pemisah tunggal.
 * Tidak boleh diawali atau diakhiri tanda hubung.
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Utilitas untuk menghasilkan slug URL yang bersih, aman, dan dinormalisasi dari teks input.
 * - Melakukan dekomposisi NFD untuk menghapus aksen/diakritik (misal: "Kafé" -> "kafe").
 * - Mengubah semua huruf ke huruf kecil.
 * - Menghapus karakter khusus dan simbol.
 * - Mengganti spasi atau garis bawah berulang menjadi satu tanda hubung.
 * - Memangkas tanda hubung di awal dan akhir teks.
 */
export function generateSlug(text: string): string {
  if (!text) return '';

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * Skema validasi form Kategori Buku (digunakan bersama oleh Client Component & Server Action).
 */
export const categoryFormSchema = z.object({
  name: z
    .string({ required_error: 'Nama kategori wajib diisi' })
    .trim()
    .min(2, 'Nama kategori minimal 2 karakter')
    .max(100, 'Nama kategori maksimal 100 karakter'),
  slug: z
    .string({ required_error: 'Slug kategori wajib diisi' })
    .trim()
    .min(2, 'Slug minimal 2 karakter')
    .max(100, 'Slug maksimal 100 karakter')
    .regex(
      SLUG_REGEX,
      'Format slug tidak valid (gunakan huruf kecil, angka, dan pemisah tanda hubung tanpa spasi)'
    ),
  description: z
    .string()
    .trim()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  seo_title: z
    .string()
    .trim()
    .max(70, 'Judul SEO maksimal 70 karakter')
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  seo_description: z
    .string()
    .trim()
    .max(160, 'Deskripsi SEO maksimal 160 karakter')
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

/**
 * Daftar opsi batas baris per halaman yang diizinkan (PRD §10.8).
 */
export const CATEGORY_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type CategoryPageSize = (typeof CATEGORY_PAGE_SIZE_OPTIONS)[number];

/**
 * Allowlist opsi pengurutan tabel kategori.
 */
export const CATEGORY_SORT_OPTIONS = [
  'created_at_desc',
  'created_at_asc',
  'name_asc',
  'name_desc',
  'books_desc',
  'books_asc',
] as const;
export type CategorySortOption = (typeof CATEGORY_SORT_OPTIONS)[number];

/**
 * Skema validasi defensif untuk URL Query Parameters tabel kategori.
 * Dilengkapi fallback .catch() agar manipulasi parameter URL ilegal tidak merusak halaman (PRD §15.4).
 */
export const categoryQuerySchema = z.object({
  page: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
      }
      if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
        return Math.floor(val);
      }
      return 1;
    }, z.number().int().positive())
    .catch(1)
    .default(1),

  pageSize: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return CATEGORY_PAGE_SIZE_OPTIONS.includes(parsed as CategoryPageSize)
          ? parsed
          : 10;
      }
      if (typeof val === 'number') {
        return CATEGORY_PAGE_SIZE_OPTIONS.includes(val as CategoryPageSize)
          ? val
          : 10;
      }
      return 10;
    }, z.number().int())
    .catch(10)
    .default(10),

  q: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        return val.trim().slice(0, 100);
      }
      return '';
    }, z.string())
    .catch('')
    .default(''),

  sort: z
    .preprocess((val) => {
      if (typeof val === 'string' && CATEGORY_SORT_OPTIONS.includes(val as CategorySortOption)) {
        return val;
      }
      return 'created_at_desc';
    }, z.enum(CATEGORY_SORT_OPTIONS))
    .catch('created_at_desc')
    .default('created_at_desc'),
});

export type CategoryQueryParams = z.infer<typeof categoryQuerySchema>;
