'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
  actionSuccess,
  actionError,
  handleActionError,
  AppError,
  type ActionResponse,
} from '@/lib/action-response';
import {
  blogCategoryFormSchema,
  type BlogCategoryFormInput,
} from '@/validations/blog-category';
import {
  insertBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  checkBlogCategorySlugConflict,
  getBlogCategoryPostCount,
  getBlogCategoryById,
} from '@/lib/blog-categories/data-access';
import type { BlogCategoryItem } from '@/lib/blog-categories/types';

/**
 * Server Action: Membuat kategori blog baru
 */
export async function createBlogCategoryAction(
  rawInput: BlogCategoryFormInput
): Promise<ActionResponse<BlogCategoryItem>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    await requireAdmin();

    // 2. Validasi input menggunakan skema Zod
    const validated = blogCategoryFormSchema.parse(rawInput);

    // 3. Pengecekan keunikan slug (409 Conflict)
    const isConflict = await checkBlogCategorySlugConflict(validated.slug);
    if (isConflict) {
      return actionError(
        'Slug sudah digunakan oleh kategori blog lain. Silakan gunakan slug yang berbeda.',
        'CONFLICT',
        409,
        { slug: ['Slug ini sudah terdaftar di sistem.'] }
      );
    }

    // 4. Eksekusi penyimpanan ke basis data
    const created = await insertBlogCategory(validated);

    // 5. Targeted revalidation
    revalidatePath('/admin/blog-categories');
    revalidatePath('/admin/blog');
    revalidatePath('/admin');
    revalidatePath('/blog');

    return actionSuccess(created);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Memperbarui kategori blog yang ada
 */
export async function updateBlogCategoryAction(
  id: string,
  rawInput: BlogCategoryFormInput
): Promise<ActionResponse<BlogCategoryItem>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    await requireAdmin();

    if (!id || typeof id !== 'string') {
      throw new AppError('ID kategori tidak valid.', 'BAD_REQUEST', 400);
    }

    // 2. Validasi input menggunakan skema Zod
    const validated = blogCategoryFormSchema.parse(rawInput);

    // 3. Pastikan kategori ada
    const existing = await getBlogCategoryById(id);
    if (!existing) {
      throw new AppError('Kategori blog yang ingin diubah tidak ditemukan.', 'NOT_FOUND', 404);
    }

    // 4. Pengecekan konflik slug bila slug diubah
    const isConflict = await checkBlogCategorySlugConflict(validated.slug, id);
    if (isConflict) {
      return actionError(
        'Slug sudah digunakan oleh kategori blog lain. Silakan gunakan slug yang berbeda.',
        'CONFLICT',
        409,
        { slug: ['Slug ini sudah terdaftar pada kategori lain.'] }
      );
    }

    // 5. Eksekusi pembaruan ke basis data
    const updated = await updateBlogCategory(id, validated);

    // 6. Targeted revalidation
    revalidatePath('/admin/blog-categories');
    revalidatePath('/admin/blog');
    revalidatePath('/admin');
    revalidatePath('/blog');

    return actionSuccess(updated);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Menghapus kategori blog (dengan guard integritas relasi artikel blog)
 */
export async function deleteBlogCategoryAction(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    await requireAdmin();

    if (!id || typeof id !== 'string') {
      throw new AppError('ID kategori tidak valid.', 'BAD_REQUEST', 400);
    }

    // 2. Pastikan kategori ada
    const existing = await getBlogCategoryById(id);
    if (!existing) {
      throw new AppError('Kategori blog yang ingin dihapus tidak ditemukan.', 'NOT_FOUND', 404);
    }

    // 3. Guard integritas relasi: Cek apakah masih ada artikel yang memakai kategori ini
    const postCount = await getBlogCategoryPostCount(id);
    if (postCount > 0) {
      return actionError(
        `Kategori tidak dapat dihapus karena masih digunakan oleh ${postCount} artikel blog. Harap pindahkan atau hapus artikel terkait terlebih dahulu.`,
        'BAD_REQUEST',
        400
      );
    }

    // 4. Eksekusi penghapusan
    await deleteBlogCategory(id);

    // 5. Targeted revalidation
    revalidatePath('/admin/blog-categories');
    revalidatePath('/admin/blog');
    revalidatePath('/admin');
    revalidatePath('/blog');

    return actionSuccess({ id });
  } catch (error) {
    return handleActionError(error);
  }
}
