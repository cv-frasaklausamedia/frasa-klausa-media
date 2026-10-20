import { z } from 'zod';
import { SLUG_REGEX, generateSlug } from './category.ts';

export { SLUG_REGEX, generateSlug };

// ============================================================================
// 1. UTILITAS ISBN-10 & ISBN-13 DENGAN CHECKSUM MATEMATIKA
// ============================================================================

/**
 * Menormalisasi string ISBN dengan menghapus tanda hubung dan spasi, serta mengubah ke huruf besar.
 */
export function normalizeIsbn(isbn: string | null | undefined): string {
  if (!isbn) return '';
  return isbn.replace(/[-\s]/g, '').toUpperCase().trim();
}

/**
 * Validasi ISBN-10 matematis (modulus 11).
 * Karakter terakhir (digit ke-10) dapat berupa 'X' yang merepresentasikan nilai 10.
 * Rumus: (d1*10 + d2*9 + d3*8 + ... + d10*1) % 11 === 0
 */
export function isValidIsbn10(isbn: string): boolean {
  const clean = normalizeIsbn(isbn);
  if (!/^\d{9}[\dX]$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i]!, 10) * (10 - i);
  }
  const lastChar = clean[9]!;
  const checkDigit = lastChar === 'X' ? 10 : parseInt(lastChar, 10);
  sum += checkDigit * 1;

  return sum % 11 === 0;
}

/**
 * Validasi ISBN-13 matematis (modulus 10).
 * Rumus: (d1*1 + d2*3 + d3*1 + d4*3 + ... + d13*1) % 10 === 0
 */
export function isValidIsbn13(isbn: string): boolean {
  const clean = normalizeIsbn(isbn);
  if (!/^\d{13}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(clean[i]!, 10);
    sum += i % 2 === 0 ? digit * 1 : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(clean[12]!, 10);
}

/**
 * Memvalidasi apakah string merupakan ISBN-10 atau ISBN-13 yang valid.
 * Nilai kosong/null dianggap valid (karena ISBN bersifat opsional).
 */
export function isValidIsbn(isbn: string | null | undefined): boolean {
  if (!isbn || isbn.trim() === '') return true;
  const clean = normalizeIsbn(isbn);
  if (clean.length === 10) return isValidIsbn10(clean);
  if (clean.length === 13) return isValidIsbn13(clean);
  return false;
}

// ============================================================================
// 2. UTILITAS WHATSAPP & FORMAT PESAN
// ============================================================================

export const DEFAULT_WA_NUMBER = '6281380604256';
export const DEFAULT_WA_TEMPLATE =
  'Halo Frasa Klausa Media, saya ingin memesan buku "{judul}"\ndengan alamat url: {url} seharga {harga}. Apakah stok masih tersedia?';

/**
 * Regex nomor telepon WhatsApp internasional format Indonesia:
 * Diawali 628, digit berikutnya 1-9, diikuti 7 sampai 11 digit angka (total 11-15 digit).
 */
export const WA_PHONE_REGEX = /^628[1-9][0-9]{7,11}$/;

/**
 * Normalisasi nomor WhatsApp ke standar internasional:
 * - Menghapus semua karakter non-angka (spasi, tanda hubung, plus, dll.)
 * - 0813... -> 62813...
 * - +62...  -> 62...
 * - 813...  -> 62813...
 * - Kosong / tidak valid -> default: DEFAULT_WA_NUMBER
 */
export function normalizeWhatsAppNumber(phone: string | null | undefined): string {
  if (!phone) return DEFAULT_WA_NUMBER;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return DEFAULT_WA_NUMBER;

  if (digits.startsWith('08')) {
    digits = '628' + digits.slice(2);
  } else if (digits.startsWith('8')) {
    digits = '628' + digits.slice(1);
  }

  return WA_PHONE_REGEX.test(digits) ? digits : DEFAULT_WA_NUMBER;
}

/**
 * Memformat nominal harga ke format mata uang Rupiah (IDR).
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Fungsi murni menyusun teks pesan pemesanan WhatsApp berdasarkan template, judul, harga, dan url halaman buku.
 * Placeholder {judul}, {harga}, dan {url} bersifat opsional dan diganti secara dinamis.
 */
export function formatWhatsAppMessage(
  template: string | null | undefined,
  title: string,
  price: number,
  url?: string | null
): string {
  let activeTemplate =
    template && template.trim().length > 0 ? template.trim() : DEFAULT_WA_TEMPLATE;

  const formattedPrice = formatRupiah(price);
  const resolvedUrl = url?.trim() || '';

  // Dukungan backward-compatibility: Jika URL diberikan namun template lama di DB belum memiliki placeholder {url}
  if (resolvedUrl && !activeTemplate.includes('{url}') && !activeTemplate.includes(resolvedUrl)) {
    if (activeTemplate.includes('seharga')) {
      activeTemplate = activeTemplate.replace(/seharga/i, `\ndengan alamat url: {url} seharga`);
    } else {
      activeTemplate = `${activeTemplate}\ndengan alamat url: {url}`;
    }
  }

  return activeTemplate
    .replace(/\{judul\}/gi, title || '[Judul Buku]')
    .replace(/\{harga\}/gi, formattedPrice)
    .replace(/\{url\}/gi, resolvedUrl);
}

/**
 * Fungsi murni menyusun URL klik pesan WhatsApp (wa.me) yang aman dengan encodeURIComponent.
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  template: string | null | undefined,
  title: string,
  price: number,
  url?: string | null
): string {
  const normalizedNumber = normalizeWhatsAppNumber(phone);
  const message = formatWhatsAppMessage(template, title, price, url);
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}

// ============================================================================
// 3. ALLOWLIST MARKETPLACE RESMI (SHOPEE & TOKOPEDIA)
// ============================================================================

export const SHOPEE_ALLOWED_DOMAINS = [
  'shopee.co.id',
  'shope.ee',
  'shp.ee',
] as const;

export const TOKOPEDIA_ALLOWED_DOMAINS = [
  'tokopedia.com',
  'tokopedia.link',
  'tkp.me',
] as const;

/**
 * Memeriksa apakah hostname URL cocok persis atau berakhiran `.` + domain resmi
 * (mencegah domain tiruan seperti evilshopee.co.id atau shopee.co.id.evil.com).
 */
function isHostInAllowlist(host: string, allowedDomains: readonly string[]): boolean {
  const normalizedHost = host.toLowerCase();
  return allowedDomains.some((domain) => {
    return normalizedHost === domain || normalizedHost.endsWith('.' + domain);
  });
}

/**
 * Validasi URL Shopee resmi (wajib HTTPS dan mematuhi allowlist domain).
 */
export function isValidShopeeUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr || urlStr.trim() === '') return true;
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== 'https:') return false;
    return isHostInAllowlist(parsed.hostname, SHOPEE_ALLOWED_DOMAINS);
  } catch {
    return false;
  }
}

/**
 * Validasi URL Tokopedia resmi (wajib HTTPS dan mematuhi allowlist domain).
 */
export function isValidTokopediaUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr || urlStr.trim() === '') return true;
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== 'https:') return false;
    return isHostInAllowlist(parsed.hostname, TOKOPEDIA_ALLOWED_DOMAINS);
  } catch {
    return false;
  }
}

// ============================================================================
// 4. UTILITAS STORAGE BUCKET & PATH VALIDATION
// ============================================================================

export { validateImageMagicBytes, type MagicBytesResult } from './profile.ts';
export const MAX_BOOK_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (PRD §14.5)
export const ALLOWED_BOOK_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Pola regex strict untuk path berkas di dalam bucket storage 'books'.
 * - Wajib berada di folder 'covers' atau 'gallery'
 * - Nama berkas WAJIB UUID v1-v5 murni (36 karakter)
 * - Ekstensi WAJIB jpg, png, atau webp
 * - Melarang keras path traversal (../) atau karakter tersembunyi
 */
export const BOOKS_STORAGE_PATH_REGEX =
  /^(covers|gallery)\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(jpg|png|webp)$/i;

/**
 * Fungsi murni untuk mengekstrak dan memverifikasi path berkas storage dari URL.
 * Hanya menerima URL berformat:
 * {supabaseUrl}/storage/v1/object/public/books/(covers|gallery)/<uuid>.(jpg|png|webp)
 * Mengembalikan path relatif (e.g. 'covers/<uuid>.jpg' atau 'gallery/<uuid>.webp').
 * Mengembalikan null untuk URL tidak valid, bucket lain, host eksternal, atau nama berkas tidak aman.
 */
export function extractBooksStoragePath(
  urlStr: string | null | undefined,
  supabaseUrl?: string
): string | null {
  if (!urlStr || typeof urlStr !== 'string' || urlStr.trim() === '') {
    return null;
  }

  try {
    const parsed = new URL(urlStr.trim());

    // 1. Jika supabaseUrl diberikan, pastikan origin cocok persis
    if (supabaseUrl) {
      const expectedOrigin = new URL(supabaseUrl).origin;
      if (parsed.origin.toLowerCase() !== expectedOrigin.toLowerCase()) {
        return null;
      }
    }

    // 2. Cegah path traversal
    if (parsed.pathname.includes('..') || parsed.pathname.includes('%2e')) {
      return null;
    }

    // 3. Ekstrak bagian setelah prefix public bucket 'books'
    const prefix = '/storage/v1/object/public/books/';
    if (!parsed.pathname.startsWith(prefix)) {
      return null;
    }

    const relativePath = parsed.pathname.slice(prefix.length);

    // 4. Validasi strict terhadap folder, UUID, dan ekstensi
    if (!BOOKS_STORAGE_PATH_REGEX.test(relativePath)) {
      return null;
    }

    return relativePath;
  } catch {
    return null;
  }
}

/**
 * Validasi defensif untuk daftar path berkas yang akan dibersihkan dari Storage (cleanup).
 * Memastikan:
 * - Input adalah array dengan panjang antara 1 dan 20.
 * - Setiap path memenuhi BOOKS_STORAGE_PATH_REGEX (folder covers/gallery, nama UUID, ekstensi jpg/png/webp).
 * - Tidak mengandung path traversal ('..' atau '%2e').
 * Mengembalikan array path yang sah dan bersih, atau null jika input tidak valid / melebihi batas.
 */
export function validateCleanupPaths(paths: unknown): string[] | null {
  if (!paths || !Array.isArray(paths)) {
    return null;
  }

  if (paths.length > 20) {
    return null;
  }

  const safePaths: string[] = [];
  for (const p of paths) {
    if (typeof p !== 'string') continue;
    const cleanPath = p.trim().replace(/^\/+/, '');
    if (
      !cleanPath.includes('..') &&
      !cleanPath.includes('%2e') &&
      BOOKS_STORAGE_PATH_REGEX.test(cleanPath)
    ) {
      safePaths.push(cleanPath);
    }
  }

  return safePaths;
}

// ============================================================================
// 5. SKEMA VALIDASI FORM BUKU (ZOD 3)
// ============================================================================

export const bookGalleryItemSchema = z.object({
  id: z.string().uuid().optional(),
  image_url: z
    .string({ required_error: 'URL gambar galeri wajib diisi' })
    .url('URL gambar galeri tidak valid')
    .refine(
      (val) => extractBooksStoragePath(val) !== null,
      'URL galeri harus berupa tautan storage resmi bucket books (folder gallery/<uuid>.(jpg|png|webp))'
    ),
  alt_text: z
    .string({ required_error: 'Teks alternatif (alt text) wajib diisi' })
    .trim()
    .min(1, 'Teks alternatif (alt text) wajib diisi untuk setiap gambar galeri')
    .max(200, 'Teks alternatif maksimal 200 karakter'),
  sort_order: z.number().int().min(0).default(0),
});

export type BookGalleryItem = z.infer<typeof bookGalleryItemSchema>;

const currentYear = new Date().getFullYear();

/**
 * Skema dasar form Buku (sebelum refinement).
 */
const baseBookFormSchema = z.object({
  title: z
    .string({ required_error: 'Judul buku wajib diisi' })
    .trim()
    .min(1, 'Judul buku wajib diisi')
    .max(200, 'Judul buku maksimal 200 karakter'),

  slug: z
    .string({ required_error: 'Slug URL buku wajib diisi' })
    .trim()
    .min(2, 'Slug minimal 2 karakter')
    .max(150, 'Slug maksimal 150 karakter')
    .regex(
      SLUG_REGEX,
      'Format slug tidak valid (gunakan huruf kecil, angka, dan tanda hubung tanpa spasi)'
    ),

  category_id: z
    .string({ required_error: 'Kategori buku wajib dipilih' })
    .uuid('ID kategori buku tidak valid'),

  author: z
    .string({ required_error: 'Nama penulis wajib diisi' })
    .trim()
    .min(1, 'Nama penulis wajib diisi')
    .max(150, 'Nama penulis maksimal 150 karakter'),

  editor: z
    .string()
    .trim()
    .max(150, 'Nama editor maksimal 150 karakter')
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),

  publisher: z
    .string({ required_error: 'Nama penerbit wajib diisi' })
    .trim()
    .min(1, 'Nama penerbit wajib diisi')
    .max(150, 'Nama penerbit maksimal 150 karakter')
    .default('Frasa Klausa Media'),

  publish_year: z.coerce
    .number({ required_error: 'Tahun terbit wajib diisi' })
    .int('Tahun terbit harus berupa bilangan bulat')
    .min(1900, 'Tahun terbit minimal tahun 1900')
    .max(currentYear + 1, `Tahun terbit maksimal tahun ${currentYear + 1}`),

  isbn: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? normalizeIsbn(val) : null))
    .refine(
      (val) => isValidIsbn(val),
      'Nomor ISBN tidak valid (harus memenuhi format dan digit checksum ISBN-10 atau ISBN-13)'
    ),

  page_count: z.coerce
    .number({ required_error: 'Jumlah halaman wajib diisi' })
    .int('Jumlah halaman harus berupa bilangan bulat')
    .positive('Jumlah halaman harus lebih dari 0'),

  price_regular: z.coerce
    .number({ required_error: 'Harga normal wajib diisi' })
    .min(0, 'Harga normal tidak boleh negatif'),

  price_promo: z
    .preprocess((val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return Number.isFinite(num) ? num : null;
    }, z.number().min(0, 'Harga promo tidak boleh negatif').nullable().optional())
    .default(null),

  description: z
    .string()
    .max(20000, 'Deskripsi buku maksimal 20.000 karakter')
    .default(''),

  cover_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null))
    .refine(
      (val) => val === null || extractBooksStoragePath(val) !== null,
      'URL cover harus berupa tautan storage resmi bucket books (folder covers/<uuid>.(jpg|png|webp))'
    ),

  gallery: z
    .array(bookGalleryItemSchema)
    .max(10, 'Maksimal 10 foto galeri buku')
    .default([]),

  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),

  shopee_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null))
    .refine(
      (val) => isValidShopeeUrl(val),
      'URL Shopee harus berupa tautan resmi Shopee (HTTPS, domain shopee.co.id / shope.ee / shp.ee)'
    ),

  tokopedia_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null))
    .refine(
      (val) => isValidTokopediaUrl(val),
      'URL Tokopedia harus berupa tautan resmi Tokopedia (HTTPS, domain tokopedia.com / tokopedia.link / tkp.me)'
    ),

  whatsapp_number: z
    .string()
    .trim()
    .optional()
    .default(DEFAULT_WA_NUMBER)
    .transform((val) => normalizeWhatsAppNumber(val)),

  whatsapp_message_template: z
    .string()
    .trim()
    .max(500, 'Template pesan WhatsApp maksimal 500 karakter')
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

  related_book_ids: z
    .array(z.string().uuid('ID buku terkait harus berupa UUID'))
    .max(5, 'Maksimal 5 buku terkait yang dapat dipilih')
    .default([]),
});

/**
 * Skema Buku lengkap dengan validasi semantik harga promo < harga reguler.
 */
export const bookFormSchema = baseBookFormSchema.refine(
  (data) => {
    if (data.price_promo === null || data.price_promo === undefined) {
      return true;
    }
    return data.price_promo < data.price_regular;
  },
  {
    message: 'Harga promo harus lebih kecil dari harga normal',
    path: ['price_promo'],
  }
);

/**
 * Tipe input mentah form (digunakan oleh react-hook-form / ZodResolver).
 */
export type BookFormInput = z.input<typeof bookFormSchema>;

/**
 * Tipe data bersih yang sudah divalidasi dan ditransformasi.
 */
export type BookFormValues = z.output<typeof bookFormSchema>;

// ============================================================================
// 5. SKEMA URL QUERY PARAMETER TABEL BUKU
// ============================================================================

export const BOOK_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type BookPageSize = (typeof BOOK_PAGE_SIZE_OPTIONS)[number];

export const BOOK_SORT_OPTIONS = [
  'created_at_desc',
  'created_at_asc',
  'title_asc',
  'title_desc',
  'price_asc',
  'price_desc',
  'year_desc',
  'year_asc',
] as const;
export type BookSortOption = (typeof BOOK_SORT_OPTIONS)[number];

export const BOOK_STATUS_FILTER_OPTIONS = ['all', 'published', 'draft'] as const;
export type BookStatusFilter = (typeof BOOK_STATUS_FILTER_OPTIONS)[number];

const rawBookQuerySchema = z.object({
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
        return BOOK_PAGE_SIZE_OPTIONS.includes(parsed as BookPageSize) ? parsed : 10;
      }
      if (typeof val === 'number') {
        return BOOK_PAGE_SIZE_OPTIONS.includes(val as BookPageSize) ? val : 10;
      }
      return 10;
    }, z.number())
    .catch(10)
    .default(10),

  q: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.slice(0, 100);
      return '';
    }, z.string())
    .catch('')
    .default(''),

  category_id: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim().length > 0) return val.trim();
      return 'all';
    }, z.string())
    .catch('all')
    .default('all'),

  // Alias kompatibilitas backwards
  categoryId: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim().length > 0) return val.trim();
      return 'all';
    }, z.string())
    .catch('all')
    .default('all'),

  status: z
    .preprocess((val) => {
      if (typeof val === 'string' && BOOK_STATUS_FILTER_OPTIONS.includes(val as BookStatusFilter)) {
        return val as BookStatusFilter;
      }
      return 'all';
    }, z.enum(BOOK_STATUS_FILTER_OPTIONS))
    .catch('all')
    .default('all'),

  sort: z
    .preprocess((val) => {
      if (typeof val === 'string' && BOOK_SORT_OPTIONS.includes(val as BookSortOption)) {
        return val as BookSortOption;
      }
      return 'created_at_desc';
    }, z.enum(BOOK_SORT_OPTIONS))
    .catch('created_at_desc')
    .default('created_at_desc'),
});

export const bookQuerySchema = z.preprocess((input) => {
  if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>;
    const effectiveCategory =
      (typeof raw.category_id === 'string' && raw.category_id.trim() !== ''
        ? raw.category_id
        : typeof raw.categoryId === 'string' && raw.categoryId.trim() !== ''
        ? raw.categoryId
        : 'all');

    const effectivePageSize = raw.pageSize ?? raw.limit ?? 10;

    return {
      ...raw,
      category_id: effectiveCategory,
      categoryId: effectiveCategory,
      pageSize: effectivePageSize,
    };
  }
  return input;
}, rawBookQuerySchema);

export type BookQueryParams = z.infer<typeof bookQuerySchema>;

// ============================================================================
// 6. SKEMA URL QUERY PARAMETER KATALOG PUBLIK (PRD §6.3.3 & §10.2)
// ============================================================================

export const PUBLIC_CATALOG_PAGE_SIZES = [12, 24, 36] as const;
export type PublicCatalogPageSize = (typeof PUBLIC_CATALOG_PAGE_SIZES)[number];

export const PUBLIC_CATALOG_SORT_OPTIONS = [
  'created_at_desc',
  'created_at_asc',
  'title_asc',
  'title_desc',
  'price_asc',
  'price_desc',
  'year_desc',
  'year_asc',
] as const;
export type PublicCatalogSortOption = (typeof PUBLIC_CATALOG_SORT_OPTIONS)[number];

const rawPublicCatalogQuerySchema = z.object({
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
        return PUBLIC_CATALOG_PAGE_SIZES.includes(parsed as PublicCatalogPageSize) ? parsed : 12;
      }
      if (typeof val === 'number') {
        return PUBLIC_CATALOG_PAGE_SIZES.includes(val as PublicCatalogPageSize) ? val : 12;
      }
      return 12;
    }, z.number())
    .catch(12)
    .default(12),

  q: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.slice(0, 100).trim();
      return '';
    }, z.string())
    .catch('')
    .default(''),

  kategori: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim().length > 0) return val.trim();
      return undefined;
    }, z.string().optional())
    .catch(undefined),

  minPrice: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val.replace(/\D/g, ''), 10);
        return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 100_000_000) : undefined;
      }
      if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
        return Math.min(Math.floor(val), 100_000_000);
      }
      return undefined;
    }, z.number().min(0).max(100_000_000).optional())
    .catch(undefined),

  maxPrice: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val.replace(/\D/g, ''), 10);
        return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 100_000_000) : undefined;
      }
      if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
        return Math.min(Math.floor(val), 100_000_000);
      }
      return undefined;
    }, z.number().min(0).max(100_000_000).optional())
    .catch(undefined),

  sort: z
    .preprocess((val) => {
      if (typeof val === 'string' && PUBLIC_CATALOG_SORT_OPTIONS.includes(val as PublicCatalogSortOption)) {
        return val as PublicCatalogSortOption;
      }
      return 'created_at_desc';
    }, z.enum(PUBLIC_CATALOG_SORT_OPTIONS))
    .catch('created_at_desc')
    .default('created_at_desc'),
});

export const publicCatalogQuerySchema = z.preprocess((input) => {
  if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>;
    const effectiveCategory =
      typeof raw.kategori === 'string' && raw.kategori.trim() !== ''
        ? raw.kategori.trim()
        : typeof raw.category === 'string' && raw.category.trim() !== ''
        ? raw.category.trim()
        : undefined;

    return {
      ...raw,
      kategori: effectiveCategory,
    };
  }
  return input;
}, rawPublicCatalogQuerySchema);

export type PublicCatalogQueryParams = z.infer<typeof publicCatalogQuerySchema>;

