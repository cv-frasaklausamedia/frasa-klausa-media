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
import { logger } from '@/lib/logger';
import {
  executeCreatePost,
  executeUpdatePost,
  executeDeletePost,
  executeTogglePostStatus,
  executeUploadBlogImage,
} from '@/lib/posts/service';
import type { PostServiceDeps } from '@/lib/posts/types';
import {
  checkPostSlugConflict,
  getPostById,
  createPostRecord,
  updatePostRecord,
  deletePostRecord,
  togglePostStatusRecord,
  isBlogStoragePathInUse,
} from '@/lib/posts/data-access';
import {
  type PostFormInput,
  type PostFormValues,
  type PostStatus,
  validateBlogCleanupPaths,
} from '@/validations/post';

/**
 * Menyusun dependensi nyata (Real Adapters) untuk disuntikkan ke service blog
 */
async function getRealPostServiceDeps(): Promise<PostServiceDeps> {
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
      checkSlugConflict: (slug, excludeId) => checkPostSlugConflict(slug, excludeId),
      getPostById: (id) => getPostById(id),
      createPost: (data, readingTimeMinutes, authorId) =>
        createPostRecord(data, readingTimeMinutes, authorId),
      updatePost: (id, data, readingTimeMinutes) =>
        updatePostRecord(id, data, readingTimeMinutes),
      deletePost: (id) => deletePostRecord(id),
      toggleStatus: (id, status) => togglePostStatusRecord(id, status),
      isStoragePathInUse: (path, excludePostId) =>
        isBlogStoragePathInUse(path, excludePostId),
    },
    storage: {
      upload: async (path, buffer, contentType) => {
        const { error: uploadError } = await supabase.storage
          .from('blog')
          .upload(path, buffer, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('blog').getPublicUrl(path);

        return { publicUrl };
      },
      remove: async (paths) => {
        if (!paths || paths.length === 0) return;
        await supabase.storage.from('blog').remove(paths);
      },
      getPublicUrl: (path) => {
        const {
          data: { publicUrl },
        } = supabase.storage.from('blog').getPublicUrl(path);
        return publicUrl;
      },
    },
    revalidate: (paths) => {
      paths.forEach((p) => revalidatePath(p));
    },
    logger: {
      error: (msg: string, ...args: unknown[]) => {
        logger.error(msg, args.length > 0 ? { extra: args } : undefined);
      },
      info: (msg: string, ...args: unknown[]) => {
        logger.info(msg, args.length > 0 ? { extra: args } : undefined);
      },
    },
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  };
}

/**
 * Server Action: Mengunggah Berkas Cover atau Gambar Inline Artikel Blog
 */
export async function uploadBlogImageAction(
  formData: FormData,
  folder: 'covers' | 'inline'
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

    const deps = await getRealPostServiceDeps();
    return await executeUploadBlogImage(folder, fileBuffer, blobFile.name || 'image', deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Membersihkan Berkas Storage yang Batal Disimpan (Orphan Prevention)
 * Validasi ketat: array of strings, max 20 paths, prefix covers/ atau inline/, UUID, ekstensi jpg/png/webp.
 */
export async function cleanupBlogUploadedFilesAction(
  paths: string[]
): Promise<ActionResponse<{ cleaned: number }>> {
  try {
    await requireAdmin();

    const validatedPaths = validateBlogCleanupPaths(paths);
    if (validatedPaths === null) {
      if (!paths || !Array.isArray(paths)) {
        return actionError('Input paths harus berupa array.', 'VALIDATION_ERROR', 400);
      }
      return actionError(
        'Maksimal 20 path yang dapat dibersihkan dalam satu panggilan.',
        'BAD_REQUEST',
        400
      );
    }

    if (validatedPaths.length === 0) {
      return actionSuccess({ cleaned: 0 });
    }

    const supabase = await createClient();

    // Pastikan path yang ingin dihapus TIDAK sedang dipakai artikel aktif di database
    const verifiedPathsToDelete: string[] = [];
    for (const p of validatedPaths) {
      const inUse = await isBlogStoragePathInUse(p);
      if (!inUse) {
        verifiedPathsToDelete.push(p);
      }
    }

    if (verifiedPathsToDelete.length > 0) {
      await supabase.storage.from('blog').remove(verifiedPathsToDelete);
    }

    return actionSuccess({ cleaned: verifiedPathsToDelete.length });
  } catch (error) {
    console.error('[cleanupBlogUploadedFilesAction] Gagal membersihkan berkas batal:', error);
    return actionSuccess({ cleaned: 0 }); // Best-effort: jangan menggagalkan UI jika cleanup gagal
  }
}

/**
 * Server Action: Membuat Artikel Baru
 */
export async function createPostAction(
  rawInput: PostFormInput | PostFormValues
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireAdmin();
    const deps = await getRealPostServiceDeps();
    return await executeCreatePost(rawInput, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Memperbarui Artikel yang Ada
 */
export async function updatePostAction(
  id: string,
  rawInput: PostFormInput | PostFormValues
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireAdmin();
    const deps = await getRealPostServiceDeps();
    return await executeUpdatePost(id, rawInput, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Menghapus Artikel
 */
export async function deletePostAction(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireAdmin();
    const deps = await getRealPostServiceDeps();
    return await executeDeletePost(id, deps);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Toggle Status Artikel Langsung dari Tabel
 */
export async function togglePostStatusAction(
  id: string,
  status: PostStatus
): Promise<ActionResponse<{ id: string; status: PostStatus }>> {
  try {
    await requireAdmin();
    const deps = await getRealPostServiceDeps();
    return await executeTogglePostStatus(id, status, deps);
  } catch (error) {
    return handleActionError(error);
  }
}
