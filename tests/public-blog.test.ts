import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  publicBlogQuerySchema,
  calculateReadingTimeMinutes,
  formatReadingTime,
} from '../src/validations/post.ts';
import { sanitizePostHtml } from '../src/lib/sanitizer.ts';

describe('Tahap 11: Public Blog & Typography Suite (PRD §6.3.5 & US-06)', () => {
  describe('1. Skema Query URL Blog Publik (publicBlogQuerySchema)', () => {
    test('memproses query default tanpa parameter dengan nilai fallback yang sah', () => {
      const parsed = publicBlogQuerySchema.parse({});
      assert.strictEqual(parsed.page, 1);
      assert.strictEqual(parsed.pageSize, 9);
      assert.strictEqual(parsed.q, '');
      assert.strictEqual(parsed.kategori, undefined);
      assert.strictEqual(parsed.sort, 'published_at_desc');
    });

    test('memproses parameter kategori baik dari kunci "kategori" maupun "category"', () => {
      const withKategori = publicBlogQuerySchema.parse({ kategori: 'sastra-klasik' });
      assert.strictEqual(withKategori.kategori, 'sastra-klasik');

      const withCategory = publicBlogQuerySchema.parse({ category: 'tips-menulis' });
      assert.strictEqual(withCategory.kategori, 'tips-menulis');
    });

    test('menormalisasi kategori bernilai "all" atau kosong menjadi undefined', () => {
      const withAllLower = publicBlogQuerySchema.parse({ kategori: 'all' });
      assert.strictEqual(withAllLower.kategori, undefined);

      const withAllUpper = publicBlogQuerySchema.parse({ kategori: 'ALL' });
      assert.strictEqual(withAllUpper.kategori, undefined);

      const withCategoryAll = publicBlogQuerySchema.parse({ category: 'all' });
      assert.strictEqual(withCategoryAll.kategori, undefined);

      const withSpaces = publicBlogQuerySchema.parse({ kategori: '   ' });
      assert.strictEqual(withSpaces.kategori, undefined);
    });

    test('memproses parameter kategori bertipe UUID dengan benar', () => {
      const uuid = 'a1b2c3d4-e5f6-4a1b-8c2d-1234567890ab';
      const parsed = publicBlogQuerySchema.parse({ kategori: uuid });
      assert.strictEqual(parsed.kategori, uuid);
    });

    test('membatasi query pencarian q maksimal 100 karakter dan membersihkan spasi', () => {
      const longQuery = '  ' + 'karya sastra '.repeat(20) + '  ';
      const parsed = publicBlogQuerySchema.parse({ q: longQuery });
      assert.strictEqual(parsed.q.length <= 100, true);
      assert.strictEqual(parsed.q.startsWith(' '), false);
    });

    test('memvalidasi sorting yang diizinkan dan fallback untuk nilai sembarang', () => {
      const validSort = publicBlogQuerySchema.parse({ sort: 'title_asc' });
      assert.strictEqual(validSort.sort, 'title_asc');

      const illegalSort = publicBlogQuerySchema.parse({
        sort: 'hacked_sort; DROP TABLE posts;' as unknown as 'title_asc',
      });
      assert.strictEqual(illegalSort.sort, 'published_at_desc');
    });

    test('memvalidasi page size agar hanya menerima opsi yang sah (6, 9, 12, 24)', () => {
      const validPageSize = publicBlogQuerySchema.parse({ pageSize: '12' });
      assert.strictEqual(validPageSize.pageSize, 12);

      const invalidPageSize = publicBlogQuerySchema.parse({ pageSize: '9999' });
      assert.strictEqual(invalidPageSize.pageSize, 9);
    });
  });

  describe('2. Perhitungan Estimasi Waktu Baca (Read Time)', () => {
    test('menghitung waktu baca minimal 1 menit untuk konten kosong atau pendek', () => {
      assert.strictEqual(calculateReadingTimeMinutes(''), 1);
      assert.strictEqual(calculateReadingTimeMinutes(null), 1);
      assert.strictEqual(calculateReadingTimeMinutes('<p>Halo dunia literasi.</p>'), 1);
    });

    test('menghitung waktu baca sesuai kepadatan 200 kata per menit (wpm)', () => {
      // Buat 450 kata
      const words = Array.from({ length: 450 }, (_, i) => `kata${i}`).join(' ');
      const html = `<div><p>${words}</p></div>`;
      // 450 / 200 = 2.25 -> ceil = 3 menit
      assert.strictEqual(calculateReadingTimeMinutes(html), 3);
    });

    test('formatReadingTime memformat teks berbahasa Indonesia dengan benar', () => {
      assert.strictEqual(formatReadingTime(1), '1 menit baca');
      assert.strictEqual(formatReadingTime(5), '5 menit baca');
    });
  });

  describe('3. Sanitasi Konten HTML Artikel Blog (Tailwind Prose XSS Protection)', () => {
    test('membersihkan tag script berbahaya dan atribut onload/onerror', () => {
      const dirty = `
        <h2>Judul Bab</h2>
        <p>Teks narasi artikel.</p>
        <script>alert("XSS")</script>
        <img src="https://images.unsplash.com/photo.jpg" onerror="alert(1)" />
      `;
      const clean = sanitizePostHtml(dirty);

      assert.strictEqual(clean.includes('<script>'), false);
      assert.strictEqual(clean.includes('onerror'), false);
      assert.strictEqual(clean.includes('<h2>Judul Bab</h2>'), true);
      assert.strictEqual(clean.includes('<img src="https://images.unsplash.com/photo.jpg"'), true);
      assert.strictEqual(clean.includes('loading="lazy"'), true);
    });

    test('memaksa rel="noopener noreferrer" pada seluruh tautan eksternal', () => {
      const html = '<p><a href="https://contoh.com" target="_blank">Sumber Rujukan</a></p>';
      const clean = sanitizePostHtml(html);
      assert.strictEqual(clean.includes('rel="noopener noreferrer"'), true);
    });
  });
});
