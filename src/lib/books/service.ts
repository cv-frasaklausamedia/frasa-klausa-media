import {
  bookFormSchema,
  extractBooksStoragePath,
  BOOKS_STORAGE_PATH_REGEX,
  validateImageMagicBytes,
  MAX_BOOK_IMAGE_SIZE_BYTES,
  type BookFormInput,
  type BookFormValues,
} from '../../validations/book.ts';
import {
  actionSuccess,
  actionError,
  AppError,
  type ActionResponse,
} from '../action-response.ts';
import type { BookMutationResult, BookDetail } from './types.ts';

// ============================================================================
// 1. ADAPTER INTERFACES (DEPENDENCY INJECTION)
// ============================================================================

export interface AuthUserContext {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface BookStorageAdapter {
  upload(
    path: string,
    buffer: Buffer | Uint8Array,
    contentType: string
  ): Promise<{ publicUrl: string }>;
  remove(paths: string[]): Promise<void>;
  getPublicUrl(path: string): string;
}

export interface BookDbAdapter {
  checkSlugConflict(slug: string, excludeId?: string): Promise<boolean>;
  upsertAtomic(
    bookId: string | null,
    data: BookFormValues
  ): Promise<BookMutationResult>;
  getBookById(id: string): Promise<BookDetail | null>;
  deleteBook(id: string): Promise<{
    id: string;
    coverUrl: string | null;
    galleryUrls: string[];
  }>;
  toggleField(
    id: string,
    field: 'is_published' | 'is_featured',
    value: boolean
  ): Promise<void>;
  isStoragePathInUse(path: string, excludeBookId?: string): Promise<boolean>;
}

export interface BookServiceDeps {
  auth: {
    requireAdmin: () => Promise<AuthUserContext>;
  };
  db: BookDbAdapter;
  storage: BookStorageAdapter;
  revalidate: (paths: string[]) => void;
  logger?: {
    error: (msg: string, ...args: unknown[]) => void;
    info: (msg: string, ...args: unknown[]) => void;
  };
  supabaseUrl?: string;
}

// ============================================================================
// 2. FUNGSI MURNI BANTUAN
// ============================================================================

/**
 * Menghitung selisih gambar yang sudah tidak digunakan lagi:
 * (cover lama + galeri lama) dikurangi (cover baru + galeri baru), DISTINCT.
 * Gambar yang dipindahkan antara cover dan galeri TIDAK ikut terhapus.
 */
export function calculateImageDifference(
  oldCover: string | null | undefined,
  oldGallery: string[],
  newCover: string | null | undefined,
  newGallery: string[]
): string[] {
  const oldSet = new Set<string>();
  if (oldCover && oldCover.trim().length > 0) oldSet.add(oldCover.trim());
  oldGallery.forEach((url) => {
    if (url && url.trim().length > 0) oldSet.add(url.trim());
  });

  const newSet = new Set<string>();
  if (newCover && newCover.trim().length > 0) newSet.add(newCover.trim());
  newGallery.forEach((url) => {
    if (url && url.trim().length > 0) newSet.add(url.trim());
  });

  const unused: string[] = [];
  oldSet.forEach((url) => {
    if (!newSet.has(url)) {
      unused.push(url);
    }
  });

  return unused;
}

/**
 * Parsing hasil RPC PostgREST secara defensif (menangani bentuk objek tunggal maupun array)
 */
export function parseRpcMutationResult(raw: unknown): BookMutationResult {
  if (!raw || typeof raw !== 'object') {
    throw new AppError('Hasil mutasi database tidak valid.', 'INTERNAL_SERVER_ERROR', 500);
  }

  const item = Array.isArray(raw) ? raw[0] : raw;
  if (!item || typeof item !== 'object' || !('book_id' in item)) {
    throw new AppError('Respons RPC tidak memuat book_id.', 'INTERNAL_SERVER_ERROR', 500);
  }

  const obj = item as { book_id: unknown; unused_image_urls?: unknown };
  const rawUrls = Array.isArray(obj.unused_image_urls) ? obj.unused_image_urls : [];

  return {
    book_id: String(obj.book_id),
    unused_image_urls: rawUrls.map(String).filter((u) => u.trim().length > 0),
  };
}

// ============================================================================
// 3. LOGIKA BISNIS & ORKESTRASI SERVER ACTION (MURNI & BER-DI)
// ============================================================================

/**
 * Orkestrasi: Membuat Buku Baru
 */
export async function executeCreateBook(
  rawInput: BookFormInput,
  deps: BookServiceDeps
): Promise<ActionResponse<{ id: string }>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    await deps.auth.requireAdmin();

    // 2. Validasi input via Zod
    const validated = bookFormSchema.parse(rawInput);

    // 3. Sanitasi deskripsi HTML
    const { sanitizeBookHtml } = await import('../sanitizer.ts');
    validated.description = sanitizeBookHtml(validated.description);

    // 4. Cek keunikan slug (409 Conflict)
    const isConflict = await deps.db.checkSlugConflict(validated.slug);
    if (isConflict) {
      return actionError(
        'Slug sudah digunakan oleh buku lain. Silakan gunakan slug yang berbeda.',
        'CONFLICT',
        409,
        { slug: ['Slug ini sudah terdaftar pada katalog buku.'] }
      );
    }

    // 5. Eksekusi RPC atomik
    const mutationResult = await deps.db.upsertAtomic(null, validated);

    // 6. Revalidasi cache
    deps.revalidate(['/admin/books', '/admin/book-categories']);

    return actionSuccess({ id: mutationResult.book_id });
  } catch (error) {
    throw error;
  }
}

/**
 * Orkestrasi: Memperbarui Buku yang Ada
 */
export async function executeUpdateBook(
  id: string,
  rawInput: BookFormInput,
  deps: BookServiceDeps
): Promise<ActionResponse<{ id: string }>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    await deps.auth.requireAdmin();

    if (!id || typeof id !== 'string') {
      throw new AppError('ID buku tidak valid.', 'BAD_REQUEST', 400);
    }

    // 2. Validasi input via Zod
    const validated = bookFormSchema.parse(rawInput);

    // 3. Sanitasi deskripsi HTML
    const { sanitizeBookHtml } = await import('../sanitizer.ts');
    validated.description = sanitizeBookHtml(validated.description);

    // 4. Cek keunikan slug selain dirinya sendiri
    const isConflict = await deps.db.checkSlugConflict(validated.slug, id);
    if (isConflict) {
      return actionError(
        'Slug sudah digunakan oleh buku lain. Silakan gunakan slug yang berbeda.',
        'CONFLICT',
        409,
        { slug: ['Slug ini sudah terdaftar pada buku lain.'] }
      );
    }

    // 5. Eksekusi RPC atomik
    const mutationResult = await deps.db.upsertAtomic(id, validated);

    // 6. Pembersihan berkas lama yang tidak lagi dipakai (SETELAH RPC SUKSES, BEST-EFFORT)
    if (mutationResult.unused_image_urls.length > 0) {
      await cleanupUnusedImagesSafely(mutationResult.unused_image_urls, id, deps);
    }

    // 7. Revalidasi cache
    deps.revalidate(['/admin/books', '/admin/book-categories']);

    return actionSuccess({ id: mutationResult.book_id });
  } catch (error) {
    throw error;
  }
}

/**
 * Orkestrasi: Menghapus Buku
 */
export async function executeDeleteBook(
  id: string,
  deps: BookServiceDeps
): Promise<ActionResponse<{ id: string }>> {
  // 1. Verifikasi otorisasi Admin di server
  await deps.auth.requireAdmin();

  if (!id || typeof id !== 'string') {
    throw new AppError('ID buku tidak valid.', 'BAD_REQUEST', 400);
  }

  // 2. Hapus record buku dari database dan ambil daftar URL gambarnya
  const deletedData = await deps.db.deleteBook(id);

  // 3. Bersihkan berkas cover dan galeri dari Storage (SETELAH DB HAPUS SUKSES, BEST-EFFORT)
  const urlsToClean: string[] = [];
  if (deletedData.coverUrl) urlsToClean.push(deletedData.coverUrl);
  deletedData.galleryUrls.forEach((u) => urlsToClean.push(u));

  if (urlsToClean.length > 0) {
    await cleanupUnusedImagesSafely(urlsToClean, id, deps);
  }

  // 4. Revalidasi cache
  deps.revalidate(['/admin/books', '/admin/book-categories']);

  return actionSuccess({ id: deletedData.id });
}

/**
 * Orkestrasi: Toggle Publish Buku
 */
export async function executeToggleBookPublished(
  id: string,
  isPublished: boolean,
  deps: BookServiceDeps
): Promise<ActionResponse<{ id: string; isPublished: boolean }>> {
  await deps.auth.requireAdmin();

  if (!id || typeof id !== 'string') {
    throw new AppError('ID buku tidak valid.', 'BAD_REQUEST', 400);
  }

  await deps.db.toggleField(id, 'is_published', Boolean(isPublished));
  deps.revalidate(['/admin/books']);

  return actionSuccess({ id, isPublished: Boolean(isPublished) });
}

/**
 * Orkestrasi: Toggle Featured Buku
 */
export async function executeToggleBookFeatured(
  id: string,
  isFeatured: boolean,
  deps: BookServiceDeps
): Promise<ActionResponse<{ id: string; isFeatured: boolean }>> {
  await deps.auth.requireAdmin();

  if (!id || typeof id !== 'string') {
    throw new AppError('ID buku tidak valid.', 'BAD_REQUEST', 400);
  }

  await deps.db.toggleField(id, 'is_featured', Boolean(isFeatured));
  deps.revalidate(['/admin/books']);

  return actionSuccess({ id, isFeatured: Boolean(isFeatured) });
}

/**
 * Orkestrasi: Unggah Gambar Cover atau Galeri
 */
export async function executeUploadBookImage(
  folder: 'covers' | 'gallery',
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  deps: BookServiceDeps
): Promise<ActionResponse<{ url: string; path: string }>> {
  await deps.auth.requireAdmin();

  if (!fileBuffer || fileBuffer.length === 0) {
    return actionError('Berkas gambar tidak boleh kosong.', 'VALIDATION_ERROR', 400);
  }

  if (fileBuffer.length > MAX_BOOK_IMAGE_SIZE_BYTES) {
    return actionError(
      'Ukuran berkas gambar melebihi batas maksimal 5 MB (PRD §14.5).',
      'BAD_REQUEST',
      400
    );
  }

  // Validasi konten biner nyata (magic bytes)
  const { isValid, canonicalMime, ext } = validateImageMagicBytes(fileBuffer);
  if (!isValid || !canonicalMime || !ext) {
    return actionError(
      'Format berkas tidak valid atau rusak. Hanya berkas JPEG, PNG, atau WebP asli yang diizinkan (PRD §15.8).',
      'BAD_REQUEST',
      400
    );
  }

  // Generate UUID acak murni (36 karakter)
  const fileUuid = crypto.randomUUID();
  const storagePath = `${folder}/${fileUuid}.${ext}`;

  try {
    const { publicUrl } = await deps.storage.upload(storagePath, fileBuffer, canonicalMime);
    return actionSuccess({ url: publicUrl, path: storagePath });
  } catch (error) {
    deps.logger?.error('Gagal mengunggah gambar buku ke storage:', error);
    return actionError(
      'Gagal mengunggah berkas ke media storage. Silakan coba kembali.',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
}

// ============================================================================
// 4. UTILITAS INTERNAL PEMBERSIHAN GAMBAR LAMA
// ============================================================================

/**
 * Membersihkan URL gambar lama dengan aman:
 * 1. Mengekstrak path storage resmi
 * 2. Memverifikasi bahwa path tersebut TIDAK sedang dipakai buku lain
 * 3. Menghapus secara best-effort dari Storage bucket
 */
async function cleanupUnusedImagesSafely(
  urls: string[],
  currentBookId: string,
  deps: BookServiceDeps
): Promise<void> {
  const pathsToDelete: string[] = [];

  for (const url of urls) {
    let path = extractBooksStoragePath(url, deps.supabaseUrl);
    if (!path && typeof url === 'string' && BOOKS_STORAGE_PATH_REGEX.test(url.trim())) {
      path = url.trim();
    }
    if (!path) continue;

    try {
      const isInUse = await deps.db.isStoragePathInUse(path, currentBookId);
      if (!isInUse) {
        pathsToDelete.push(path);
      }
    } catch {
      // Jika pengecekan in-use gagal, amankan dengan tidak menghapus
    }
  }

  if (pathsToDelete.length > 0) {
    try {
      await deps.storage.remove(pathsToDelete);
    } catch (removeErr) {
      deps.logger?.error('[cleanupUnusedImagesSafely] Gagal menghapus berkas yatim:', removeErr);
    }
  }
}
