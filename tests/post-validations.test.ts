import test from 'node:test';
import assert from 'node:assert/strict';

import {
  postFormSchema,
  postQuerySchema,
  calculateReadingTimeMinutes,
  formatReadingTime,
  validateBlogCleanupPaths,
  extractInlineImageUrls,
} from '../src/validations/post.ts';

test('Post Validations Suite (Tahap 6 — CMS Blog PRD §6.2.F & §15.4)', async (t) => {
  const validUuid = '11111111-1111-4111-8111-111111111111';

  const validPostData = {
    title: 'Menyelami Makna Diksi dalam Cerpen Modern',
    slug: 'menyelami-makna-diksi-cerpen-modern',
    excerpt: 'Sebuah tinjauan estetika sastra mengenai pilihan kata dalam cerita pendek Indonesia.',
    content: '<p>Cerita pendek Indonesia kontemporer menghadirkan kekayaan diksi yang memikat pembaca dari berbagai kalangan.</p>',
    cover_url: 'https://example.com/storage/v1/object/public/blog/covers/11111111-1111-4111-8111-111111111111.jpg',
    category_id: validUuid,
    tags: ['sastra', 'cerpen', 'diksi'],
    author_name: 'Pramoedya A. T.',
    status: 'draft' as const,
    published_at: null,
    seo_title: 'Makna Diksi Cerpen Modern',
    seo_description: 'Tinjauan estetika diksi sastra.',
  };

  await t.test('1. Validasi postFormSchema berhasil untuk data artikel yang sah', () => {
    const result = postFormSchema.safeParse(validPostData);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.title, validPostData.title);
      assert.equal(result.data.slug, validPostData.slug);
      assert.equal(result.data.tags.length, 3);
      assert.equal(result.data.status, 'draft');
    }
  });

  await t.test('2. Menolak judul artikel yang terlalu pendek (< 3 karakter) atau terlalu panjang (> 200 karakter)', () => {
    const shortTitle = postFormSchema.safeParse({ ...validPostData, title: 'Hi' });
    assert.equal(shortTitle.success, false);

    const longTitle = postFormSchema.safeParse({
      ...validPostData,
      title: 'A'.repeat(201),
    });
    assert.equal(longTitle.success, false);
  });

  await t.test('3. Menolak slug yang tidak memenuhi format URL ramah SEO (hanya lowercase, angka, dan hyphens)', () => {
    const invalidSlugs = [
      'Judul Dengan Spasi',
      'slug_underscore',
      '-diawali-hyphen',
      'diakhiri-hyphen-',
      'slug--ganda',
      'slug#karakter*khusus',
    ];

    for (const slug of invalidSlugs) {
      const result = postFormSchema.safeParse({ ...validPostData, slug });
      assert.equal(result.success, false, `Slug "${slug}" seharusnya ditolak`);
    }
  });

  await t.test('4. Menolak konten artikel yang terlalu pendek (< 10 karakter)', () => {
    const emptyContent = postFormSchema.safeParse({ ...validPostData, content: '<p></p>' });
    assert.equal(emptyContent.success, false);

    const shortContent = postFormSchema.safeParse({ ...validPostData, content: 'Pendek' });
    assert.equal(shortContent.success, false);
  });

  await t.test('5. Validasi batas jumlah dan panjang tags (maksimal 10 tag, panjang 2–30 karakter, deduplikasi)', () => {
    // Deduplikasi otomatis
    const duplicateTags = postFormSchema.safeParse({
      ...validPostData,
      tags: ['sastra', 'SASTRA', 'cerpen', 'sastra'],
    });
    assert.equal(duplicateTags.success, true);
    if (duplicateTags.success) {
      assert.deepEqual(duplicateTags.data.tags, ['sastra', 'cerpen']);
    }

    // Menolak lebih dari 10 tag
    const elevenTags = postFormSchema.safeParse({
      ...validPostData,
      tags: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11'],
    });
    assert.equal(elevenTags.success, false);

    // Menolak tag dengan karakter spasi
    const invalidTag = postFormSchema.safeParse({
      ...validPostData,
      tags: ['tag spasi'],
    });
    assert.equal(invalidTag.success, false);
  });

  await t.test('6. Mendukung status published dengan published_at tanggal masa depan (publikasi terjadwal)', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const scheduledPost = postFormSchema.safeParse({
      ...validPostData,
      status: 'published',
      published_at: tomorrow,
    });

    assert.equal(scheduledPost.success, true);
    if (scheduledPost.success) {
      assert.equal(scheduledPost.data.status, 'published');
      assert.equal(scheduledPost.data.published_at, tomorrow);
    }
  });

  await t.test('7. Menolak status published dengan format tanggal yang rusak', () => {
    const invalidDate = postFormSchema.safeParse({
      ...validPostData,
      status: 'published',
      published_at: 'bukan-tanggal-valid',
    });
    assert.equal(invalidDate.success, false);
  });

  await t.test('8. Perhitungan waktu baca (calculateReadingTimeMinutes) akurat (±200 kata/menit, minimal 1)', () => {
    // Konten kosong atau sangat pendek -> 1 menit
    assert.equal(calculateReadingTimeMinutes(''), 1);
    assert.equal(calculateReadingTimeMinutes('<p>Halo pembaca.</p>'), 1);

    // 100 kata -> 1 menit
    const hundredWords = Array(100).fill('literasi').join(' ');
    assert.equal(calculateReadingTimeMinutes(`<p>${hundredWords}</p>`), 1);

    // 250 kata -> 2 menit (ceil(250/200) = 2)
    const twoHundredFiftyWords = Array(250).fill('puisi').join(' ');
    assert.equal(calculateReadingTimeMinutes(`<div>${twoHundredFiftyWords}</div>`), 2);

    // 500 kata -> 3 menit (ceil(500/200) = 3)
    const fiveHundredWords = Array(500).fill('buku').join(' ');
    assert.equal(calculateReadingTimeMinutes(fiveHundredWords), 3);

    // Format baca teks
    assert.equal(formatReadingTime(3), '3 menit baca');
  });

  await t.test('9. Ekstraksi URL gambar inline dari HTML (extractInlineImageUrls)', () => {
    const htmlWithImages = `
      <h2>Bab 1</h2>
      <p>Gambar sampul:</p>
      <img src="https://example.com/storage/v1/object/public/blog/inline/aaa.jpg" alt="A" />
      <p>Teks tengah...</p>
      <img src="https://example.com/storage/v1/object/public/blog/inline/bbb.png" />
      <img src="https://example.com/storage/v1/object/public/blog/inline/aaa.jpg" />
    `;

    const extracted = extractInlineImageUrls(htmlWithImages);
    assert.deepEqual(extracted, [
      'https://example.com/storage/v1/object/public/blog/inline/aaa.jpg',
      'https://example.com/storage/v1/object/public/blog/inline/bbb.png',
    ]);
  });

  await t.test('10. Validasi path storage blog dan pencegahan orphan / path traversal', () => {
    const validUuid1 = '11111111-1111-4111-8111-111111111111';
    const validUuid2 = '22222222-2222-4222-8222-222222222222';

    // Path yang sah
    const paths = [`covers/${validUuid1}.jpg`, `inline/${validUuid2}.webp`];
    assert.deepEqual(validateBlogCleanupPaths(paths), paths);

    // Menolak traversal
    assert.equal(validateBlogCleanupPaths([`covers/../${validUuid1}.jpg`]), null);

    // Menolak folder di luar covers/inline
    assert.equal(validateBlogCleanupPaths([`avatars/${validUuid1}.jpg`]), null);

    // Menolak ekstensi non-gambar (misal .exe atau .php)
    assert.equal(validateBlogCleanupPaths([`covers/${validUuid1}.php`]), null);

    // Menolak melebihi 20 path dalam satu panggilan
    const twentyOnePaths = Array.from({ length: 21 }, () => `covers/${validUuid1}.jpg`);
    assert.equal(validateBlogCleanupPaths(twentyOnePaths), null);
  });

  await t.test('11. postQuerySchema menangani input URL kotor secara defensif tanpa crash', () => {
    const badInput = {
      page: '-5',
      pageSize: '999',
      q: '   Pencarian dengan spasi   ',
      category_id: '',
      status: 'hacker-status',
      sort: 'drop-table',
    };

    const parsed = postQuerySchema.parse(badInput);
    assert.equal(parsed.page, 1);
    assert.equal(parsed.pageSize, 10);
    assert.equal(parsed.q, 'Pencarian dengan spasi');
    assert.equal(parsed.category_id, 'all');
    assert.equal(parsed.status, 'all');
    assert.equal(parsed.sort, 'created_at_desc');
  });
});
