import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUserProfile,
  validateAdminRole,
  type RawAuthUser,
  type RawProfile,
} from '../src/lib/auth/guards.ts';
import {
  handleActionError,
  actionSuccess,
  actionError,
  AppError,
  type ActionResponse,
} from '../src/lib/action-response.ts';
import {
  categoryFormSchema,
  type CategoryFormInput,
} from '../src/validations/category.ts';

// In-memory test repository untuk menguji alur logika action secara deterministik
interface MockCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  book_count: number;
}

/**
 * Simulasi Server Action: createCategoryAction
 */
async function simulatedCreateCategoryAction(
  session: { user: RawAuthUser | null; profile: RawProfile | null },
  rawInput: CategoryFormInput,
  existingCategories: MockCategoryRecord[]
): Promise<ActionResponse<MockCategoryRecord>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    const authUser = validateUserProfile(session.user, session.profile);
    validateAdminRole(authUser);

    // 2. Validasi input Zod
    const validated = categoryFormSchema.parse(rawInput);

    // 3. Cek konflik keunikan slug (409 Conflict)
    const isConflict = existingCategories.some((c) => c.slug === validated.slug);
    if (isConflict) {
      return actionError(
        'Slug sudah digunakan oleh kategori lain. Silakan gunakan slug yang berbeda.',
        'CONFLICT',
        409,
        { slug: ['Slug ini sudah terdaftar di sistem.'] }
      );
    }

    // 4. Buat entitas baru
    const newRecord: MockCategoryRecord = {
      id: 'cat-new-uuid',
      name: validated.name,
      slug: validated.slug,
      description: validated.description ?? null,
      seo_title: validated.seo_title ?? null,
      seo_description: validated.seo_description ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      book_count: 0,
    };

    return actionSuccess(newRecord);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Simulasi Server Action: updateCategoryAction
 */
async function simulatedUpdateCategoryAction(
  session: { user: RawAuthUser | null; profile: RawProfile | null },
  id: string,
  rawInput: CategoryFormInput,
  existingCategories: MockCategoryRecord[]
): Promise<ActionResponse<MockCategoryRecord>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    const authUser = validateUserProfile(session.user, session.profile);
    validateAdminRole(authUser);

    if (!id) {
      throw new AppError('ID kategori tidak valid.', 'BAD_REQUEST', 400);
    }

    // 2. Validasi input Zod
    const validated = categoryFormSchema.parse(rawInput);

    // 3. Cari entitas yang ada
    const existing = existingCategories.find((c) => c.id === id);
    if (!existing) {
      throw new AppError('Kategori yang ingin diubah tidak ditemukan.', 'NOT_FOUND', 404);
    }

    // 4. Cek konflik slug pada kategori lain
    const isConflict = existingCategories.some(
      (c) => c.slug === validated.slug && c.id !== id
    );
    if (isConflict) {
      return actionError(
        'Slug sudah digunakan oleh kategori lain. Silakan gunakan slug yang berbeda.',
        'CONFLICT',
        409,
        { slug: ['Slug ini sudah terdaftar pada kategori lain.'] }
      );
    }

    const updated: MockCategoryRecord = {
      ...existing,
      name: validated.name,
      slug: validated.slug,
      description: validated.description ?? null,
      seo_title: validated.seo_title ?? null,
      seo_description: validated.seo_description ?? null,
      updated_at: new Date().toISOString(),
    };

    return actionSuccess(updated);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Simulasi Server Action: deleteCategoryAction
 */
async function simulatedDeleteCategoryAction(
  session: { user: RawAuthUser | null; profile: RawProfile | null },
  id: string,
  existingCategories: MockCategoryRecord[]
): Promise<ActionResponse<{ id: string }>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    const authUser = validateUserProfile(session.user, session.profile);
    validateAdminRole(authUser);

    if (!id) {
      throw new AppError('ID kategori tidak valid.', 'BAD_REQUEST', 400);
    }

    const existing = existingCategories.find((c) => c.id === id);
    if (!existing) {
      throw new AppError('Kategori yang ingin dihapus tidak ditemukan.', 'NOT_FOUND', 404);
    }

    // 2. Guard integritas relasi buku
    if (existing.book_count > 0) {
      return actionError(
        `Kategori tidak dapat dihapus karena masih digunakan oleh ${existing.book_count} buku. Harap pindahkan atau hapus buku terkait terlebih dahulu.`,
        'BAD_REQUEST',
        400
      );
    }

    return actionSuccess({ id });
  } catch (error) {
    return handleActionError(error);
  }
}

describe('Category Actions Suite (Integration / Security Tests)', () => {
  const adminSession = {
    user: { id: 'admin-1', email: 'admin@frasaklausamedia.com' },
    profile: {
      id: 'admin-1',
      full_name: 'Admin Frasa',
      avatar_url: null,
      role: 'admin' as const,
      is_active: true,
    },
  };

  const sampleDb: MockCategoryRecord[] = [
    {
      id: 'cat-1',
      name: 'Fiksi Populer',
      slug: 'fiksi-populer',
      description: 'Buku fiksi populer.',
      seo_title: null,
      seo_description: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      book_count: 5, // Berelasi dengan 5 buku
    },
    {
      id: 'cat-2',
      name: 'Sastra Klasik',
      slug: 'sastra-klasik',
      description: null,
      seo_title: null,
      seo_description: null,
      created_at: '2026-01-02T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
      book_count: 0, // Kategori kosong tanpa buku
    },
  ];

  describe('1. Verifikasi Otorisasi (RBAC)', () => {
    it('menolak pengguna anonim (tanpa sesi) dengan status 401 UNAUTHORIZED', async () => {
      const anonSession = { user: null, profile: null };
      const res = await simulatedCreateCategoryAction(
        anonSession,
        { name: 'Kategori Baru', slug: 'kategori-baru' },
        sampleDb
      );

      assert.equal(res.ok, false);
      assert.equal(res.error.status, 401);
      assert.equal(res.error.code, 'UNAUTHORIZED');
    });

    it('menolak pengguna dengan akun nonaktif (is_active: false) dengan status 403 FORBIDDEN', async () => {
      const inactiveSession = {
        user: { id: 'inactive-user', email: 'inactive@frasaklausamedia.com' },
        profile: {
          id: 'inactive-user',
          full_name: 'Inactive Admin',
          avatar_url: null,
          role: 'admin' as const,
          is_active: false,
        },
      };

      const res = await simulatedCreateCategoryAction(
        inactiveSession,
        { name: 'Kategori Baru', slug: 'kategori-baru' },
        sampleDb
      );

      assert.equal(res.ok, false);
      assert.equal(res.error.status, 403);
      assert.equal(res.error.code, 'FORBIDDEN');
    });

    it('menolak akun dengan role non-admin (misal: user biasa jika ada) dengan status 403 FORBIDDEN', async () => {
      const regularUserSession = {
        user: { id: 'reg-user', email: 'user@public.com' },
        profile: {
          id: 'reg-user',
          full_name: 'Public Reader',
          avatar_url: null,
          role: 'reader' as unknown as 'admin',
          is_active: true,
        },
      };

      const res = await simulatedCreateCategoryAction(
        regularUserSession,
        { name: 'Kategori Baru', slug: 'kategori-baru' },
        sampleDb
      );

      assert.equal(res.ok, false);
      assert.equal(res.error.status, 403);
      assert.equal(res.error.code, 'FORBIDDEN');
    });
  });

  describe('2. Penanganan Konflik Slug (HTTP 409 Conflict)', () => {
    it('mengembalikan status 409 CONFLICT jika slug baru sudah ada pada database', async () => {
      const res = await simulatedCreateCategoryAction(
        adminSession,
        { name: 'Fiksi Populer Baru', slug: 'fiksi-populer' }, // slug duplikat dari cat-1
        sampleDb
      );

      assert.equal(res.ok, false);
      assert.equal(res.error.status, 409);
      assert.equal(res.error.code, 'CONFLICT');
      assert.match(res.error.message, /slug sudah digunakan/i);
    });

    it('mengembalikan status 409 CONFLICT jika pembaruan mengubah slug menjadi milik kategori lain', async () => {
      const res = await simulatedUpdateCategoryAction(
        adminSession,
        'cat-2',
        { name: 'Sastra Klasik Ubah', slug: 'fiksi-populer' }, // bentrok dengan cat-1
        sampleDb
      );

      assert.equal(res.ok, false);
      assert.equal(res.error.status, 409);
      assert.equal(res.error.code, 'CONFLICT');
    });

    it('mengizinkan pembaruan jika slug tidak diubah (slug tetap milik sendiri)', async () => {
      const res = await simulatedUpdateCategoryAction(
        adminSession,
        'cat-2',
        { name: 'Sastra Klasik Nusantara', slug: 'sastra-klasik' }, // slug milik cat-2 sendiri
        sampleDb
      );

      assert.equal(res.ok, true);
      assert.equal(res.data.name, 'Sastra Klasik Nusantara');
    });
  });

  describe('3. Penjagaan Integritas Relasi Hapus (PRD §6.2.D)', () => {
    it('menolak penghapusan kategori yang masih memiliki buku terkait (book_count > 0)', async () => {
      const res = await simulatedDeleteCategoryAction(adminSession, 'cat-1', sampleDb);

      assert.equal(res.ok, false);
      assert.equal(res.error.status, 400);
      assert.equal(res.error.code, 'BAD_REQUEST');
      assert.match(res.error.message, /masih digunakan oleh 5 buku/i);
    });

    it('mengizinkan penghapusan kategori yang tidak memiliki buku terkait (book_count === 0)', async () => {
      const res = await simulatedDeleteCategoryAction(adminSession, 'cat-2', sampleDb);

      assert.equal(res.ok, true);
      assert.equal(res.data.id, 'cat-2');
    });
  });

  describe('4. Alur CRUD Berhasil', () => {
    it('sukses membuat kategori baru dengan payload valid', async () => {
      const res = await simulatedCreateCategoryAction(
        adminSession,
        {
          name: 'Antologi Puisi',
          slug: 'antologi-puisi',
          description: 'Kumpulan sajak dan puisi indah.',
        },
        sampleDb
      );

      assert.equal(res.ok, true);
      assert.equal(res.data.name, 'Antologi Puisi');
      assert.equal(res.data.slug, 'antologi-puisi');
      assert.equal(res.data.book_count, 0);
    });
  });
});
