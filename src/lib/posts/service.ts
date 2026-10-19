import {
  postFormSchema,
  extractBlogStoragePath,
  BLOG_STORAGE_PATH_REGEX,
  extractInlineImageUrls,
  calculateReadingTimeMinutes,
  validateImageMagicBytes,
  MAX_BLOG_IMAGE_SIZE_BYTES,
  type PostFormInput,
  type PostFormValues,
  type PostStatus,
} from '../../validations/post.ts';
import {
  actionSuccess,
  actionError,
  AppError,
  type ActionResponse,
} from '../action-response.ts';
import type { PostServiceDeps } from './types.ts';

// ============================================================================
// 1. FUNGSI MURNI BANTUAN
// ============================================================================

/**
 * Menghitung selisih gambar yang sudah tidak digunakan lagi pada artikel:
 * (cover lama + gambar inline lama) dikurangi (cover baru + gambar inline baru), DISTINCT.
 */
export function calculateBlogImageDifference(
  oldCover: string | null | undefined,
  oldContent: string | null | undefined,
  newCover: string | null | undefined,
  newContent: string | null | undefined
): string[] {
  const oldSet = new Set<string>();
  if (oldCover && oldCover.trim().length > 0) oldSet.add(oldCover.trim());
  const oldInline = extractInlineImageUrls(oldContent);
  oldInline.forEach((url) => {
    if (url && url.trim().length > 0) oldSet.add(url.trim());
  });

  const newSet = new Set<string>();
  if (newCover && newCover.trim().length > 0) newSet.add(newCover.trim());
  const newInline = extractInlineImageUrls(newContent);
  newInline.forEach((url) => {
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

// ============================================================================
// 2. LOGIKA BISNIS & ORKESTRASI SERVER ACTION (MURNI & BER-DI)
// ============================================================================

/**
 * Orkestrasi: Membuat Artikel Blog Baru
 */
export async function executeCreatePost(
  rawInput: PostFormInput,
  deps: PostServiceDeps
): Promise<ActionResponse<{ id: string }>> {
  // 1. Verifikasi otorisasi Admin di server
  const user = await deps.auth.requireAdmin();

  // 2. Validasi input via Zod
  const validated = postFormSchema.parse(rawInput);

  // 3. Sanitasi konten rich text HTML (PRD §15.5)
  const { sanitizePostHtml } = await import('../sanitizer.ts');
  validated.content = sanitizePostHtml(validated.content);

  // 4. Hitung waktu baca artikel di server
  const readingTime = calculateReadingTimeMinutes(validated.content);

  // 5. Cek keunikan slug (409 Conflict)
  const isConflict = await deps.db.checkSlugConflict(validated.slug);
  if (isConflict) {
    return actionError(
      'Slug sudah digunakan oleh artikel lain. Silakan gunakan slug yang berbeda.',
      'CONFLICT',
      409,
      { slug: ['Slug ini sudah terdaftar pada artikel blog lain.'] }
    );
  }

  // 6. Simpan ke database
  const postId = await deps.db.createPost(validated, readingTime, user.id);

  // 7. Revalidasi cache
  deps.revalidate(['/admin/blog', '/blog', `/blog/${validated.slug}`, '/', '/sitemap.xml']);

  return actionSuccess({ id: postId });
}

/**
 * Orkestrasi: Memperbarui Artikel Blog yang Ada
 */
export async function executeUpdatePost(
  id: string,
  rawInput: PostFormInput,
  deps: PostServiceDeps
): Promise<ActionResponse<{ id: string }>> {
  // 1. Verifikasi otorisasi Admin di server
  await deps.auth.requireAdmin();

  if (!id || typeof id !== 'string') {
    throw new AppError('ID artikel tidak valid.', 'BAD_REQUEST', 400);
  }

  // 2. Ambil data artikel sebelum diupdate untuk perbandingan berkas
  const existingPost = await deps.db.getPostById(id);
  if (!existingPost) {
    throw new AppError('Artikel tidak ditemukan.', 'NOT_FOUND', 404);
  }

  // 3. Validasi input via Zod
  const validated = postFormSchema.parse(rawInput);

  // 4. Sanitasi konten HTML
  const { sanitizePostHtml } = await import('../sanitizer.ts');
  validated.content = sanitizePostHtml(validated.content);

  // 5. Hitung waktu baca artikel di server
  const readingTime = calculateReadingTimeMinutes(validated.content);

  // 6. Cek keunikan slug selain dirinya sendiri
  const isConflict = await deps.db.checkSlugConflict(validated.slug, id);
  if (isConflict) {
    return actionError(
      'Slug sudah digunakan oleh artikel lain. Silakan gunakan slug yang berbeda.',
      'CONFLICT',
      409,
      { slug: ['Slug ini sudah terdaftar pada artikel blog lain.'] }
    );
  }

  // 7. Simpan pembaruan ke database
  const updatedId = await deps.db.updatePost(id, validated, readingTime);

  // 8. Pembersihan berkas lama yang tidak lagi dipakai (SETELAH DB UPDATE SUKSES, BEST-EFFORT)
  const unusedUrls = calculateBlogImageDifference(
    existingPost.cover_url,
    existingPost.content,
    validated.cover_url,
    validated.content
  );

  if (unusedUrls.length > 0) {
    await cleanupUnusedBlogImagesSafely(unusedUrls, id, deps);
  }

  // 9. Revalidasi cache
  deps.revalidate([
    '/admin/blog',
    '/blog',
    `/blog/${validated.slug}`,
    ...(existingPost.slug !== validated.slug ? [`/blog/${existingPost.slug}`] : []),
    '/',
    '/sitemap.xml',
  ]);

  return actionSuccess({ id: updatedId });
}

/**
 * Orkestrasi: Menghapus Artikel Blog
 */
export async function executeDeletePost(
  id: string,
  deps: PostServiceDeps
): Promise<ActionResponse<{ id: string }>> {
  // 1. Verifikasi otorisasi Admin di server
  await deps.auth.requireAdmin();

  if (!id || typeof id !== 'string') {
    throw new AppError('ID artikel tidak valid.', 'BAD_REQUEST', 400);
  }

  // 2. Hapus artikel dari database dan ambil URL gambar cover & inline-nya
  const deletedData = await deps.db.deletePost(id);

  // 3. Bersihkan berkas cover dan inline dari Storage bucket 'blog' (BEST-EFFORT)
  const urlsToClean: string[] = [];
  if (deletedData.coverUrl) urlsToClean.push(deletedData.coverUrl);
  const inlineUrls = extractInlineImageUrls(deletedData.content);
  inlineUrls.forEach((u) => urlsToClean.push(u));

  if (urlsToClean.length > 0) {
    await cleanupUnusedBlogImagesSafely(urlsToClean, id, deps);
  }

  // 4. Revalidasi cache
  deps.revalidate(['/admin/blog', '/blog', '/', '/sitemap.xml']);

  return actionSuccess({ id: deletedData.id });
}

/**
 * Orkestrasi: Toggle Status Artikel (Draft <-> Published)
 */
export async function executeTogglePostStatus(
  id: string,
  status: PostStatus,
  deps: PostServiceDeps
): Promise<ActionResponse<{ id: string; status: PostStatus }>> {
  await deps.auth.requireAdmin();

  if (!id || typeof id !== 'string') {
    throw new AppError('ID artikel tidak valid.', 'BAD_REQUEST', 400);
  }

  await deps.db.toggleStatus(id, status);
  deps.revalidate(['/admin/blog', '/blog', '/', '/sitemap.xml']);

  return actionSuccess({ id, status });
}

/**
 * Orkestrasi: Unggah Gambar Cover atau Inline Artikel
 */
export async function executeUploadBlogImage(
  folder: 'covers' | 'inline',
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  deps: PostServiceDeps
): Promise<ActionResponse<{ url: string; path: string }>> {
  await deps.auth.requireAdmin();

  if (!fileBuffer || fileBuffer.length === 0) {
    return actionError('Berkas gambar tidak boleh kosong.', 'VALIDATION_ERROR', 400);
  }

  if (fileBuffer.length > MAX_BLOG_IMAGE_SIZE_BYTES) {
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
    deps.logger?.error('Gagal mengunggah gambar artikel ke storage:', error);
    return actionError(
      'Gagal mengunggah berkas ke media storage. Silakan coba kembali.',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
}

// ============================================================================
// 3. UTILITAS INTERNAL PEMBERSIHAN GAMBAR ARTIKEL
// ============================================================================

/**
 * Membersihkan URL gambar lama dengan aman:
 * 1. Mengekstrak path storage resmi dari bucket 'blog'
 * 2. Memverifikasi bahwa path tersebut TIDAK sedang dipakai artikel lain
 * 3. Menghapus secara best-effort dari Storage bucket
 */
export async function cleanupUnusedBlogImagesSafely(
  urls: string[],
  currentPostId: string,
  deps: PostServiceDeps
): Promise<void> {
  const pathsToDelete: string[] = [];

  for (const url of urls) {
    let path = extractBlogStoragePath(url, deps.supabaseUrl);
    if (!path && typeof url === 'string' && BLOG_STORAGE_PATH_REGEX.test(url.trim())) {
      path = url.trim();
    }
    if (!path) continue;

    try {
      const isInUse = await deps.db.isStoragePathInUse(path, currentPostId);
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
      deps.logger?.error('[cleanupUnusedBlogImagesSafely] Gagal menghapus berkas yatim:', removeErr);
    }
  }
}
