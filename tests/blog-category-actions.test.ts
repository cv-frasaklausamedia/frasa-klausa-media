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
  blogCategoryFormSchema,
  type BlogCategoryFormInput,
} from '../src/validations/blog-category.ts';

// In-memory test repository untuk menguji alur logika action secara deterministik
interface MockBlogCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  post_count: number;
}

/**
 * Simulasi Server Action: createBlogCategoryAction
 */
async function simulatedCreateBlogCategoryAction(
  session: { user: RawAuthUser | null; profile: RawProfile | null },
  rawInput: BlogCategoryFormInput,
  existingCategories: MockBlogCategoryRecord[]
): Promise<ActionResponse<MockBlogCategoryRecord>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    const authUser = validateUserProfile(session.user, session.profile);
    validateAdminRole(authUser);

    // 2. Validasi input Zod
    const validated = blogCategoryFormSchema.parse(rawInput);

    // 3. Cek konflik keunikan slug (409 Conflict)
    const isConflict = existingCategories.some((c) => c.slug === validated.slug);
    if (isConflict) {
      return actionError(
        'Slug sudah digunakan oleh kategori blog lain. Silakan gunakan slug yang berbeda.',
        'CONFLICT',
        409,
        { slug: ['Slug ini sudah terdaftar di sistem.'] }
      );
    }

    // 4. Buat entitas baru
    const newRecord: MockBlogCategoryRecord = {
      id: 'blog-cat-new-uuid',
      name: validated.name,
      slug: validated.slug,
      description: validated.description ?? null,
      seo_title: validated.seo_title ?? null,
      seo_description: validated.seo_description ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      post_count: 0,
    };

    return actionSuccess(newRecord);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Simulasi Server Action: updateBlogCategoryAction
 */
async function simulatedUpdateBlogCategoryAction(
  session: { user: RawAuthUser | null; profile: RawProfile | null },
  id: string,
  rawInput: BlogCategoryFormInput,
  existingCategories: MockBlogCategoryRecord[]
): Promise<ActionResponse<MockBlogCategoryRecord>> {
  try {
    // 1. Verifikasi otorisasi Admin di server
    const authUser = validateUserProfile(session.user, session.profile);
    validateAdminRole(authUser);

    if (!id) {
      throw new AppError('ID kategori tidak valid.', 'BAD_REQUEST', 400);
    }

    // 2. Validasi input Zod
    const validated = blogCategoryFormSchema.parse(rawInput);

    // 3. Cari entitas yang ada
    const existing = existingCategories.find((c) => c.id === id);
    if (!existing) {
      throw new AppError('Kategori blog yang ingin diubah tidak ditemukan.', 'NOT_FOUND', 404);
    }

    // 4. Cek konflik slug pada kategori lain
    const isConflict = existingCategories.some(
      (c) => c.slug === validated.slug && c.id !== id
    );
    if (isConflict) {
      return actionError(
        'Slug sudah digunakan oleh kategori blog lain. Silakan gunakan slug yang berbeda.',
        'CONFLICT',
        409,
        { slug: ['Slug ini sudah terdaftar pada kategori lain.'] }
      );
    }

    const updated: MockBlogCategoryRecord = {
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
 * Simulasi Server Action: deleteBlogCategoryAction
 */
async function simulatedDeleteBlogCategoryAction(
  session: { user: RawAuthUser | null; profile: RawProfile | null },
  id: string,
  existingCategories: MockBlogCategoryRecord[]
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
      throw new AppError('Kategori blog yang ingin dihapus tidak ditemukan.', 'NOT_FOUND', 404);
    }

    // 2. Guard integritas relasi artikel blog (ON DELETE RESTRICT)
    if (existing.post_count > 0) {
      return actionError(
        `Kategori tidak dapat dihapus karena masih digunakan oleh ${existing.post_count} artikel blog. Harap pindahkan atau hapus artikel terkait terlebih dahulu.`,
        'BAD_REQUEST',
        400
      );
    }

    return actionSuccess({ id });
  } catch (error) {
    return handleActionError(error);
  }
}

describe('Blog Category Server Actions Suite (Tahap 6 - PRD §6.2.F & §13)', () => {
  const adminSession = {
    user: { id: 'admin-1', email: 'admin@frasaklausa.com' },
    profile: {
      id: 'admin-1',
      role: 'admin' as const,
      is_active: true,
      full_name: 'Editor In Chief',
      email: 'admin@frasaklausa.com',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  const nonAdminSession = {
    user: { id: 'user-2', email: 'guest@frasaklausa.com' },
    profile: {
      id: 'user-2',
      role: 'reader' as unknown as 'admin',
      is_active: true,
      full_name: 'Guest Reader',
      email: 'guest@frasaklausa.com',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  const initialCategories: MockBlogCategoryRecord[] = [
    {
      id: 'cat-1',
      name: 'Resensi Buku',
      slug: 'resensi-buku',
      description: 'Ulasan karya sastra',
      seo_title: null,
      seo_description: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      post_count: 5,
    },
    {
      id: 'cat-2',
      name: 'Kategori Kosong',
      slug: 'kategori-kosong',
      description: 'Kategori tanpa artikel',
      seo_title: null,
      seo_description: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      post_count: 0,
    },
  ];

  describe('createBlogCategoryAction', () => {
    it('berhasil membuat kategori blog baru saat diakses oleh Admin', async () => {
      const res = await simulatedCreateBlogCategoryAction(
        adminSession,
        {
          name: 'Opini Sastra',
          slug: 'opini-sastra',
          description: 'Esai dan pemikiran sastra kontemporer',
          seo_title: 'Opini Sastra | Frasa Klausa Media',
          seo_description: 'Kumpulan opini dan pemikiran sastra dari para penulis terkemuka.',
        },
        initialCategories
      );

      assert.equal(res.ok, true);
      if (res.ok) {
        assert.equal(res.data.name, 'Opini Sastra');
        assert.equal(res.data.slug, 'opini-sastra');
        assert.equal(res.data.post_count, 0);
      }
    });

    it('menolak pembuatan kategori jika pengguna bukan Admin (403 Forbidden)', async () => {
      const res = await simulatedCreateBlogCategoryAction(
        nonAdminSession,
        {
          name: 'Opini Sastra',
          slug: 'opini-sastra',
        },
        initialCategories
      );

      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.equal(res.error.status, 403);
      }
    });

    it('menolak pembuatan kategori jika slug sudah terdaftar (409 Conflict)', async () => {
      const res = await simulatedCreateBlogCategoryAction(
        adminSession,
        {
          name: 'Resensi Duplikat',
          slug: 'resensi-buku',
        },
        initialCategories
      );

      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.equal(res.error.status, 409);
        assert.equal(res.error.code, 'CONFLICT');
      }
    });
  });

  describe('updateBlogCategoryAction', () => {
    it('berhasil memperbarui nama dan deskripsi kategori', async () => {
      const res = await simulatedUpdateBlogCategoryAction(
        adminSession,
        'cat-1',
        {
          name: 'Resensi & Telaah Buku',
          slug: 'resensi-buku',
          description: 'Deskripsi yang diperbarui',
        },
        initialCategories
      );

      assert.equal(res.ok, true);
      if (res.ok) {
        assert.equal(res.data.name, 'Resensi & Telaah Buku');
        assert.equal(res.data.description, 'Deskripsi yang diperbarui');
      }
    });

    it('menolak pembaruan jika ID kategori tidak ditemukan (404 Not Found)', async () => {
      const res = await simulatedUpdateBlogCategoryAction(
        adminSession,
        'cat-unknown',
        {
          name: 'Tidak Ada',
          slug: 'tidak-ada',
        },
        initialCategories
      );

      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.equal(res.error.status, 404);
      }
    });

    it('menolak pengubahan slug menjadi slug kategori lain yang sudah ada (409 Conflict)', async () => {
      const res = await simulatedUpdateBlogCategoryAction(
        adminSession,
        'cat-2',
        {
          name: 'Kategori Kosong Diubah',
          slug: 'resensi-buku',
        },
        initialCategories
      );

      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.equal(res.error.status, 409);
      }
    });
  });

  describe('deleteBlogCategoryAction & Relational Integrity Guard', () => {
    it('mencegah penghapusan kategori blog yang masih memiliki artikel terhubung (400 Bad Request)', async () => {
      const res = await simulatedDeleteBlogCategoryAction(
        adminSession,
        'cat-1', // post_count: 5
        initialCategories
      );

      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.equal(res.error.status, 400);
        assert.ok(res.error.message.includes('masih digunakan oleh 5 artikel blog'));
      }
    });

    it('mengizinkan penghapusan kategori blog yang tidak memiliki artikel terhubung (post_count === 0)', async () => {
      const res = await simulatedDeleteBlogCategoryAction(
        adminSession,
        'cat-2', // post_count: 0
        initialCategories
      );

      assert.equal(res.ok, true);
      if (res.ok) {
        assert.equal(res.data.id, 'cat-2');
      }
    });
  });
});
