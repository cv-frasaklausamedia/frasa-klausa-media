import { z } from 'zod';
import { SLUG_REGEX, generateSlug } from './category.ts';

export { SLUG_REGEX, generateSlug };
export { validateImageMagicBytes, type MagicBytesResult } from './profile.ts';

// ============================================================================
// 1. KONSTANTA DOMAIN BLOG
// ============================================================================

export const POST_STATUSES = ['draft', 'published'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_POST_PAGE_SIZE = 10;

export const MAX_BLOG_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (PRD §14.5)
export const ALLOWED_BLOG_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_POST_TAGS_COUNT = 10;
export const MAX_TAG_LENGTH = 30;
export const MIN_TAG_LENGTH = 2;

// ============================================================================
// 2. UTILITAS PERHITUNGAN WAKTU BACA (READ TIME)
// ============================================================================

/**
 * Menghitung estimasi waktu membaca artikel (read time) berdasarkan kepadatan kata.
 * Standar industri literasi: rata-rata 200 kata per menit (wpm).
 * Nilai minimum adalah 1 menit.
 */
export function calculateReadingTimeMinutes(htmlContent: string | null | undefined): number {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return 1;
  }

  // Bersihkan seluruh tag HTML dan decode entitas HTML dasar
  const plainText = htmlContent
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Hitung jumlah kata murni (token non-whitespace)
  const words = plainText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const wordCount = words.length;
  if (wordCount === 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Memformat angka waktu baca ke representasi teks berbahasa Indonesia
 */
export function formatReadingTime(minutes: number): string {
  const safeMinutes = Math.max(1, Math.floor(minutes || 1));
  return `${safeMinutes} menit baca`;
}

// ============================================================================
// 3. UTILITAS STORAGE & PATH PARSING
// ============================================================================

/**
 * Pola regex strict untuk path berkas di dalam bucket storage 'blog'.
 * - Wajib berada di subfolder 'covers' atau 'inline'
 * - Nama berkas WAJIB UUID v1-v5 murni (36 karakter)
 * - Ekstensi WAJIB jpg, png, atau webp
 * - Melarang path traversal (../) atau karakter tersembunyi
 */
export const BLOG_STORAGE_PATH_REGEX =
  /^(covers|inline)\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(jpg|png|webp)$/i;

/**
 * Mengekstrak path relatif storage bucket 'blog' dari URL publik Supabase.
 * Mengembalikan null jika URL bukan dari bucket 'blog' atau format path tidak valid.
 */
export function extractBlogStoragePath(
  urlStr: string | null | undefined,
  supabaseUrl?: string
): string | null {
  if (!urlStr || typeof urlStr !== 'string' || urlStr.trim() === '') {
    return null;
  }

  try {
    const parsed = new URL(urlStr.trim());

    if (supabaseUrl) {
      const expectedOrigin = new URL(supabaseUrl).origin;
      if (parsed.origin.toLowerCase() !== expectedOrigin.toLowerCase()) {
        return null;
      }
    }

    // Path pattern: /storage/v1/object/public/blog/(covers|inline)/<uuid>.(jpg|png|webp)
    const marker = '/storage/v1/object/public/blog/';
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    const relativePath = decodeURIComponent(
      parsed.pathname.slice(markerIndex + marker.length)
    );

    if (BLOG_STORAGE_PATH_REGEX.test(relativePath)) {
      return relativePath;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validasi ketat untuk daftar path berkas yang ingin dibersihkan (orphan cleanup).
 * Membatasi maksimal 20 path per request dan menolak path traversal.
 */
export function validateBlogCleanupPaths(paths: unknown): string[] | null {
  if (!Array.isArray(paths)) {
    return null;
  }

  if (paths.length > 20) {
    return null;
  }

  const validPaths: string[] = [];
  for (const item of paths) {
    if (typeof item !== 'string') return null;
    const trimmed = item.trim();

    if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('\0')) {
      return null;
    }

    if (!BLOG_STORAGE_PATH_REGEX.test(trimmed)) {
      return null;
    }

    validPaths.push(trimmed);
  }

  return [...new Set(validPaths)];
}

/**
 * Mengekstrak seluruh URL gambar inline dari konten HTML (`<img src="...">`)
 */
export function extractInlineImageUrls(html: string | null | undefined): string[] {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const urls: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1]) {
      urls.push(match[1]);
    }
  }

  return [...new Set(urls)];
}

// ============================================================================
// 4. SKEMA VALIDASI TAGS
// ============================================================================

export const tagItemSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(MIN_TAG_LENGTH, `Tag minimal ${MIN_TAG_LENGTH} karakter.`)
  .max(MAX_TAG_LENGTH, `Tag maksimal ${MAX_TAG_LENGTH} karakter.`)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Tag hanya boleh memuat huruf kecil, angka, dan tanda hubung pemisah.'
  );

export const tagsArraySchema = z
  .array(tagItemSchema)
  .max(MAX_POST_TAGS_COUNT, `Maksimal ${MAX_POST_TAGS_COUNT} tag per artikel.`)
  .default([])
  .transform((tags) => [...new Set(tags)]);

// ============================================================================
// 5. SKEMA FORM ARTIKEL BLOG (postFormSchema)
// ============================================================================

export const postFormSchema = z
  .object({
    title: z
      .string({ required_error: 'Judul artikel wajib diisi.' })
      .trim()
      .min(3, 'Judul artikel minimal 3 karakter.')
      .max(200, 'Judul artikel maksimal 200 karakter.'),

    slug: z
      .string({ required_error: 'Slug URL wajib diisi.' })
      .trim()
      .toLowerCase()
      .min(3, 'Slug minimal 3 karakter.')
      .max(200, 'Slug maksimal 200 karakter.')
      .regex(
        SLUG_REGEX,
        'Slug hanya boleh memuat huruf kecil, angka, dan tanda hubung pemisah (contoh: artikel-literasi-terbaru).'
      ),

    excerpt: z
      .string()
      .trim()
      .max(500, 'Ringkasan artikel maksimal 500 karakter.')
      .default(''),

    content: z
      .string({ required_error: 'Konten artikel wajib diisi.' })
      .trim()
      .min(10, 'Konten artikel minimal 10 karakter.'),

    cover_url: z
      .string()
      .trim()
      .url('URL sampul artikel tidak valid.')
      .nullable()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),

    category_id: z
      .string({ required_error: 'Kategori blog wajib dipilih.' })
      .uuid('ID Kategori blog tidak valid.'),

    tags: tagsArraySchema,

    author_name: z
      .string({ required_error: 'Nama penulis wajib diisi.' })
      .trim()
      .min(2, 'Nama penulis minimal 2 karakter.')
      .max(100, 'Nama penulis maksimal 100 karakter.'),

    status: z.enum(POST_STATUSES, {
      required_error: 'Status publikasi wajib dipilih.',
    }),

    published_at: z
      .string()
      .trim()
      .nullable()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val && val.trim() !== '' ? val.trim() : null))
      .refine(
        (val) => {
          if (!val) return true;
          const parsed = new Date(val);
          return !isNaN(parsed.getTime());
        },
        { message: 'Format tanggal publikasi tidak valid.' }
      ),

    seo_title: z
      .string()
      .trim()
      .max(100, 'Meta title SEO maksimal 100 karakter.')
      .nullable()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),

    seo_description: z
      .string()
      .trim()
      .max(200, 'Meta deskripsi SEO maksimal 200 karakter.')
      .nullable()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),
  })
  .superRefine((data, ctx) => {
    // Jika status published dan published_at diisi, pastikan nilainya valid
    if (data.status === 'published' && data.published_at) {
      const date = new Date(data.published_at);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['published_at'],
          message: 'Tanggal publikasi tidak valid untuk artikel terbit.',
        });
      }
    }
  });

export type PostFormInput = z.input<typeof postFormSchema>;
export type PostFormValues = z.output<typeof postFormSchema>;

// ============================================================================
// 6. SKEMA QUERY STRING DAFTAR ARTIKEL (URL State PRD §15.4)
// ============================================================================

export const postQuerySchema = z.object({
  page: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) || num < 1 ? 1 : Math.floor(num);
  }, z.number().int().positive().catch(1)),

  pageSize: z.preprocess((val) => {
    const num = Number(val);
    return POST_PAGE_SIZE_OPTIONS.includes(num as (typeof POST_PAGE_SIZE_OPTIONS)[number])
      ? num
      : DEFAULT_POST_PAGE_SIZE;
  }, z.number().int().catch(DEFAULT_POST_PAGE_SIZE)),

  q: z.preprocess((val) => {
    if (typeof val === 'string') return val.trim().slice(0, 100);
    return '';
  }, z.string().catch('')),

  category_id: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return val.trim();
    return 'all';
  }, z.string().catch('all')),

  status: z.preprocess((val) => {
    if (val === 'draft' || val === 'published' || val === 'scheduled') return val;
    return 'all';
  }, z.enum(['all', 'draft', 'published', 'scheduled']).catch('all')),

  sort: z.preprocess((val) => {
    const allowedSorts = [
      'created_at_desc',
      'created_at_asc',
      'published_at_desc',
      'published_at_asc',
      'title_asc',
      'title_desc',
    ];
    if (typeof val === 'string' && allowedSorts.includes(val)) return val;
    return 'created_at_desc';
  }, z.enum([
    'created_at_desc',
    'created_at_asc',
    'published_at_desc',
    'published_at_asc',
    'title_asc',
    'title_desc',
  ]).catch('created_at_desc')),
});

export type PostQueryParams = z.infer<typeof postQuerySchema>;

// ============================================================================
// 7. SKEMA QUERY STRING BLOG PUBLIK (PRD §6.3.5 & US-06)
// ============================================================================

export const PUBLIC_BLOG_PAGE_SIZE_OPTIONS = [6, 9, 12, 24] as const;
export const DEFAULT_PUBLIC_BLOG_PAGE_SIZE = 9;

export const publicBlogQuerySchema = z
  .object({
    page: z.preprocess((val) => {
      const num = Number(val);
      return isNaN(num) || num < 1 ? 1 : Math.floor(num);
    }, z.number().int().positive().catch(1)),

    pageSize: z.preprocess((val) => {
      const num = Number(val);
      return PUBLIC_BLOG_PAGE_SIZE_OPTIONS.includes(
        num as (typeof PUBLIC_BLOG_PAGE_SIZE_OPTIONS)[number]
      )
        ? num
        : DEFAULT_PUBLIC_BLOG_PAGE_SIZE;
    }, z.number().int().catch(DEFAULT_PUBLIC_BLOG_PAGE_SIZE)),

    q: z.preprocess((val) => {
      if (typeof val === 'string') return val.trim().slice(0, 100);
      return '';
    }, z.string().catch('')),

    kategori: z.preprocess((val) => {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed !== '' && trimmed.toLowerCase() !== 'all') {
          return trimmed;
        }
      }
      return undefined;
    }, z.string().optional()),

    category: z.preprocess((val) => {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed !== '' && trimmed.toLowerCase() !== 'all') {
          return trimmed;
        }
      }
      return undefined;
    }, z.string().optional()),

    sort: z.preprocess((val) => {
      const allowedSorts = [
        'published_at_desc',
        'published_at_asc',
        'title_asc',
        'title_desc',
      ];
      if (typeof val === 'string' && allowedSorts.includes(val)) return val;
      return 'published_at_desc';
    }, z.enum([
      'published_at_desc',
      'published_at_asc',
      'title_asc',
      'title_desc',
    ]).catch('published_at_desc')),
  })
  .transform((data) => ({
    ...data,
    kategori: data.kategori || data.category || undefined,
  }));

export type PublicBlogQueryParams = z.output<typeof publicBlogQuerySchema>;
