import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Validators
import {
  bookFormSchema,
  formatRupiah,
  normalizeWhatsAppNumber,
  formatWhatsAppMessage,
  buildWhatsAppUrl,
  DEFAULT_WA_NUMBER,
} from '../src/validations/book.ts';
import { bannerFormSchema } from '../src/validations/banner.ts';
import { categoryFormSchema, generateSlug, SLUG_REGEX } from '../src/validations/category.ts';
import { contactInquirySchema } from '../src/validations/inquiry.ts';

// Logic & Utils
import { computeBannerStatus } from '../src/lib/banners/status.ts';
import type { Banner } from '../src/types/index.ts';
import { sanitizeBookHtml, sanitizePostHtml } from '../src/lib/sanitizer.ts';
import { getSafeRedirectUrl } from '../src/lib/redirect-validator.ts';
import {
  validateUserProfile,
  validateAdminRole,
  validateSuperAdminRole,
  type RawAuthUser,
  type RawProfile,
  type AuthenticatedUser,
} from '../src/lib/auth/guards.ts';
import { AuthError } from '../src/lib/action-response.ts';

describe('Unit Testing: Logika Kritis & Validasi (Tahap 14 — PRD §17 & §25)', () => {
  // ==========================================================================
  // 1. FORMAT HARGA RUPIAH
  // ==========================================================================
  describe('Format Harga Rupiah (formatRupiah)', () => {
    it('memformat angka normal menjadi mata uang Rupiah standar IDR', () => {
      const formatted = formatRupiah(85000);
      assert.match(formatted, /Rp/);
      assert.match(formatted, /85\.000/);
    });

    it('memformat angka 0 dengan benar', () => {
      const formatted = formatRupiah(0);
      assert.match(formatted, /Rp/);
      assert.match(formatted, /0/);
    });

    it('memformat nilai jutaan dengan pemisah ribuan titik', () => {
      const formatted = formatRupiah(1500000);
      assert.match(formatted, /1\.500\.000/);
    });

    it('memformat angka desimal dibulatkan sesuai standar currency rupiah', () => {
      const formatted = formatRupiah(99999);
      assert.match(formatted, /99\.999/);
    });
  });

  // ==========================================================================
  // 2. UTILITAS SLUG & REGEX
  // ==========================================================================
  describe('Utilitas Slug (generateSlug & SLUG_REGEX)', () => {
    it('mengubah judul buku/kategori kompleks menjadi URL slug yang aman', () => {
      const slug = generateSlug('Menulis Naskah Populer: Dari Ide Menjadi Buku!');
      assert.strictEqual(slug, 'menulis-naskah-populer-dari-ide-menjadi-buku');
      assert.strictEqual(SLUG_REGEX.test(slug), true);
    });

    it('menghilangkan simbol-simbol khusus, tanda baca berlebih, dan spasi', () => {
      const slug = generateSlug('  *** Antologi Puisi & Cerpen #2026 ***  ');
      assert.strictEqual(slug, 'antologi-puisi-cerpen-2026');
      assert.strictEqual(SLUG_REGEX.test(slug), true);
    });

    it('membersihkan karakter aksen dan diakritik Unicode NFD', () => {
      const slug = generateSlug('Café Littéraire & Poésie');
      assert.strictEqual(slug, 'cafe-litteraire-poesie');
      assert.strictEqual(SLUG_REGEX.test(slug), true);
    });

    it('menangani string kosong dan whitespace murni dengan menghasilkan string kosong', () => {
      assert.strictEqual(generateSlug(''), '');
      assert.strictEqual(generateSlug('     '), '');
    });
  });

  // ==========================================================================
  // 3. NORMALISASI WHATSAPP & URL CHECKOUT
  // ==========================================================================
  describe('Normalisasi WhatsApp & Checkout URL', () => {
    it('mengubah nomor lokal berawalan 08 menjadi format internasional 628', () => {
      const normalized = normalizeWhatsAppNumber('081234567890');
      assert.strictEqual(normalized, '6281234567890');
    });

    it('menangani nomor dengan tanda tambah +628...', () => {
      const normalized = normalizeWhatsAppNumber('+6281234567890');
      assert.strictEqual(normalized, '6281234567890');
    });

    it('membersihkan spasi, strip, dan karakter non-digit', () => {
      const normalized = normalizeWhatsAppNumber('  +62 812-3456-7890  ');
      assert.strictEqual(normalized, '6281234567890');
    });

    it('mengembalikan nomor default jika input kosong atau null', () => {
      assert.strictEqual(normalizeWhatsAppNumber(''), DEFAULT_WA_NUMBER);
      assert.strictEqual(normalizeWhatsAppNumber(null), DEFAULT_WA_NUMBER);
      assert.strictEqual(normalizeWhatsAppNumber(undefined), DEFAULT_WA_NUMBER);
    });

    it('membentuk pesan template WhatsApp berisi judul buku dan harga', () => {
      const message = formatWhatsAppMessage(null, 'Hujan Bulan Juni', 75000);
      assert.match(message, /Halo Frasa Klausa Media/);
      assert.match(message, /Hujan Bulan Juni/);
      assert.match(message, /75\.000/);
    });

    it('membangun link URL wa.me lengkap dengan query encode yang aman', () => {
      const url = buildWhatsAppUrl('6281234567890', null, 'Buku Pintar', 50000);
      assert.ok(url.startsWith('https://wa.me/6281234567890?text='));
      assert.ok(url.includes(encodeURIComponent('Buku Pintar')));
    });
  });

  // ==========================================================================
  // 4. LOGIKA BANNER AKTIF & JADWAL
  // ==========================================================================
  describe('Logika Banner Aktif & Jadwal (computeBannerStatus)', () => {
    const dummyBanner = (overrides: Partial<Banner>): Banner => ({
      id: 'b-1',
      message: 'Promo Hari Ini',
      link_url: 'https://shopee.co.id/frasaklausamedia',
      link_label: 'Beli Sekarang',
      starts_at: '2026-10-01T00:00:00Z',
      ends_at: '2026-10-31T23:59:59Z',
      is_active: true,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
      ...overrides,
    });

    it('mengembalikan "active_now" jika banner aktif dan waktu sekarang berada di antara starts_at dan ends_at', () => {
      const banner = dummyBanner({});
      const now = new Date('2026-10-20T10:00:00Z');
      assert.strictEqual(computeBannerStatus(banner, now), 'active_now');
    });

    it('mengembalikan "inactive" jika banner di-toggle nonaktif (is_active: false) meski dalam jadwal', () => {
      const banner = dummyBanner({ is_active: false });
      const now = new Date('2026-10-20T10:00:00Z');
      assert.strictEqual(computeBannerStatus(banner, now), 'inactive');
    });

    it('mengembalikan "upcoming" jika jadwal banner belum dimulai (starts_at di masa depan)', () => {
      const banner = dummyBanner({
        starts_at: '2026-11-01T00:00:00Z',
        ends_at: '2026-11-15T23:59:59Z',
      });
      const now = new Date('2026-10-20T10:00:00Z');
      assert.strictEqual(computeBannerStatus(banner, now), 'upcoming');
    });

    it('mengembalikan "expired" jika jadwal banner sudah lewat (ends_at di masa lalu)', () => {
      const banner = dummyBanner({
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-10-15T23:59:59Z',
      });
      const now = new Date('2026-10-20T10:00:00Z');
      assert.strictEqual(computeBannerStatus(banner, now), 'expired');
    });
  });

  // ==========================================================================
  // 5. SANITASI HTML & XSS DEFENSE
  // ==========================================================================
  describe('Sanitasi HTML (sanitizeBookHtml & sanitizePostHtml)', () => {
    it('membersihkan tag <script> dan event handler jahat', () => {
      const dirty = '<p>Halo dunia</p><script>alert("xss")</script><img src="x" onerror="alert(1)">';
      const clean = sanitizeBookHtml(dirty);
      assert.ok(!clean.includes('<script>'));
      assert.ok(!clean.includes('onerror'));
      assert.ok(clean.includes('<p>Halo dunia</p>'));
    });

    it('membersihkan skema javascript: pada tautan link', () => {
      const dirty = '<a href="javascript:stealCookie()">Klik Disini</a>';
      const clean = sanitizeBookHtml(dirty);
      assert.ok(!clean.includes('javascript:'));
    });

    it('mempertahankan elemen format kaya artikel yang sah pada blog (h2-h4, blockquote, strong, em, img yang aman)', () => {
      const safeArticle = '<h2>Subjudul</h2><p>Ini adalah <strong>naskah</strong> penting.</p><blockquote>Kutipan</blockquote><img src="https://images.unsplash.com/photo-1" alt="Foto Buku" loading="lazy" />';
      const clean = sanitizePostHtml(safeArticle);
      assert.ok(clean.includes('<h2>Subjudul</h2>'));
      assert.ok(clean.includes('<strong>naskah</strong>'));
      assert.ok(clean.includes('loading="lazy"'));
    });
  });

  // ==========================================================================
  // 6. UTILITAS REDIRECT AMAN
  // ==========================================================================
  describe('Utilitas Redirect Aman (getSafeRedirectUrl)', () => {
    it('mengizinkan path internal yang valid diawali tanda slash /', () => {
      assert.strictEqual(getSafeRedirectUrl('/admin/books'), '/admin/books');
      assert.strictEqual(getSafeRedirectUrl('/admin/categories?page=2'), '/admin/categories?page=2');
    });

    it('menolak open redirect domain eksternal dengan fallback ke defaultPath', () => {
      assert.strictEqual(getSafeRedirectUrl('https://evil-phishing.com/admin', '/admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl('http://attacker.com', '/admin'), '/admin');
    });

    it('menolak skema protokol relatif // (contoh //evil.com)', () => {
      assert.strictEqual(getSafeRedirectUrl('//evil.com/admin', '/admin'), '/admin');
    });

    it('menolak skema javascript: atau data:', () => {
      assert.strictEqual(getSafeRedirectUrl('javascript:alert(1)', '/admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl('data:text/html,...', '/admin'), '/admin');
    });

    it('menggunakan defaultPath jika input kosong, null, atau undefined', () => {
      assert.strictEqual(getSafeRedirectUrl('', '/admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl(null, '/admin'), '/admin');
      assert.strictEqual(getSafeRedirectUrl(undefined, '/admin'), '/admin');
    });
  });

  // ==========================================================================
  // 7. HELPER AUTHORIZATION GUARDS
  // ==========================================================================
  describe('Helper Authorization Guards', () => {
    const rawAuth: RawAuthUser = {
      id: 'usr-100',
      email: 'editor@frasaklausamedia.com',
    };

    it('validateUserProfile memvalidasi pengguna aktif dengan profil valid', () => {
      const profile: RawProfile = {
        id: 'usr-100',
        full_name: 'Editor Ahli',
        avatar_url: null,
        role: 'admin',
        is_active: true,
      };

      const user = validateUserProfile(rawAuth, profile);
      assert.strictEqual(user.id, 'usr-100');
      assert.strictEqual(user.role, 'admin');
      assert.strictEqual(user.isActive, true);
    });

    it('validateUserProfile melempar 403 jika pengguna tidak aktif (is_active: false)', () => {
      const inactiveProfile: RawProfile = {
        id: 'usr-100',
        full_name: 'Eks Editor',
        avatar_url: null,
        role: 'admin',
        is_active: false,
      };

      assert.throws(
        () => validateUserProfile(rawAuth, inactiveProfile),
        (err: unknown) => {
          const authErr = err as AuthError;
          return authErr.status === 403;
        }
      );
    });

    it('validateAdminRole meloloskan peran admin dan super_admin', () => {
      const adminUser: AuthenticatedUser = {
        id: 'u1',
        email: 'adm@mail.com',
        fullName: 'Admin',
        avatarUrl: null,
        role: 'admin',
        isActive: true,
      };
      const superAdminUser: AuthenticatedUser = {
        id: 'u2',
        email: 'super@mail.com',
        fullName: 'Super',
        avatarUrl: null,
        role: 'super_admin',
        isActive: true,
      };

      assert.strictEqual(validateAdminRole(adminUser).role, 'admin');
      assert.strictEqual(validateAdminRole(superAdminUser).role, 'super_admin');
    });

    it('validateSuperAdminRole meloloskan super_admin namun menolak admin biasa dengan 403 FORBIDDEN', () => {
      const adminUser: AuthenticatedUser = {
        id: 'u1',
        email: 'adm@mail.com',
        fullName: 'Admin',
        avatarUrl: null,
        role: 'admin',
        isActive: true,
      };
      const superAdminUser: AuthenticatedUser = {
        id: 'u2',
        email: 'super@mail.com',
        fullName: 'Super',
        avatarUrl: null,
        role: 'super_admin',
        isActive: true,
      };

      assert.strictEqual(validateSuperAdminRole(superAdminUser).role, 'super_admin');

      assert.throws(
        () => validateSuperAdminRole(adminUser),
        (err: unknown) => {
          const authErr = err as AuthError;
          return authErr.status === 403 && authErr.code === 'FORBIDDEN';
        }
      );
    });
  });

  // ==========================================================================
  // 8. VALIDATOR ZOD SCHEMA (BUKU, BANNER, KATEGORI, KONTAK)
  // ==========================================================================
  describe('Validator Zod Schemas', () => {
    it('categoryFormSchema menerima input kategori valid dan menolak nama kosong', () => {
      const valid = categoryFormSchema.parse({
        name: 'Novel Fiksi',
        slug: 'novel-fiksi',
        description: 'Kumpulan novel sastra dan fiksi',
      });
      assert.strictEqual(valid.name, 'Novel Fiksi');

      assert.throws(() => {
        categoryFormSchema.parse({
          name: '',
          slug: 'novel-fiksi',
        });
      });
    });

    it('bannerFormSchema memvalidasi teks, tautan, jadwal tanggal dengan benar', () => {
      const valid = bannerFormSchema.parse({
        message: 'Diskon Akhir Tahun 50% Buku Terpilih!',
        link_url: 'https://shopee.co.id/frasaklausamedia',
        is_active: true,
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-10-31T23:59:59Z',
      });
      assert.strictEqual(valid.is_active, true);
      assert.strictEqual(valid.message, 'Diskon Akhir Tahun 50% Buku Terpilih!');
    });

    it('bannerFormSchema menolak tautan link tidak valid', () => {
      assert.throws(() => {
        bannerFormSchema.parse({
          message: 'Promo Spesial',
          link_url: 'bukan-url-valid',
          starts_at: '2026-10-01T00:00:00Z',
          ends_at: '2026-10-31T23:59:59Z',
          is_active: true,
        });
      });
    });

    it('contactInquirySchema memvalidasi nama, email, subjek, pesan, dan honeypot', () => {
      const valid = contactInquirySchema.parse({
        name: 'Siti Sarah',
        email: 'siti@example.com',
        phone: '08123456789',
        subject: 'Tanya Penerbitan',
        message: 'Bagaimana cara menerbitkan buku antologi cerpen?',
        hp_field: '',
      });
      assert.strictEqual(valid.name, 'Siti Sarah');

      // Gagal jika email tidak valid
      assert.throws(() => {
        contactInquirySchema.parse({
          name: 'Siti',
          email: 'invalid-email',
          subject: 'Tanya',
          message: 'Pesan',
        });
      });
    });

    it('bookFormSchema memvalidasi judul, harga reguler, tahun terbit, dan nomor WhatsApp', () => {
      const valid = bookFormSchema.parse({
        title: 'Filosofi Hidup Bahagia',
        slug: 'filosofi-hidup-bahagia',
        category_id: 'c1234567-89ab-cdef-0123-456789abcdef',
        author: 'Dewi Lestari',
        publisher: 'Frasa Klausa Media',
        publish_year: 2026,
        page_count: 240,
        price_regular: 95000,
        is_published: true,
        is_featured: false,
        whatsapp_number: '081234567890',
        cover_url: null,
        gallery: [],
        related_book_ids: [],
      });
      assert.strictEqual(valid.title, 'Filosofi Hidup Bahagia');
      assert.strictEqual(valid.price_regular, 95000);
    });
  });
});
