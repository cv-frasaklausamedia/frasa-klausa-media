import { z } from 'zod';
import { SLUG_REGEX, generateSlug } from './category.ts';

export { SLUG_REGEX, generateSlug };

/**
 * Skema validasi form Kategori Blog (digunakan bersama oleh Client Component & Server Action).
 */
export const blogCategoryFormSchema = z.object({
  name: z
    .string({ required_error: 'Nama kategori blog wajib diisi' })
    .trim()
    .min(2, 'Nama kategori blog minimal 2 karakter')
    .max(100, 'Nama kategori blog maksimal 100 karakter'),
  slug: z
    .string({ required_error: 'Slug kategori blog wajib diisi' })
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

export type BlogCategoryFormInput = z.infer<typeof blogCategoryFormSchema>;

/**
 * Daftar opsi batas baris per halaman yang diizinkan (PRD §10.8).
 */
export const BLOG_CATEGORY_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type BlogCategoryPageSize = (typeof BLOG_CATEGORY_PAGE_SIZE_OPTIONS)[number];

/**
 * Allowlist opsi pengurutan tabel kategori blog.
 */
export const BLOG_CATEGORY_SORT_OPTIONS = [
  'created_at_desc',
  'created_at_asc',
  'name_asc',
  'name_desc',
  'posts_desc',
  'posts_asc',
] as const;
export type BlogCategorySortOption = (typeof BLOG_CATEGORY_SORT_OPTIONS)[number];

/**
 * Skema validasi defensif untuk URL Query Parameters tabel kategori blog.
 * Dilengkapi fallback .catch() agar manipulasi parameter URL ilegal tidak merusak halaman (PRD §15.4).
 */
export const blogCategoryQuerySchema = z.object({
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
        return BLOG_CATEGORY_PAGE_SIZE_OPTIONS.includes(parsed as BlogCategoryPageSize)
          ? parsed
          : 10;
      }
      if (typeof val === 'number') {
        return BLOG_CATEGORY_PAGE_SIZE_OPTIONS.includes(val as BlogCategoryPageSize)
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
      if (typeof val === 'string' && BLOG_CATEGORY_SORT_OPTIONS.includes(val as BlogCategorySortOption)) {
        return val;
      }
      return 'created_at_desc';
    }, z.enum(BLOG_CATEGORY_SORT_OPTIONS))
    .catch('created_at_desc')
    .default('created_at_desc'),
});

export type BlogCategoryQueryParams = z.infer<typeof blogCategoryQuerySchema>;
