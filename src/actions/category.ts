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
  categoryFormSchema,
  type CategoryFormInput,
} from '@/validations/category';
import {
  insertCategory,
  updateCategory,
  deleteCategory,
  checkCategorySlugConflict,
  getCategoryBookCount,
  getCategoryById,
} from '@/lib/categories/data-access';
import type { BookCategoryItem } from '@/lib/categories/types';

/**
 * Server Action: Membuat kategori buku baru
 */
export async function createCategoryAction(
  rawInput: CategoryFormInput
): Promise<ActionResponse<BookCategoryItem>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    await requireAdmin();

    // 2. Validasi input menggunakan skema Zod
    const validated = categoryFormSchema.parse(rawInput);

    // 3. Pengecekan keunikan slug (409 Conflict)
    const isConflict = await checkCategorySlugConflict(validated.slug);
    if (isConflict) {
      return actionError(
        'Slug sudah digunakan oleh kategori lain. Silakan gunakan slug yang berbeda.',
        'CONFLICT',
        409,
        { slug: ['Slug ini sudah terdaftar di sistem.'] }
      );
    }

    // 4. Eksekusi penyimpanan ke basis data
    const created = await insertCategory(validated);

    // 5. Targeted revalidation
    revalidatePath('/admin/book-categories');
    revalidatePath('/admin');

    return actionSuccess(created);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Memperbarui kategori buku yang ada
 */
export async function updateCategoryAction(
  id: string,
  rawInput: CategoryFormInput
): Promise<ActionResponse<BookCategoryItem>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    await requireAdmin();

    if (!id || typeof id !== 'string') {
      throw new AppError('ID kategori tidak valid.', 'BAD_REQUEST', 400);
    }

    // 2. Validasi input menggunakan skema Zod
    const validated = categoryFormSchema.parse(rawInput);

    // 3. Pastikan kategori ada
    const existing = await getCategoryById(id);
    if (!existing) {
      throw new AppError('Kategori yang ingin diubah tidak ditemukan.', 'NOT_FOUND', 404);
    }

    // 4. Pengecekan konflik slug bila slug diubah
    const isConflict = await checkCategorySlugConflict(validated.slug, id);
    if (isConflict) {
      return actionError(
        'Slug sudah digunakan oleh kategori lain. Silakan gunakan slug yang berbeda.',
        'CONFLICT',
        409,
        { slug: ['Slug ini sudah terdaftar pada kategori lain.'] }
      );
    }

    // 5. Eksekusi pembaruan ke basis data
    const updated = await updateCategory(id, validated);

    // 6. Targeted revalidation
    revalidatePath('/admin/book-categories');
    revalidatePath('/admin');

    return actionSuccess(updated);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action: Menghapus kategori buku (dengan guard integritas relasi buku)
 */
export async function deleteCategoryAction(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    await requireAdmin();

    if (!id || typeof id !== 'string') {
      throw new AppError('ID kategori tidak valid.', 'BAD_REQUEST', 400);
    }

    // 2. Pastikan kategori ada
    const existing = await getCategoryById(id);
    if (!existing) {
      throw new AppError('Kategori yang ingin dihapus tidak ditemukan.', 'NOT_FOUND', 404);
    }

    // 3. Guard integritas relasi: Cek apakah masih ada buku yang memakai kategori ini
    const bookCount = await getCategoryBookCount(id);
    if (bookCount > 0) {
      return actionError(
        `Kategori tidak dapat dihapus karena masih digunakan oleh ${bookCount} buku. Harap pindahkan atau hapus buku terkait terlebih dahulu.`,
        'BAD_REQUEST',
        400
      );
    }

    // 4. Eksekusi penghapusan
    await deleteCategory(id);

    // 5. Targeted revalidation
    revalidatePath('/admin/book-categories');
    revalidatePath('/admin');

    return actionSuccess({ id });
  } catch (error) {
    return handleActionError(error);
  }
}
