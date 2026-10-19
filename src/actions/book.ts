'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/configs/env';
import {
  handleActionError,
  actionSuccess,
  actionError,
  type ActionResponse,
} from '@/lib/action-response';
import {
  executeCreateBook,
  executeUpdateBook,
  executeDeleteBook,
  executeToggleBookPublished,
  executeToggleBookFeatured,
  executeUploadBookImage,
  type BookServiceDeps,
} from '@/lib/books/service';
import {
  checkBookSlugConflict,
  callUpsertBookAtomic,
  getBookById,
  deleteBookRecord,
  toggleBookField,
  checkIfStoragePathInUse,
  searchBooksForRelated,
} from '@/lib/books/data-access';
import {
  type BookFormInput,
  BOOKS_STORAGE_PATH_REGEX,
} from '@/validations/book';

/**
 * Menyusun dependensi nyata (Real Adapters) untuk disuntikkan ke service
 */
async function getRealServiceDeps(): Promise<BookServiceDeps> {
  const supabase = await createClient();

  return {
    auth: {
      requireAdmin: async () => {
        const user = await requireAdmin();
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        };
      },
    },
    db: {
      checkSlugConflict: (slug, excludeId) => checkBookSlugConflict(slug, excludeId),
      upsertAtomic: (bookId, data) => callUpsertBookAtomic(bookId, data),
      getBookById: (id) => getBookById(id),
      deleteBook: (id) => deleteBookRecord(id),
      toggleField: (id, field, value) => toggleBookField(id, field, value),
      isStoragePathInUse: (path, excludeBookId) => checkIfStoragePathInUse(path, excludeBookId),
    },
    storage: {
      upload: async (path, buffer, contentType) => {
        const { error: uploadError } = await supabase.storage
          .from('books')
          .upload(path, buffer, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('books').getPublicUrl(path);

        return { publicUrl };
      },
      remove: async (paths) => {
        if (!paths || paths.length === 0) return;
        await supabase.storage.from('books').remove(paths);
      },
      getPublicUrl: (path) => {
        const {
          data: { publicUrl },
        } = supabase.storage.from('books').getPublicUrl(path);
        return publicUrl;
      },
    },
    revalidate: (paths) => {
      paths.forEach((p) => revalidatePath(p));
      // TODO: revalidatePath('/katalog') setelah katalog publik dibangun
      // TODO: revalidatePath('/buku/' + slug) setelah detail buku publik dibangun
      // TODO: revalidatePath('/sitemap.xml') setelah sitemap dinamis dibangun
      // TODO: Jika halaman publik nanti memakai 'use cache' + cacheTag, ganti ke updateTag/revalidateTag
    },
    logger: console,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  };
}

/**
 * Server Action: Mengunggah Berkas Cover atau Galeri Buku
 */
export async function uploadBookImageAction(
  formData: FormData,
  folder: 'covers' | 'gallery'
): Promise<ActionResponse<{ url: string; path: string }>> {
  try {
    await requireAdmin();

    const file = formData.get('file');
    if (
      !file ||
      typeof file !== 'object' ||
      !('size' in file) ||
      typeof (file as Blob).arrayBuffer !== 'function'
    ) {
      return actionError('Silakan pilih berkas gambar yang valid untuk diunggah.', 'VALIDATION_ERROR', 400);
    }

    const blobFile = file as Blob & { name?: string };
    const arrayBuffer = await blobFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const deps = await getRealServiceDeps();
    return await executeUploadBookImage(folder, fileBuffer, blobFile.name || 'image', deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Membersihkan Berkas Storage yang Batal Disimpan (Orphan Prevention)
 * Validasi ketat: array of strings, max 20 paths, prefix covers/ atau gallery/, UUID, ekstensi jpg/png/webp, tanpa "..".
 */
export async function cleanupUploadedFilesAction(
  paths: string[]
): Promise<ActionResponse<{ cleaned: number }>> {
  try {
    await requireAdmin();

    if (!paths || !Array.isArray(paths)) {
      return actionError('Input paths harus berupa array.', 'VALIDATION_ERROR', 400);
    }

    if (paths.length === 0) {
      return actionSuccess({ cleaned: 0 });
    }

    if (paths.length > 20) {
      return actionError('Maksimal 20 path yang dapat dibersihkan dalam satu panggilan.', 'BAD_REQUEST', 400);
    }

    const supabase = await createClient();

    // Validasi ketat seketat extractBooksStoragePath menggunakan regex BOOKS_STORAGE_PATH_REGEX
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

    if (safePaths.length > 0) {
      // Pastikan path yang ingin dihapus TIDAK sedang dipakai buku aktif di database
      // Menggunakan kesamaan persis URL publik
      const verifiedPathsToDelete: string[] = [];
      for (const p of safePaths) {
        const inUse = await checkIfStoragePathInUse(p);
        if (!inUse) {
          verifiedPathsToDelete.push(p);
        }
      }

      if (verifiedPathsToDelete.length > 0) {
        await supabase.storage.from('books').remove(verifiedPathsToDelete);
      }
      return actionSuccess({ cleaned: verifiedPathsToDelete.length });
    }

    return actionSuccess({ cleaned: 0 });
  } catch (error) {
    console.error('[cleanupUploadedFilesAction] Gagal membersihkan berkas batal:', error);
    return actionSuccess({ cleaned: 0 }); // Best-effort: jangan menggagalkan UI jika cleanup gagal
  }
}

/**
 * Server Action: Membuat Buku Baru
 */
export async function createBookAction(
  rawInput: BookFormInput,
  newlyUploadedPaths: string[] = []
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireAdmin();
    const deps = await getRealServiceDeps();
    return await executeCreateBook(rawInput, deps, newlyUploadedPaths);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Memperbarui Buku yang Ada
 */
export async function updateBookAction(
  id: string,
  rawInput: BookFormInput,
  newlyUploadedPaths: string[] = []
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireAdmin();
    const deps = await getRealServiceDeps();
    return await executeUpdateBook(id, rawInput, deps, newlyUploadedPaths);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Menghapus Buku
 */
export async function deleteBookAction(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireAdmin();
    const deps = await getRealServiceDeps();
    return await executeDeleteBook(id, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Toggle Publish Buku Langsung dari Tabel
 */
export async function toggleBookPublishedAction(
  id: string,
  isPublished: boolean
): Promise<ActionResponse<{ id: string; isPublished: boolean }>> {
  try {
    await requireAdmin();
    const deps = await getRealServiceDeps();
    return await executeToggleBookPublished(id, isPublished, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Toggle Featured Buku Langsung dari Tabel
 */
export async function toggleBookFeaturedAction(
  id: string,
  isFeatured: boolean
): Promise<ActionResponse<{ id: string; isFeatured: boolean }>> {
  try {
    await requireAdmin();
    const deps = await getRealServiceDeps();
    return await executeToggleBookFeatured(id, isFeatured, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Pencarian Buku Terkait (DTO Ringan) untuk Modal Pemilih Form
 */
export async function searchBooksForRelatedAction(
  q: string,
  excludeId?: string
): Promise<ActionResponse<{ items: Array<{ id: string; title: string; author: string; cover_url: string | null }> }>> {
  try {
    await requireAdmin();

    const cleanQ = typeof q === 'string' ? q.slice(0, 100).trim() : '';
    const cleanExcludeId = typeof excludeId === 'string' && excludeId.trim() ? excludeId.trim() : undefined;

    const results = await searchBooksForRelated(cleanQ, cleanExcludeId, 10);

    const lightweightItems = results.slice(0, 10).map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover_url: b.cover_url,
    }));

    return actionSuccess({ items: lightweightItems });
  } catch (error) {
    return handleActionError(error);
  }
}


