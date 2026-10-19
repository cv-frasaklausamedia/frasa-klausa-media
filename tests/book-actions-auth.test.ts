import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUserProfile,
  validateAdminRole,
  type RawAuthUser,
  type RawProfile,
} from '../src/lib/auth/guards.ts';
import {
  executeCreateBook,
  executeUpdateBook,
  executeDeleteBook,
  executeToggleBookPublished,
  executeToggleBookFeatured,
  type BookServiceDeps,
  type BookDbAdapter,
  type BookStorageAdapter,
} from '../src/lib/books/service.ts';
import type { BookFormInput } from '../src/validations/book.ts';

describe('Book Actions Authorization Suite (Fase 2 - PRD §5 & §15.3)', () => {
  const dummyFormInput: BookFormInput = {
    title: 'Buku Otorisasi',
    slug: 'buku-otorisasi',
    category_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    author: 'Penulis',
    publisher: 'Frasa Klausa Media',
    publish_year: 2024,
    page_count: 100,
    price_regular: 75000,
    cover_url: null,
    gallery: [],
    related_book_ids: [],
  };

  const dummyDb: BookDbAdapter = {
    checkSlugConflict: async () => false,
    upsertAtomic: async () => ({ book_id: 'book-1', unused_image_urls: [] }),
    getBookById: async () => null,
    deleteBook: async () => ({ id: 'book-1', coverUrl: null, galleryUrls: [] }),
    toggleField: async () => {},
    isStoragePathInUse: async () => false,
  };

  const dummyStorage: BookStorageAdapter = {
    upload: async () => ({ publicUrl: '' }),
    remove: async () => {},
    getPublicUrl: (p) => p,
  };

  function createDepsWithAuth(user: RawAuthUser | null, profile: RawProfile | null): BookServiceDeps {
    return {
      auth: {
        requireAdmin: async () => {
          const authUser = validateUserProfile(user, profile);
          return validateAdminRole(authUser);
        },
      },
      db: dummyDb,
      storage: dummyStorage,
      revalidate: () => {},
    };
  }

  it('menolak pemanggilan createBook oleh pengguna anonim (401 UNAUTHORIZED)', async () => {
    const deps = createDepsWithAuth(null, null);

    await assert.rejects(
      async () => {
        await executeCreateBook(dummyFormInput, deps);
      },
      (err: unknown) => {
        return (
          err !== null &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: string }).code === 'UNAUTHORIZED' &&
          (err as { status: number }).status === 401
        );
      }
    );
  });

  it('menolak pemanggilan updateBook oleh akun yang telah dinonaktifkan (403 FORBIDDEN)', async () => {
    const deps = createDepsWithAuth(
      { id: 'user-1', email: 'inactive@frasa.com' },
      {
        id: 'user-1',
        full_name: 'Admin Nonaktif',
        avatar_url: null,
        role: 'admin',
        is_active: false, // Nonaktif!
      }
    );

    await assert.rejects(
      async () => {
        await executeUpdateBook('book-1', dummyFormInput, deps);
      },
      (err: unknown) => {
        return (
          err !== null &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: string }).code === 'FORBIDDEN' &&
          (err as { status: number }).status === 403
        );
      }
    );
  });

  it('menolak pemanggilan deleteBook oleh role non-admin (403 FORBIDDEN)', async () => {
    const deps = createDepsWithAuth(
      { id: 'user-2', email: 'guest@frasa.com' },
      {
        id: 'user-2',
        full_name: 'Pengunjung Biasa',
        avatar_url: null,
        role: 'user' as unknown as 'admin', // Bukan admin!
        is_active: true,
      }
    );

    await assert.rejects(
      async () => {
        await executeDeleteBook('book-1', deps);
      },
      (err: unknown) => {
        return (
          err !== null &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: string }).code === 'FORBIDDEN' &&
          (err as { status: number }).status === 403
        );
      }
    );
  });

  it('mengizinkan togglePublish dan toggleFeatured oleh Admin yang berstatus aktif', async () => {
    const deps = createDepsWithAuth(
      { id: 'admin-1', email: 'admin@frasa.com' },
      {
        id: 'admin-1',
        full_name: 'Admin Sah',
        avatar_url: null,
        role: 'admin',
        is_active: true,
      }
    );

    const pubRes = await executeToggleBookPublished('book-1', true, deps);
    assert.equal(pubRes.ok, true);
    if (pubRes.ok) {
      assert.equal(pubRes.data.isPublished, true);
    }

    const featRes = await executeToggleBookFeatured('book-1', true, deps);
    assert.equal(featRes.ok, true);
    if (featRes.ok) {
      assert.equal(featRes.data.isFeatured, true);
    }
  });

  it('menolak seluruh aksi oleh admin nonaktif (is_active = false)', async () => {
    const deps = createDepsWithAuth(
      { id: 'admin-inactive', email: 'inactive@frasa.com' },
      {
        id: 'admin-inactive',
        full_name: 'Admin Terblokir',
        avatar_url: null,
        role: 'admin',
        is_active: false,
      }
    );

    await assert.rejects(
      async () => {
        await executeCreateBook(dummyFormInput, deps);
      },
      (err: unknown) =>
        Boolean(err && typeof err === 'object' && (err as { code: string }).code === 'FORBIDDEN')
    );

    await assert.rejects(
      async () => {
        await executeDeleteBook('book-1', deps);
      },
      (err: unknown) =>
        Boolean(err && typeof err === 'object' && (err as { code: string }).code === 'FORBIDDEN')
    );

    await assert.rejects(
      async () => {
        await executeToggleBookPublished('book-1', true, deps);
      },
      (err: unknown) =>
        Boolean(err && typeof err === 'object' && (err as { code: string }).code === 'FORBIDDEN')
    );

    await assert.rejects(
      async () => {
        await executeToggleBookFeatured('book-1', true, deps);
      },
      (err: unknown) =>
        Boolean(err && typeof err === 'object' && (err as { code: string }).code === 'FORBIDDEN')
    );
  });

  describe('Static Source Verification for src/actions/book.ts', () => {
    it('memastikan SETIAP fungsi async yang di-export memanggil await requireAdmin() sebagai pernyataan pertama', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const actionFilePath = path.resolve(process.cwd(), 'src/actions/book.ts');
      const content = fs.readFileSync(actionFilePath, 'utf-8');

      // Ambil seluruh fungsi export async function
      const exportAsyncRegex = /export\s+async\s+function\s+([A-Za-z0-9_]+)\s*\([\s\S]*?\)\s*:\s*Promise<[\s\S]*?>\s*\{([\s\S]*?)(?=\nexport|\n\/\*\*|$)/g;
      
      const exportedFunctions: { name: string; body: string }[] = [];
      let match: RegExpExecArray | null;
      while ((match = exportAsyncRegex.exec(content)) !== null) {
        exportedFunctions.push({
          name: match[1],
          body: match[2],
        });
      }

      assert.ok(exportedFunctions.length >= 7, `Harus ada minimal 7 Server Actions yang diuji, ditemukan: ${exportedFunctions.length}`);

      for (const fn of exportedFunctions) {
        // Ambil statement pertama di dalam blok try
        const tryMatch = /try\s*\{([\s\S]*?)(?=\n\s*(?:const|let|if|return|await getRealServiceDeps|const supabase))/g.exec(fn.body);
        assert.ok(tryMatch, `Fungsi ${fn.name} harus memiliki blok try`);
        
        const firstStatements = tryMatch[1].trim();
        assert.ok(
          firstStatements.startsWith('await requireAdmin();'),
          `Fungsi ${fn.name} di src/actions/book.ts WAJIB memanggil 'await requireAdmin();' sebagai statement pertama di dalam blok try! Ditemukan: ${firstStatements.slice(0, 40)}`
        );
      }
    });

    it('kasus negatif: test statis BENAR-BENAR GAGAL bila ada fungsi tanpa requireAdmin()', () => {
      const mockCodeWithoutAuth = `
        export async function vulnerableAction(): Promise<ActionResponse<void>> {
          try {
            const deps = await getRealServiceDeps();
            return await doSomething();
          } catch (e) {
            return handleActionError(e);
          }
        }
      `;

      const exportAsyncRegex = /export\s+async\s+function\s+([A-Za-z0-9_]+)\s*\([\s\S]*?\)\s*:\s*Promise<[\s\S]*?>\s*\{([\s\S]*?)(?=\nexport|\n\/\*\*|$)/g;
      const match = exportAsyncRegex.exec(mockCodeWithoutAuth);
      assert.ok(match, 'Harus mendeteksi fungsi yang diekspor');

      const tryMatch = /try\s*\{([\s\S]*?)(?=\n\s*(?:const|let|if|return|await getRealServiceDeps|const supabase))/g.exec(match[2]);
      assert.ok(tryMatch);
      const firstStatements = tryMatch[1].trim();

      // Pastikan assertion menangkap ketidakhadiran await requireAdmin()
      assert.equal(
        firstStatements.startsWith('await requireAdmin();'),
        false,
        'Harus terdeteksi sebagai TIDAK memanggil requireAdmin()'
      );
    });
  });
});

