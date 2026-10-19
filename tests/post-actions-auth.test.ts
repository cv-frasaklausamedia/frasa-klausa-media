import test from 'node:test';
import assert from 'node:assert/strict';

import {
  executeCreatePost,
  executeUpdatePost,
  executeDeletePost,
  executeTogglePostStatus,
  executeUploadBlogImage,
} from '../src/lib/posts/service.ts';
import type { PostServiceDeps, PostDetail } from '../src/lib/posts/types.ts';
import { AppError } from '../src/lib/action-response.ts';

function createMockDeps(overrides: Partial<PostServiceDeps> = {}): {
  deps: PostServiceDeps;
  revalidatedPaths: string[];
} {
  const revalidatedPaths: string[] = [];

  const defaultDeps: PostServiceDeps = {
    auth: {
      requireAdmin: async () => ({
        id: 'admin-uuid-123',
        email: 'admin@frasaklausamedia.com',
        role: 'admin',
        isActive: true,
      }),
    },
    db: {
      checkSlugConflict: async () => false,
      getPostById: async (id: string): Promise<PostDetail | null> => ({
        id,
        title: 'Artikel Lama',
        slug: 'artikel-lama',
        excerpt: 'Ringkasan lama',
        content: '<p>Konten lama</p>',
        cover_url: 'https://example.com/storage/v1/object/public/blog/covers/old-cover.jpg',
        author_name: 'Penulis Lama',
        category_id: '11111111-1111-4111-8111-111111111111',
        status: 'draft',
        published_at: null,
        reading_time_minutes: 1,
        tags: ['sastra'],
        seo_title: null,
        seo_description: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      createPost: async () => 'new-post-uuid-456',
      updatePost: async (id) => id,
      deletePost: async (id) => ({
        id,
        coverUrl: 'https://example.com/storage/v1/object/public/blog/covers/old-cover.jpg',
        content: '<img src="https://example.com/storage/v1/object/public/blog/inline/inline-1.jpg" />',
      }),
      toggleStatus: async () => {},
      isStoragePathInUse: async () => false,
    },
    storage: {
      upload: async () => ({
        publicUrl: 'https://example.com/storage/v1/object/public/blog/covers/test.jpg',
      }),
      remove: async () => {},
      getPublicUrl: (p) => `https://example.com/storage/v1/object/public/blog/${p}`,
    },
    revalidate: (paths) => {
      revalidatedPaths.push(...paths);
    },
  };

  return {
    deps: {
      ...defaultDeps,
      ...overrides,
      auth: { ...defaultDeps.auth, ...overrides.auth },
      db: { ...defaultDeps.db, ...overrides.db },
      storage: { ...defaultDeps.storage, ...overrides.storage },
    },
    revalidatedPaths,
  };
}

test('Post Actions Authorization & Service Suite (Tahap 6 — PRD §5 & §6.2.F)', async (t) => {
  const validPayload = {
    title: 'Estetika Kata dalam Sastra',
    slug: 'estetika-kata-dalam-sastra',
    excerpt: 'Ringkasan artikel',
    content: '<p>Konten artikel yang cukup panjang untuk divalidasi dengan baik.</p>',
    cover_url: null,
    category_id: '11111111-1111-4111-8111-111111111111',
    tags: ['sastra', 'esai'],
    author_name: 'Pramoedya',
    status: 'draft' as const,
    published_at: null,
    seo_title: null,
    seo_description: null,
  };

  await t.test('1. Menolak executeCreatePost jika pengguna bukan Admin aktif (401/403)', async () => {
    const { deps } = createMockDeps({
      auth: {
        requireAdmin: async () => {
          throw new AppError('Akses ditolak: Hanya admin aktif yang diizinkan.', 'FORBIDDEN', 403);
        },
      },
    });

    await assert.rejects(
      async () => executeCreatePost(validPayload, deps),
      (err: unknown) => {
        return err instanceof AppError && err.status === 403;
      }
    );
  });

  await t.test('2. Menolak executeUpdatePost jika pengguna bukan Admin aktif', async () => {
    const { deps } = createMockDeps({
      auth: {
        requireAdmin: async () => {
          throw new AppError('Akses ditolak.', 'UNAUTHORIZED', 401);
        },
      },
    });

    await assert.rejects(
      async () => executeUpdatePost('post-123', validPayload, deps),
      (err: unknown) => err instanceof AppError && err.status === 401
    );
  });

  await t.test('3. Menolak executeDeletePost jika pengguna bukan Admin aktif', async () => {
    const { deps } = createMockDeps({
      auth: {
        requireAdmin: async () => {
          throw new AppError('Akses ditolak.', 'UNAUTHORIZED', 401);
        },
      },
    });

    await assert.rejects(
      async () => executeDeletePost('post-123', deps),
      (err: unknown) => err instanceof AppError && err.status === 401
    );
  });

  await t.test('4. Menolak executeTogglePostStatus jika pengguna bukan Admin aktif', async () => {
    const { deps } = createMockDeps({
      auth: {
        requireAdmin: async () => {
          throw new AppError('Akses ditolak.', 'UNAUTHORIZED', 401);
        },
      },
    });

    await assert.rejects(
      async () => executeTogglePostStatus('post-123', 'published', deps),
      (err: unknown) => err instanceof AppError && err.status === 401
    );
  });

  await t.test('5. executeCreatePost sukses saat diotorisasi oleh Admin dan merevalidasi cache', async () => {
    const { deps, revalidatedPaths } = createMockDeps();

    const response = await executeCreatePost(validPayload, deps);
    assert.equal(response.ok, true);
    if (response.ok) {
      assert.equal(response.data.id, 'new-post-uuid-456');
    }

    // Memastikan revalidasi jalur blog dan sitemap terpicu
    assert.equal(revalidatedPaths.includes('/admin/blog'), true);
    assert.equal(revalidatedPaths.includes('/blog'), true);
    assert.equal(revalidatedPaths.includes('/sitemap.xml'), true);
  });

  await t.test('6. Menolak executeCreatePost dengan kode 409 CONFLICT jika slug sudah ada', async () => {
    const { deps } = createMockDeps({
      db: {
        ...createMockDeps().deps.db,
        checkSlugConflict: async () => true, // Simulasi konflik slug
      },
    });

    const response = await executeCreatePost(validPayload, deps);
    assert.equal(response.ok, false);
    if (!response.ok) {
      assert.equal(response.error.code, 'CONFLICT');
      assert.equal(response.error.status, 409);
    }
  });
});
