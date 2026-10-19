import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateBlogImageDifference,
  cleanupUnusedBlogImagesSafely,
  executeDeletePost,
  executeUploadBlogImage,
} from '../src/lib/posts/service.ts';
import { validateImageMagicBytes } from '../src/validations/post.ts';
import type { PostServiceDeps } from '../src/lib/posts/types.ts';

test('Post Storage Rollback & Orphan Cleanup Suite (Tahap 6 — PRD §14.5 & §15.8)', async (t) => {
  await t.test('1. calculateBlogImageDifference mendeteksi selisih gambar yang dibuang dari cover dan konten', () => {
    const oldCover = 'https://example.com/storage/v1/object/public/blog/covers/c1.jpg';
    const oldContent = `
      <p>Teks</p>
      <img src="https://example.com/storage/v1/object/public/blog/inline/i1.webp" />
      <img src="https://example.com/storage/v1/object/public/blog/inline/i2.png" />
    `;

    const newCover = 'https://example.com/storage/v1/object/public/blog/covers/c2.jpg';
    // i1 tetap ada, i2 dihapus dari konten, i3 baru ditambahkan
    const newContent = `
      <p>Teks</p>
      <img src="https://example.com/storage/v1/object/public/blog/inline/i1.webp" />
      <img src="https://example.com/storage/v1/object/public/blog/inline/i3.webp" />
    `;

    const unused = calculateBlogImageDifference(oldCover, oldContent, newCover, newContent);

    // c1 dan i2 sudah tidak dipakai lagi, sehingga harus masuk daftar pembersihan
    assert.equal(unused.includes(oldCover), true);
    assert.equal(unused.includes('https://example.com/storage/v1/object/public/blog/inline/i2.png'), true);
    // i1 masih dipakai, jadi TIDAK boleh masuk daftar pembersihan
    assert.equal(unused.includes('https://example.com/storage/v1/object/public/blog/inline/i1.webp'), false);
    assert.equal(unused.length, 2);
  });

  await t.test('2. Gambar yang dipindahkan antara cover dan inline content TIDAK ikut terhapus', () => {
    const sharedImg = 'https://example.com/storage/v1/object/public/blog/covers/img-pindah.jpg';

    // Sebelumnya jadi cover, sekarang dipindah ke inline content
    const oldCover = sharedImg;
    const oldContent = '<p>Tanpa gambar</p>';

    const newCover = null;
    const newContent = `<img src="${sharedImg}" />`;

    const unused = calculateBlogImageDifference(oldCover, oldContent, newCover, newContent);
    assert.equal(unused.length, 0, 'Gambar yang dipindah ke konten tidak boleh dihapus');
  });

  await t.test('3. cleanupUnusedBlogImagesSafely TIDAK menghapus gambar jika sedang dipakai artikel lain', async () => {
    const removedPaths: string[] = [];

    const deps: PostServiceDeps = {
      auth: {
        requireAdmin: async () => ({
          id: 'admin-1',
          email: 'admin@frasaklausamedia.com',
          role: 'admin',
          isActive: true,
        }),
      },
      db: {
        checkSlugConflict: async () => false,
        getPostById: async () => null,
        createPost: async () => 'id-1',
        updatePost: async () => 'id-1',
        deletePost: async () => ({ id: 'id-1', coverUrl: null, content: '' }),
        toggleStatus: async () => {},
        isStoragePathInUse: async (path) => {
          // Simulasi: covers/in-use.jpg sedang dipakai artikel lain
          return path.includes('in-use');
        },
      },
      storage: {
        upload: async () => ({ publicUrl: '' }),
        remove: async (paths) => {
          removedPaths.push(...paths);
        },
        getPublicUrl: (p) => `https://example.com/storage/v1/object/public/blog/${p}`,
      },
      revalidate: () => {},
      supabaseUrl: 'https://example.com',
    };

    const urls = [
      'https://example.com/storage/v1/object/public/blog/covers/00000000-0000-4000-8000-000000000001.jpg', // bebas hapus
      'https://example.com/storage/v1/object/public/blog/covers/in-use.jpg', // sedang dipakai -> lindungi
    ];

    await cleanupUnusedBlogImagesSafely(urls, 'current-post-id', deps);

    assert.equal(
      removedPaths.includes('covers/00000000-0000-4000-8000-000000000001.jpg'),
      true
    );
    assert.equal(removedPaths.includes('covers/in-use.jpg'), false);
  });

  await t.test('4. executeDeletePost membersihkan berkas cover dan inline content setelah artikel dihapus', async () => {
    const removedPaths: string[] = [];

    const validUuid1 = '11111111-1111-4111-8111-111111111111';
    const validUuid2 = '22222222-2222-4222-8222-222222222222';

    const deps: PostServiceDeps = {
      auth: {
        requireAdmin: async () => ({
          id: 'admin-1',
          email: 'admin@frasaklausamedia.com',
          role: 'admin',
          isActive: true,
        }),
      },
      db: {
        checkSlugConflict: async () => false,
        getPostById: async () => null,
        createPost: async () => 'id-1',
        updatePost: async () => 'id-1',
        deletePost: async (id) => ({
          id,
          coverUrl: `https://example.com/storage/v1/object/public/blog/covers/${validUuid1}.jpg`,
          content: `<img src="https://example.com/storage/v1/object/public/blog/inline/${validUuid2}.webp" />`,
        }),
        toggleStatus: async () => {},
        isStoragePathInUse: async () => false, // Tidak dipakai siapapun
      },
      storage: {
        upload: async () => ({ publicUrl: '' }),
        remove: async (paths) => {
          removedPaths.push(...paths);
        },
        getPublicUrl: (p) => `https://example.com/storage/v1/object/public/blog/${p}`,
      },
      revalidate: () => {},
      supabaseUrl: 'https://example.com',
    };

    const res = await executeDeletePost('post-to-delete', deps);
    assert.equal(res.ok, true);
    assert.equal(removedPaths.includes(`covers/${validUuid1}.jpg`), true);
    assert.equal(removedPaths.includes(`inline/${validUuid2}.webp`), true);
  });

  await t.test('5. Validasi Magic Bytes gambar blog menolak berkas palsu dan menerima JPEG/PNG/WebP asli', () => {
    // Buffer JPEG asli (minimal 12 bytes): FF D8 FF E0 ...
    const realJpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    const jpegRes = validateImageMagicBytes(realJpeg);
    assert.equal(jpegRes.isValid, true);
    assert.equal(jpegRes.ext, 'jpg');

    // Buffer PNG asli (minimal 12 bytes): 89 50 4E 47 0D 0A 1A 0A ...
    const realPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const pngRes = validateImageMagicBytes(realPng);
    assert.equal(pngRes.isValid, true);
    assert.equal(pngRes.ext, 'png');

    // Berkas teks atau script PHP palsu berkedok .jpg (panjang >= 12)
    const fakeFile = Buffer.from('<?php echo "evil payload"; ?>', 'utf-8');
    const fakeRes = validateImageMagicBytes(fakeFile);
    assert.equal(fakeRes.isValid, false);
  });

  await t.test('6. executeUploadBlogImage menolak berkas yang melebihi batas 5 MB', async () => {
    const deps: PostServiceDeps = {
      auth: {
        requireAdmin: async () => ({
          id: 'admin-1',
          email: 'admin@frasaklausamedia.com',
          role: 'admin',
          isActive: true,
        }),
      },
      db: {} as any,
      storage: {} as any,
      revalidate: () => {},
    };

    // Buffer 6 MB
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024);
    const response = await executeUploadBlogImage('covers', oversizedBuffer, 'besar.jpg', deps);

    assert.equal(response.ok, false);
    if (!response.ok) {
      assert.equal(response.error.status, 400);
      assert.equal(response.error.message.includes('5 MB'), true);
    }
  });
});
