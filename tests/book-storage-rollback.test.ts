import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateImageDifference,
  parseRpcMutationResult,
  executeCreateBook,
  executeUpdateBook,
  type BookServiceDeps,
  type BookDbAdapter,
  type BookStorageAdapter,
} from '../src/lib/books/service.ts';
import {
  validateImageMagicBytes,
  type BookFormInput,
} from '../src/validations/book.ts';

describe('Book Storage & Rollback Suite (Fase 2 - PRD §14.5 & §15.8)', () => {
  // --------------------------------------------------------------------------
  // 1. UJI PENGHITUNGAN SELISIH GAMBAR DI SISI SERVER
  // --------------------------------------------------------------------------
  describe('calculateImageDifference (Pure Function)', () => {
    it('mengidentifikasi gambar lama yang dihapus', () => {
      const oldCover = 'https://supabase.co/covers/1.jpg';
      const oldGallery = [
        'https://supabase.co/gallery/2.jpg',
        'https://supabase.co/gallery/3.jpg',
      ];
      const newCover = 'https://supabase.co/covers/4.jpg'; // cover diganti
      const newGallery = ['https://supabase.co/gallery/2.jpg']; // 3.jpg dihapus

      const unused = calculateImageDifference(oldCover, oldGallery, newCover, newGallery);
      assert.equal(unused.length, 2);
      assert.ok(unused.includes('https://supabase.co/covers/1.jpg'));
      assert.ok(unused.includes('https://supabase.co/gallery/3.jpg'));
      assert.ok(!unused.includes('https://supabase.co/gallery/2.jpg'));
    });

    it('TIDAK menghapus gambar yang dipindahkan antara cover dan galeri', () => {
      // Skenario: gambar cover lama dipindah jadi galeri, dan gambar galeri lama dipindah jadi cover
      const oldCover = 'https://supabase.co/covers/1.jpg';
      const oldGallery = ['https://supabase.co/gallery/2.jpg'];

      const newCover = 'https://supabase.co/gallery/2.jpg'; // dipindah jadi cover
      const newGallery = ['https://supabase.co/covers/1.jpg']; // dipindah jadi galeri

      const unused = calculateImageDifference(oldCover, oldGallery, newCover, newGallery);
      assert.equal(unused.length, 0, 'Gambar yang berpindah posisi tidak boleh dianggap unused');
    });

    it('menangani nilai cover null atau galeri kosong dengan benar', () => {
      const unused = calculateImageDifference(null, [], null, []);
      assert.equal(unused.length, 0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. UJI PARSING HASIL RPC POSTGREST
  // --------------------------------------------------------------------------
  describe('parseRpcMutationResult', () => {
    it('mem-parsing hasil RPC berupa objek tunggal', () => {
      const raw = {
        book_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        unused_image_urls: ['covers/old.jpg', 'gallery/old2.webp'],
      };
      const parsed = parseRpcMutationResult(raw);
      assert.equal(parsed.book_id, 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');
      assert.equal(parsed.unused_image_urls.length, 2);
    });

    it('mem-parsing hasil RPC berupa array bertunggal elemen', () => {
      const raw = [
        {
          book_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          unused_image_urls: ['covers/old.jpg'],
        },
      ];
      const parsed = parseRpcMutationResult(raw);
      assert.equal(parsed.book_id, 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');
      assert.equal(parsed.unused_image_urls.length, 1);
    });

    it('melempar error jika respons RPC null, undefined, atau bukan objek', () => {
      assert.throws(() => parseRpcMutationResult(null), /Hasil mutasi database tidak valid/);
      assert.throws(() => parseRpcMutationResult(undefined), /Hasil mutasi database tidak valid/);
      assert.throws(() => parseRpcMutationResult('string-bukan-objek'), /Hasil mutasi database tidak valid/);
    });

    it('melempar error jika respons RPC tidak memiliki book_id', () => {
      assert.throws(() => parseRpcMutationResult({ foo: 'bar' }), /Respons RPC tidak memuat book_id/);
      assert.throws(() => parseRpcMutationResult([{ no_id: 123 }]), /Respons RPC tidak memuat book_id/);
    });
  });

  // --------------------------------------------------------------------------
  // 3. UJI VALIDATOR MAGIC BYTES BINER ASLI
  // --------------------------------------------------------------------------
  describe('validateImageMagicBytes (Security PRD §14.5 & §15.8)', () => {
    it('mengenali berkas JPEG asli (FF D8 FF)', () => {
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      ]);
      const res = validateImageMagicBytes(jpegBuffer);
      assert.equal(res.isValid, true);
      assert.equal(res.canonicalMime, 'image/jpeg');
      assert.equal(res.ext, 'jpg');
    });

    it('mengenali berkas PNG asli (89 50 4E 47 0D 0A 1A 0A)', () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      const res = validateImageMagicBytes(pngBuffer);
      assert.equal(res.isValid, true);
      assert.equal(res.canonicalMime, 'image/png');
      assert.equal(res.ext, 'png');
    });

    it('mengenali berkas WebP asli (RIFF .... WEBP)', () => {
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]);
      const res = validateImageMagicBytes(webpBuffer);
      assert.equal(res.isValid, true);
      assert.equal(res.canonicalMime, 'image/webp');
      assert.equal(res.ext, 'webp');
    });

    it('menolak berkas palsu (ekstensi gambar tapi isi teks/HTML/script)', () => {
      const fakeBuffer = Buffer.from('<script>alert("hack")</script>');
      const res = validateImageMagicBytes(fakeBuffer);
      assert.equal(res.isValid, false);
      assert.equal(res.canonicalMime, null);
    });
  });

  // --------------------------------------------------------------------------
  // 4. UJI ROLLBACK STORAGE BILA DATABASE GAGAL
  // --------------------------------------------------------------------------
  describe('Storage Rollback on Database Failure', () => {
    const validFormInput: BookFormInput = {
      title: 'Buku Uji Rollback',
      slug: 'buku-uji-rollback',
      category_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      author: 'Penulis Uji',
      publisher: 'Frasa Klausa Media',
      publish_year: 2024,
      page_count: 100,
      price_regular: 50000,
      cover_url:
        'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg',
      gallery: [],
      related_book_ids: [],
    };

    it('server TIDAK menghapus file yang diunggah saat RPC gagal; file tetap milik form dan simpan ulang sukses', async () => {
      const removedFiles: string[] = [];

      const mockStorage: BookStorageAdapter = {
        upload: async () => ({ publicUrl: '' }),
        remove: async (paths) => {
          removedFiles.push(...paths);
        },
        getPublicUrl: (path) => path,
      };

      let attemptCount = 0;
      const mockDb: BookDbAdapter = {
        checkSlugConflict: async () => false,
        upsertAtomic: async () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('Database temporary connection failure');
          }
          return { book_id: 'book-retry-success', unused_image_urls: [] };
        },
        getBookById: async () => null,
        deleteBook: async () => ({ id: '', coverUrl: null, galleryUrls: [] }),
        toggleField: async () => {},
        isStoragePathInUse: async () => false,
      };

      const deps: BookServiceDeps = {
        auth: {
          requireAdmin: async () => ({
            id: 'admin-1',
            email: 'admin@frasa.com',
            role: 'admin',
            isActive: true,
          }),
        },
        db: mockDb,
        storage: mockStorage,
        revalidate: () => {},
      };

      // Percobaan 1: RPC Gagal
      await assert.rejects(
        async () => {
          await executeCreateBook(validFormInput, deps);
        },
        /Database temporary connection failure/
      );

      // Verifikasi: Server TIDAK menghapus file baru di Storage saat error
      assert.equal(removedFiles.length, 0, 'Server tidak boleh menghapus file yang masih dipegang form');

      // Percobaan 2 (Retry): Simpan ulang dengan URL yang sama sukses
      const retryRes = await executeCreateBook(validFormInput, deps);
      assert.equal(retryRes.ok, true);
      if (retryRes.ok) {
        assert.equal(retryRes.data.id, 'book-retry-success');
      }
      assert.equal(removedFiles.length, 0, 'File tetap tersimpan dan tidak dihapus saat simpan sukses');
    });

    it('server TIDAK menghapus file baru saat RPC gagal pada update; simpan ulang dengan URL yang sama sukses', async () => {
      const removedFiles: string[] = [];

      const mockStorage: BookStorageAdapter = {
        upload: async () => ({ publicUrl: '' }),
        remove: async (paths) => {
          removedFiles.push(...paths);
        },
        getPublicUrl: (path) => path,
      };

      let updateAttemptCount = 0;
      const mockDb: BookDbAdapter = {
        checkSlugConflict: async () => false,
        upsertAtomic: async () => {
          updateAttemptCount++;
          if (updateAttemptCount === 1) {
            throw new Error('Database temporary connection failure during update');
          }
          return { book_id: 'book-update-retry-success', unused_image_urls: [] };
        },
        getBookById: async () => null,
        deleteBook: async () => ({ id: '', coverUrl: null, galleryUrls: [] }),
        toggleField: async () => {},
        isStoragePathInUse: async () => false,
      };

      const deps: BookServiceDeps = {
        auth: {
          requireAdmin: async () => ({
            id: 'admin-1',
            email: 'admin@frasa.com',
            role: 'admin',
            isActive: true,
          }),
        },
        db: mockDb,
        storage: mockStorage,
        revalidate: () => {},
      };

      // Percobaan 1: RPC Gagal saat update
      await assert.rejects(
        async () => {
          await executeUpdateBook('book-123', validFormInput, deps);
        },
        /Database temporary connection failure during update/
      );

      // Verifikasi: Server TIDAK memanggil storage remove saat error pada update
      assert.equal(
        removedFiles.length,
        0,
        'Server tidak boleh menghapus file yang masih dipegang form saat update gagal'
      );

      // Percobaan 2 (Retry): Simpan ulang dengan URL yang sama sukses
      const retryRes = await executeUpdateBook('book-123', validFormInput, deps);
      assert.equal(retryRes.ok, true);
      if (retryRes.ok) {
        assert.equal(retryRes.data.id, 'book-update-retry-success');
      }
      assert.equal(removedFiles.length, 0, 'File baru tetap tersimpan dan tidak dihapus saat simpan sukses');
    });

    it('menghapus file lama yang tidak terpakai HANYA SETELAH RPC sukses pada update', async () => {
      const removedFiles: string[] = [];

      const mockStorage: BookStorageAdapter = {
        upload: async () => ({ publicUrl: '' }),
        remove: async (paths) => {
          removedFiles.push(...paths);
        },
        getPublicUrl: (path) => path,
      };

      const mockDb: BookDbAdapter = {
        checkSlugConflict: async () => false,
        upsertAtomic: async () => ({
          book_id: 'book-123',
          unused_image_urls: [
            'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/11111111-1111-4111-a111-111111111111.jpg',
          ],
        }),
        getBookById: async () => null,
        deleteBook: async () => ({ id: '', coverUrl: null, galleryUrls: [] }),
        toggleField: async () => {},
        isStoragePathInUse: async () => false, // Tidak dipakai buku lain
      };

      const deps: BookServiceDeps = {
        auth: {
          requireAdmin: async () => ({
            id: 'admin-1',
            email: 'admin@frasa.com',
            role: 'admin',
            isActive: true,
          }),
        },
        db: mockDb,
        storage: mockStorage,
        revalidate: () => {},
      };

      const res = await executeUpdateBook('book-123', validFormInput, deps);
      assert.equal(res.ok, true);
      if (res.ok) {
        assert.equal(res.data.id, 'book-123');
      }

      // Verifikasi file lama dipanggil untuk dihapus
      assert.equal(removedFiles.length, 1);
      assert.equal(removedFiles[0], 'covers/11111111-1111-4111-a111-111111111111.jpg');
    });

    it('action tetap sukses meskipun penghapusan storage lama gagal (best-effort)', async () => {
      const loggedErrors: string[] = [];

      const mockStorage: BookStorageAdapter = {
        upload: async () => ({ publicUrl: '' }),
        remove: async () => {
          throw new Error('Supabase storage network timeout');
        },
        getPublicUrl: (path) => path,
      };

      const mockDb: BookDbAdapter = {
        checkSlugConflict: async () => false,
        upsertAtomic: async () => ({
          book_id: 'book-123',
          unused_image_urls: [
            'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/11111111-1111-4111-a111-111111111111.jpg',
          ],
        }),
        getBookById: async () => null,
        deleteBook: async () => ({ id: '', coverUrl: null, galleryUrls: [] }),
        toggleField: async () => {},
        isStoragePathInUse: async () => false,
      };

      const deps: BookServiceDeps = {
        auth: {
          requireAdmin: async () => ({
            id: 'admin-1',
            email: 'admin@frasa.com',
            role: 'admin',
            isActive: true,
          }),
        },
        db: mockDb,
        storage: mockStorage,
        revalidate: () => {},
        logger: {
          error: (msg) => loggedErrors.push(msg),
          info: () => {},
        },
      };

      // Action tidak boleh crash meskipun storage remove error
      const res = await executeUpdateBook('book-123', validFormInput, deps);
      assert.equal(res.ok, true);
      assert.equal(loggedErrors.length, 1);
    });

    it('TIDAK menghapus file dari storage jika path tersebut masih dipakai oleh buku lain', async () => {
      const removedFiles: string[] = [];

      const mockStorage: BookStorageAdapter = {
        upload: async () => ({ publicUrl: '' }),
        remove: async (paths) => {
          removedFiles.push(...paths);
        },
        getPublicUrl: (path) => path,
      };

      const mockDb: BookDbAdapter = {
        checkSlugConflict: async () => false,
        upsertAtomic: async () => ({
          book_id: 'book-123',
          unused_image_urls: [
            'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/shared-image-1111-4111-a111-111111111111.jpg',
          ],
        }),
        getBookById: async () => null,
        deleteBook: async () => ({ id: '', coverUrl: null, galleryUrls: [] }),
        toggleField: async () => {},
        // Simulasi: Path ternyata sedang dipakai oleh buku lain!
        isStoragePathInUse: async () => true,
      };

      const deps: BookServiceDeps = {
        auth: {
          requireAdmin: async () => ({
            id: 'admin-1',
            email: 'admin@frasa.com',
            role: 'admin',
            isActive: true,
          }),
        },
        db: mockDb,
        storage: mockStorage,
        revalidate: () => {},
      };

      const res = await executeUpdateBook('book-123', validFormInput, deps);
      assert.equal(res.ok, true);
      // removedFiles harus KOSONG karena isStoragePathInUse = true
      assert.equal(removedFiles.length, 0, 'File yang masih dipakai buku lain tidak boleh dihapus');
    });
  });

  // --------------------------------------------------------------------------
  // 5. UJI SANITASI DESKRIPSI SEBELUM RPC (PRD §15.5 & Item 6)
  // --------------------------------------------------------------------------
  describe('Sanitasi Deskripsi Sebelum RPC (executeCreateBook & executeUpdateBook)', () => {
    const validFormInput: BookFormInput = {
      title: 'Buku Uji Sanitasi',
      slug: 'buku-uji-sanitasi',
      category_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      author: 'Penulis Uji',
      publisher: 'Frasa Klausa Media',
      publish_year: 2024,
      page_count: 100,
      price_regular: 50000,
      cover_url:
        'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg',
      gallery: [],
      related_book_ids: [],
    };

    it('executeCreateBook membersihkan deskripsi HTML berbahaya sebelum memanggil RPC', async () => {
      let rpcPayloadPassed: Record<string, unknown> | null = null;

      const mockDb: BookDbAdapter = {
        checkSlugConflict: async () => false,
        upsertAtomic: async (_id, data) => {
          rpcPayloadPassed = data as unknown as Record<string, unknown>;
          return { book_id: 'book-sanitized-create', unused_image_urls: [] };
        },
        getBookById: async () => null,
        deleteBook: async () => ({ id: '', coverUrl: null, galleryUrls: [] }),
        toggleField: async () => {},
        isStoragePathInUse: async () => false,
      };

      const deps: BookServiceDeps = {
        auth: {
          requireAdmin: async () => ({
            id: 'admin-1',
            email: 'admin@frasa.com',
            role: 'admin',
            isActive: true,
          }),
        },
        db: mockDb,
        storage: {
          upload: async () => ({ publicUrl: '' }),
          remove: async () => {},
          getPublicUrl: (path) => path,
        },
        revalidate: () => {},
      };

      const inputWithXss: BookFormInput = {
        ...validFormInput,
        title: 'Buku XSS Create',
        slug: 'buku-xss-create',
        description: '<p>Sinopsis Buku</p><script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:void(0)">Klik</a>',
      };

      const res = await executeCreateBook(inputWithXss, deps);
      assert.equal(res.ok, true);
      assert.ok(rpcPayloadPassed !== null);
      const sanitizedDesc = (rpcPayloadPassed as Record<string, unknown>).description as string;

      assert.ok(!sanitizedDesc.includes('<script>'), 'Script tag tidak boleh lolos ke RPC');
      assert.ok(!sanitizedDesc.includes('alert(1)'), 'Payload script tidak boleh lolos ke RPC');
      assert.ok(!sanitizedDesc.includes('onerror'), 'Event handler onerror tidak boleh lolos ke RPC');
      assert.ok(!sanitizedDesc.includes('javascript:'), 'Javascript URI tidak boleh lolos ke RPC');
      assert.ok(sanitizedDesc.includes('<p>Sinopsis Buku</p>'), 'Konten yang valid harus tetap dipertahankan');
    });

    it('executeUpdateBook membersihkan deskripsi HTML berbahaya sebelum memanggil RPC', async () => {
      let rpcPayloadPassed: Record<string, unknown> | null = null;

      const mockDb: BookDbAdapter = {
        checkSlugConflict: async () => false,
        upsertAtomic: async (id, data) => {
          void id;
          rpcPayloadPassed = data as unknown as Record<string, unknown>;
          return { book_id: 'book-sanitized-update', unused_image_urls: [] };
        },
        getBookById: async () => null,
        deleteBook: async () => ({ id: '', coverUrl: null, galleryUrls: [] }),
        toggleField: async () => {},
        isStoragePathInUse: async () => false,
      };

      const deps: BookServiceDeps = {
        auth: {
          requireAdmin: async () => ({
            id: 'admin-1',
            email: 'admin@frasa.com',
            role: 'admin',
            isActive: true,
          }),
        },
        db: mockDb,
        storage: {
          upload: async () => ({ publicUrl: '' }),
          remove: async () => {},
          getPublicUrl: (path) => path,
        },
        revalidate: () => {},
      };

      const inputWithXss: BookFormInput = {
        ...validFormInput,
        title: 'Buku XSS Update',
        slug: 'buku-xss-update',
        description: '<h3>Bab 1</h3><script>alert("hacked")</script><p>Paragraf</p>',
      };

      const res = await executeUpdateBook('book-123', inputWithXss, deps);
      assert.equal(res.ok, true);
      assert.ok(rpcPayloadPassed !== null);
      const sanitizedDesc = (rpcPayloadPassed as Record<string, unknown>).description as string;

      assert.ok(!sanitizedDesc.includes('<script>'), 'Script tag tidak boleh lolos ke RPC');
      assert.ok(!sanitizedDesc.includes('hacked'), 'Payload script tidak boleh lolos ke RPC');
      assert.ok(sanitizedDesc.includes('<h3>Bab 1</h3>'));
      assert.ok(sanitizedDesc.includes('<p>Paragraf</p>'));
    });
  });
});

