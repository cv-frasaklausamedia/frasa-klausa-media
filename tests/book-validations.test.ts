import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIsbn,
  isValidIsbn10,
  isValidIsbn13,
  isValidIsbn,
  normalizeWhatsAppNumber,
  formatWhatsAppMessage,
  buildWhatsAppUrl,
  isValidShopeeUrl,
  isValidTokopediaUrl,
  extractBooksStoragePath,
  validateCleanupPaths,
  bookFormSchema,
  bookQuerySchema,
  DEFAULT_WA_NUMBER,
} from '../src/validations/book.ts';

describe('Book Validations Suite (Fase 1)', () => {
  // --------------------------------------------------------------------------
  // 1. UJI ISBN-10 & ISBN-13
  // --------------------------------------------------------------------------
  describe('ISBN-10 & ISBN-13 Checksum Validation', () => {
    it('normalizeIsbn membuang spasi, tanda hubung, dan mengubah ke huruf besar', () => {
      assert.equal(normalizeIsbn('0-306-40615-2'), '0306406152');
      assert.equal(normalizeIsbn(' 0 8044 2957 x '), '080442957X');
      assert.equal(normalizeIsbn(''), '');
      assert.equal(normalizeIsbn(null), '');
    });

    it('isValidIsbn10 memvalidasi ISBN-10 yang sah', () => {
      // 0-306-40615-2 (valid)
      assert.equal(isValidIsbn10('0306406152'), true);
      assert.equal(isValidIsbn10('0-306-40615-2'), true);

      // Checksum dengan 'X' (080442957X)
      assert.equal(isValidIsbn10('080442957X'), true);
      assert.equal(isValidIsbn10('0-8044-2957-x'), true); // mixed case 'x'
    });

    it('isValidIsbn10 menolak ISBN-10 dengan checksum salah atau format salah', () => {
      // 0306406153 (digit terakhir salah, seharusnya 2)
      assert.equal(isValidIsbn10('0306406153'), false);
      // Karakter 'X' di posisi bukan terakhir
      assert.equal(isValidIsbn10('08044X9571'), false);
      // Kurang dari 10 digit
      assert.equal(isValidIsbn10('123456789'), false);
    });

    it('isValidIsbn13 memvalidasi ISBN-13 yang sah', () => {
      // 978-0-306-40615-7 (valid)
      assert.equal(isValidIsbn13('9780306406157'), true);
      assert.equal(isValidIsbn13('978-0-306-40615-7'), true);

      // 978-0-13-235088-4 (Clean Code - Robert C. Martin)
      assert.equal(isValidIsbn13('978-0-13-235088-4'), true);
    });

    it('isValidIsbn13 menolak ISBN-13 dengan checksum salah', () => {
      // 9780306406158 (digit terakhir salah, seharusnya 7)
      assert.equal(isValidIsbn13('9780306406158'), false);
      // Mengandung huruf 'X' (ISBN-13 tidak boleh mengandung X)
      assert.equal(isValidIsbn13('978030640615X'), false);
    });

    it('isValidIsbn mengizinkan nilai kosong / null / whitespace (karena opsional)', () => {
      assert.equal(isValidIsbn(''), true);
      assert.equal(isValidIsbn(null), true);
      assert.equal(isValidIsbn('   '), true);
      assert.equal(isValidIsbn('978-0-306-40615-7'), true);
      assert.equal(isValidIsbn('0-306-40615-2'), true);
      assert.equal(isValidIsbn('12345'), false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. UJI NORMALISASI WHATSAPP & BUILDER PESAN
  // --------------------------------------------------------------------------
  describe('WhatsApp Normalization & Message Formatting', () => {
    it('normalizeWhatsAppNumber mengonversi format lokal ke internasional 628...', () => {
      assert.equal(normalizeWhatsAppNumber('0813-8060-4256'), '6281380604256');
      assert.equal(normalizeWhatsAppNumber('+62 813 8060 4256'), '6281380604256');
      assert.equal(normalizeWhatsAppNumber('81380604256'), '6281380604256');
      assert.equal(normalizeWhatsAppNumber('6281380604256'), '6281380604256');
    });

    it('normalizeWhatsAppNumber mengembalikan nomor default jika kosong atau tidak valid', () => {
      assert.equal(normalizeWhatsAppNumber(''), DEFAULT_WA_NUMBER);
      assert.equal(normalizeWhatsAppNumber(null), DEFAULT_WA_NUMBER);
      assert.equal(normalizeWhatsAppNumber('12345'), DEFAULT_WA_NUMBER);
    });

    it('formatWhatsAppMessage mengganti placeholder {judul}, {harga}, dan {url} secara dinamis', () => {
      const template = 'Pesan {judul} URL: {url} harga {harga}. Stok ada?';
      const result = formatWhatsAppMessage(
        template,
        'Laskar Pelangi',
        85000,
        'https://www.frasaklausamedia.com/buku/laskar-pelangi'
      );
      assert.ok(result.includes('Laskar Pelangi'));
      assert.ok(result.includes('85.000'));
      assert.ok(result.includes('https://www.frasaklausamedia.com/buku/laskar-pelangi'));
    });

    it('formatWhatsAppMessage menggunakan default template jika template kosong dan menyertakan URL', () => {
      const result = formatWhatsAppMessage(
        null,
        'Bumi Manusia',
        110000,
        'https://www.frasaklausamedia.com/buku/bumi-manusia'
      );
      assert.ok(result.includes('Bumi Manusia'));
      assert.ok(result.includes('110.000'));
      assert.ok(result.includes('Halo Frasa Klausa Media'));
      assert.ok(result.includes('dengan alamat url: https://www.frasaklausamedia.com/buku/bumi-manusia'));
    });

    it('formatWhatsAppMessage backward-compatibility otomatis menyisipkan URL jika template lama tidak memiliki {url}', () => {
      const legacyTemplate = 'Halo Frasa Klausa Media, saya ingin memesan buku "{judul}" seharga {harga}. Apakah stok masih tersedia?';
      const result = formatWhatsAppMessage(
        legacyTemplate,
        'Jejak Sunyi di Sudut Kota',
        75000,
        'https://www.frasaklausamedia.com/buku/jejak-sunyi-di-sudut-kota'
      );
      assert.ok(result.includes('dengan alamat url: https://www.frasaklausamedia.com/buku/jejak-sunyi-di-sudut-kota'));
      assert.ok(result.includes('seharga Rp'));
    });

    it('buildWhatsAppUrl menghasilkan URL wa.me dengan encoding yang aman menyertakan URL buku', () => {
      const url = buildWhatsAppUrl(
        '081380604256',
        null,
        'Filosofi Teras',
        98000,
        'https://www.frasaklausamedia.com/buku/filosofi-teras'
      );
      assert.ok(url.startsWith('https://wa.me/6281380604256?text='));
      assert.ok(url.includes(encodeURIComponent('Filosofi Teras')));
      assert.ok(url.includes(encodeURIComponent('https://www.frasaklausamedia.com/buku/filosofi-teras')));
    });
  });

  // --------------------------------------------------------------------------
  // 3. UJI ALLOWLIST MARKETPLACE (SHOPEE & TOKOPEDIA)
  // --------------------------------------------------------------------------
  describe('Marketplace Allowlist (Anti-Phishing & Host Spoofing)', () => {
    it('isValidShopeeUrl mengizinkan domain resmi Shopee via HTTPS', () => {
      assert.equal(isValidShopeeUrl('https://shopee.co.id/product/123/456'), true);
      assert.equal(isValidShopeeUrl('https://www.shopee.co.id/buku-novel'), true);
      assert.equal(isValidShopeeUrl('https://shope.ee/xyz123'), true);
      assert.equal(isValidShopeeUrl('https://shp.ee/abc789'), true);
      assert.equal(isValidShopeeUrl('https://mall.shopee.co.id/toko-buku'), true);
      assert.equal(isValidShopeeUrl(''), true); // opsional
      assert.equal(isValidShopeeUrl(null), true);
    });

    it('isValidShopeeUrl menolak non-HTTPS dan domain tiruan (host spoofing)', () => {
      // Non-HTTPS
      assert.equal(isValidShopeeUrl('http://shopee.co.id/product'), false);
      // Domain tiruan berbahaya
      assert.equal(isValidShopeeUrl('https://evilshopee.co.id/product'), false);
      assert.equal(isValidShopeeUrl('https://shopee.co.id.evil.com/product'), false);
      assert.equal(isValidShopeeUrl('https://shope.ee.attacker.net/xyz'), false);
      assert.equal(isValidShopeeUrl('https://google.com'), false);
      assert.equal(isValidShopeeUrl('not-a-url'), false);
    });

    it('isValidTokopediaUrl mengizinkan domain resmi Tokopedia via HTTPS', () => {
      assert.equal(isValidTokopediaUrl('https://tokopedia.com/toko/buku-novel'), true);
      assert.equal(isValidTokopediaUrl('https://www.tokopedia.com/product/123'), true);
      assert.equal(isValidTokopediaUrl('https://tokopedia.link/abc123'), true);
      assert.equal(isValidTokopediaUrl('https://tkp.me/xyz789'), true);
      assert.equal(isValidTokopediaUrl('https://seller.tokopedia.com'), true);
      assert.equal(isValidTokopediaUrl(''), true); // opsional
      assert.equal(isValidTokopediaUrl(null), true);
    });

    it('isValidTokopediaUrl menolak non-HTTPS, domain tidak valid, dan domain tiruan', () => {
      // Non-HTTPS
      assert.equal(isValidTokopediaUrl('http://tokopedia.com/toko'), false);
      // Domain tidak valid (misal: tokope.dia bukan domain resmi yang diizinkan)
      assert.equal(isValidTokopediaUrl('https://tokope.dia/buku'), false);
      // Domain tiruan
      assert.equal(isValidTokopediaUrl('https://eviltokopedia.com/toko'), false);
      assert.equal(isValidTokopediaUrl('https://tokopedia.com.fake.site/toko'), false);
      assert.equal(isValidTokopediaUrl('https://shopee.co.id'), false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. UJI EXTRACT BOOKS STORAGE PATH (PRD §14.5 & §15.8)
  // --------------------------------------------------------------------------
  describe('extractBooksStoragePath Security & Path Verification', () => {
    const validCoverUrl =
      'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg';
    const validGalleryUrl =
      'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/gallery/b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e.webp';

    it('mengekstrak path yang sah dari URL bucket books resmi', () => {
      assert.equal(
        extractBooksStoragePath(validCoverUrl),
        'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg'
      );
      assert.equal(
        extractBooksStoragePath(validGalleryUrl),
        'gallery/b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e.webp'
      );
    });

    it('memverifikasi origin yang cocok jika supabaseUrl disertakan', () => {
      const supabaseUrl = 'https://aieziawkiguwyupgeoei.supabase.co';
      assert.equal(
        extractBooksStoragePath(validCoverUrl, supabaseUrl),
        'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg'
      );

      // Origin berbeda -> ditolak
      const differentOrigin = 'https://other-project.supabase.co';
      assert.equal(extractBooksStoragePath(validCoverUrl, differentOrigin), null);
    });

    it('menolak URL dari bucket lain (misal: avatars atau blog)', () => {
      const avatarUrl =
        'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/avatars/user-id/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg';
      assert.equal(extractBooksStoragePath(avatarUrl), null);

      const blogUrl =
        'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/blog/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg';
      assert.equal(extractBooksStoragePath(blogUrl), null);
    });

    it('menolak URL eksternal (Unsplash, imgur, dll.)', () => {
      assert.equal(extractBooksStoragePath('https://images.unsplash.com/photo-123.jpg'), null);
      assert.equal(extractBooksStoragePath('https://i.imgur.com/xyz123.png'), null);
    });

    it('menolak teknik path traversal (../ atau %2e%2e)', () => {
      const traversalUrl1 =
        'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/../secret.jpg';
      assert.equal(extractBooksStoragePath(traversalUrl1), null);

      const traversalUrl2 =
        'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/%2e%2e/secret.jpg';
      assert.equal(extractBooksStoragePath(traversalUrl2), null);
    });

    it('menolak nama berkas yang bukan UUID', () => {
      const nonUuidUrl =
        'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/my-novel-cover.jpg';
      assert.equal(extractBooksStoragePath(nonUuidUrl), null);
    });

    it('menolak ekstensi yang tidak diizinkan (.svg, .exe, .gif, .html)', () => {
      const svgUrl =
        'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.svg';
      assert.equal(extractBooksStoragePath(svgUrl), null);

      const exeUrl =
        'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.exe';
      assert.equal(extractBooksStoragePath(exeUrl), null);
    });
  });

  // --------------------------------------------------------------------------
  // 5. UJI SKEMA FORM BUKU (HARGA, GALERI, BUKU TERKAIT, SEO)
  // --------------------------------------------------------------------------
  describe('bookFormSchema Full Validation', () => {
    const validBaseData = {
      title: 'Kumpulan Cerpen Klasik',
      slug: 'kumpulan-cerpen-klasik',
      category_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      author: 'Pramoedya Ananta Toer',
      editor: 'Budi Santoso',
      publisher: 'Frasa Klausa Media',
      publish_year: 2024,
      isbn: '978-0-13-235088-4',
      page_count: 240,
      price_regular: 125000,
      price_promo: 99000,
      description: '<p>Deskripsi buku yang menarik.</p>',
      cover_url:
        'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg',
      gallery: [
        {
          image_url:
            'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/books/gallery/b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e.webp',
          alt_text: 'Tampilan punggung buku',
          sort_order: 0,
        },
      ],
      is_featured: true,
      is_published: true,
      shopee_url: 'https://shopee.co.id/frasaklausa/buku-klasik',
      tokopedia_url: 'https://tokopedia.com/frasaklausa/buku-klasik',
      whatsapp_number: '081380604256',
      seo_title: 'Jual Kumpulan Cerpen Klasik',
      seo_description: 'Dapatkan buku kumpulan cerpen klasik terbitan Frasa Klausa Media.',
      related_book_ids: ['b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'],
    };

    it('menerima data form buku yang valid dan lengkap', () => {
      const parsed = bookFormSchema.parse(validBaseData);
      assert.equal(parsed.title, 'Kumpulan Cerpen Klasik');
      assert.equal(parsed.slug, 'kumpulan-cerpen-klasik');
      assert.equal(parsed.price_promo, 99000);
      assert.equal(parsed.isbn, '9780132350884'); // ternormalisasi
      assert.equal(parsed.whatsapp_number, '6281380604256'); // ternormalisasi
    });

    it('menolak jika harga promo >= harga normal', () => {
      const invalidData = {
        ...validBaseData,
        price_regular: 100000,
        price_promo: 120000, // Lebih mahal dari reguler!
      };

      const result = bookFormSchema.safeParse(invalidData);
      assert.equal(result.success, false);
      if (!result.success) {
        const promoError = result.error.issues.find((i) => i.path.includes('price_promo'));
        assert.ok(promoError, 'Harus ada error pada path price_promo');
        assert.equal(promoError?.message, 'Harga promo harus lebih kecil dari harga normal');
      }
    });

    it('menolak jika harga promo == harga normal', () => {
      const invalidData = {
        ...validBaseData,
        price_regular: 100000,
        price_promo: 100000,
      };

      const result = bookFormSchema.safeParse(invalidData);
      assert.equal(result.success, false);
    });

    it('mengizinkan harga promo null atau kosong (tanpa diskon)', () => {
      const dataWithoutPromo = {
        ...validBaseData,
        price_promo: '',
      };

      const parsed = bookFormSchema.parse(dataWithoutPromo);
      assert.equal(parsed.price_promo, null);
    });

    it('menolak harga normal negatif', () => {
      const invalidData = {
        ...validBaseData,
        price_regular: -1000,
      };

      const result = bookFormSchema.safeParse(invalidData);
      assert.equal(result.success, false);
    });

    it('menolak galeri jika alt_text kosong', () => {
      const invalidData = {
        ...validBaseData,
        gallery: [
          {
            image_url: 'https://example.com/gallery1.jpg',
            alt_text: '   ', // whitespace
            sort_order: 0,
          },
        ],
      };

      const result = bookFormSchema.safeParse(invalidData);
      assert.equal(result.success, false);
    });

    it('menolak jika related_book_ids melebihi 5 item', () => {
      const invalidData = {
        ...validBaseData,
        related_book_ids: [
          '00000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000002',
          '00000000-0000-0000-0000-000000000003',
          '00000000-0000-0000-0000-000000000004',
          '00000000-0000-0000-0000-000000000005',
          '00000000-0000-0000-0000-000000000006', // ke-6!
        ],
      };

      const result = bookFormSchema.safeParse(invalidData);
      assert.equal(result.success, false);
    });

    it('menolak cover_url eksternal (https://evil.com/x.png)', () => {
      const invalidData = {
        ...validBaseData,
        cover_url: 'https://evil.com/x.png',
      };
      const result = bookFormSchema.safeParse(invalidData);
      assert.equal(result.success, false);
    });

    it('menolak gallery image_url dari bucket lain (misal: avatars)', () => {
      const invalidData = {
        ...validBaseData,
        gallery: [
          {
            image_url:
              'https://aieziawkiguwyupgeoei.supabase.co/storage/v1/object/public/avatars/covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg',
            alt_text: 'Foto Profil',
            sort_order: 0,
          },
        ],
      };
      const result = bookFormSchema.safeParse(invalidData);
      assert.equal(result.success, false);
    });

    it('menerima cover_url kosong atau null', () => {
      const nullCoverData = {
        ...validBaseData,
        cover_url: null,
      };
      const emptyCoverData = {
        ...validBaseData,
        cover_url: '',
      };
      assert.equal(bookFormSchema.safeParse(nullCoverData).success, true);
      assert.equal(bookFormSchema.safeParse(emptyCoverData).success, true);
      assert.equal(bookFormSchema.parse(emptyCoverData).cover_url, null);
    });
  });

  // --------------------------------------------------------------------------
  // 6. UJI VALIDASI CLEANUP STORAGE PATHS (MURNI & DEFENSIF)
  // --------------------------------------------------------------------------
  describe('validateCleanupPaths Pure Validation', () => {
    it('menolak input yang bukan array (null, undefined, string, object)', () => {
      assert.equal(validateCleanupPaths(null), null);
      assert.equal(validateCleanupPaths(undefined), null);
      assert.equal(validateCleanupPaths('covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg'), null);
      assert.equal(validateCleanupPaths({ path: 'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg' }), null);
    });

    it('menolak jika panjang array melebihi 20 path (misal: 21 path)', () => {
      const paths21 = Array.from(
        { length: 21 },
        (_, i) => `covers/00000000-0000-0000-0000-${String(i).padStart(12, '0')}.jpg`
      );
      assert.equal(validateCleanupPaths(paths21), null);
    });

    it('memfilter dan menolak path dengan teknik path traversal (.. atau %2e)', () => {
      const input = [
        'covers/../secret.jpg',
        'covers/%2e%2e/secret.jpg',
        'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg',
      ];
      const result = validateCleanupPaths(input);
      assert.ok(result);
      assert.equal(result.length, 1);
      assert.equal(result[0], 'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg');
    });

    it('memfilter dan menolak nama berkas yang bukan UUID', () => {
      const input = [
        'covers/novel-cover.jpg',
        'gallery/gambar-123.png',
        'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg',
      ];
      const result = validateCleanupPaths(input);
      assert.ok(result);
      assert.equal(result.length, 1);
      assert.equal(result[0], 'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg');
    });

    it('memfilter dan menolak ekstensi yang tidak diizinkan (.svg, .exe, .gif, .html)', () => {
      const input = [
        'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.svg',
        'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.exe',
        'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg',
      ];
      const result = validateCleanupPaths(input);
      assert.ok(result);
      assert.equal(result.length, 1);
      assert.equal(result[0], 'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg');
    });

    it('memfilter dan menolak path dengan prefix di luar bucket books (misal: avatars/ atau blog/)', () => {
      const input = [
        'avatars/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg',
        'blog/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.png',
        'gallery/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.webp',
      ];
      const result = validateCleanupPaths(input);
      assert.ok(result);
      assert.equal(result.length, 1);
      assert.equal(result[0], 'gallery/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.webp');
    });

    it('menerima dan meloloskan path sah yang memenuhi semua kriteria', () => {
      const validPaths = [
        'covers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg',
        'gallery/00000000-0000-4000-8000-000000000001.png',
        'gallery/11111111-2222-4333-9444-555555555555.webp',
      ];
      const result = validateCleanupPaths(validPaths);
      assert.ok(result);
      assert.equal(result.length, 3);
      assert.deepEqual(result, validPaths);
    });
  });

  // --------------------------------------------------------------------------
  // 5. UJI SKEMA URL QUERY PARAMETER
  // --------------------------------------------------------------------------
  describe('bookQuerySchema Defensive URL Parsing', () => {
    it('memberikan nilai default pada query string kosong', () => {
      const parsed = bookQuerySchema.parse({});
      assert.equal(parsed.page, 1);
      assert.equal(parsed.pageSize, 10);
      assert.equal(parsed.q, '');
      assert.equal(parsed.categoryId, 'all');
      assert.equal(parsed.status, 'all');
      assert.equal(parsed.sort, 'created_at_desc');
    });

    it('menangani input ilegal dengan fallback defensif tanpa error', () => {
      const parsed = bookQuerySchema.parse({
        page: 'invalid-page',
        pageSize: '999', // bukan 10, 25, 50, 100
        status: 'hacker-status',
        sort: 'drop-table',
      });

      assert.equal(parsed.page, 1);
      assert.equal(parsed.pageSize, 10);
      assert.equal(parsed.status, 'all');
      assert.equal(parsed.sort, 'created_at_desc');
    });

    it('mem-parsing parameter yang sah dengan benar', () => {
      const parsed = bookQuerySchema.parse({
        page: '3',
        pageSize: '25',
        q: 'sastra',
        status: 'published',
        sort: 'price_asc',
      });

      assert.equal(parsed.page, 3);
      assert.equal(parsed.pageSize, 25);
      assert.equal(parsed.q, 'sastra');
      assert.equal(parsed.status, 'published');
      assert.equal(parsed.sort, 'price_asc');
    });

    it('mendukung parameter category_id dan sinkron dengan alias categoryId', () => {
      const testUuid = '123e4567-e89b-12d3-a456-426614174000';
      const parsed1 = bookQuerySchema.parse({ category_id: testUuid });
      assert.equal(parsed1.category_id, testUuid);
      assert.equal(parsed1.categoryId, testUuid);

      // Backwards compatibility dengan legacy categoryId
      const parsed2 = bookQuerySchema.parse({ categoryId: testUuid });
      assert.equal(parsed2.category_id, testUuid);
      assert.equal(parsed2.categoryId, testUuid);

      // Normalisasi nilai 'all' atau string kosong
      const parsed3 = bookQuerySchema.parse({ category_id: 'all' });
      assert.equal(parsed3.category_id, 'all');
      assert.equal(parsed3.categoryId, 'all');

      const parsed4 = bookQuerySchema.parse({ category_id: '   ' });
      assert.equal(parsed4.category_id, 'all');
      assert.equal(parsed4.categoryId, 'all');
    });

    it('mendukung alias limit sebagai fallback pageSize', () => {
      const parsed = bookQuerySchema.parse({ limit: '50' });
      assert.equal(parsed.pageSize, 50);
    });
  });
});
