import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  bannerFormSchema,
  bannerLinkSchema,
  combineWibToUtc,
  splitUtcToWib,
  formatWibDateTime,
} from '../src/validations/banner.ts';

describe('Banner Validations Suite (Tahap 7 - PRD §6.2.B & §15.4)', () => {
  const validStartsAt = '2026-10-25T02:00:00.000Z'; // 09:00 WIB
  const validEndsAt = '2026-10-30T16:59:59.000Z'; // 23:59 WIB

  describe('1. Validasi Semantik Jadwal (starts_at < ends_at)', () => {
    it('menerima rentang jadwal yang valid di mana waktu mulai lebih awal dari waktu selesai', () => {
      const validPayload = {
        message: 'Promo Spesial Peluncuran Buku Baru Diskon 20%!',
        link_url: '/buku/jejak-sunyi',
        starts_at: validStartsAt,
        ends_at: validEndsAt,
        is_active: true,
      };

      const result = bannerFormSchema.safeParse(validPayload);
      assert.strictEqual(result.success, true);
    });

    it('menolak jadwal saat starts_at identik atau sama persis dengan ends_at', () => {
      const equalPayload = {
        message: 'Promo Flash Sale 0 Detik',
        link_url: '/katalog',
        starts_at: '2026-10-25T10:00:00.000Z',
        ends_at: '2026-10-25T10:00:00.000Z',
        is_active: true,
      };

      const result = bannerFormSchema.safeParse(equalPayload);
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const error = result.error.errors.find((e) => e.path.includes('ends_at'));
        assert.ok(error, 'Wajib menghasilkan error pada field ends_at');
        assert.match(error.message, /lebih besar daripada waktu mulai/i);
      }
    });

    it('menolak jadwal saat starts_at lebih akhir daripada ends_at (terbalik)', () => {
      const invertedPayload = {
        message: 'Promo Waktu Terbalik',
        link_url: '/blog/tips-menulis',
        starts_at: '2026-10-30T10:00:00.000Z',
        ends_at: '2026-10-25T10:00:00.000Z',
        is_active: true,
      };

      const result = bannerFormSchema.safeParse(invertedPayload);
      assert.strictEqual(result.success, false);
      if (!result.success) {
        const error = result.error.errors.find((e) => e.path.includes('ends_at'));
        assert.ok(error);
        assert.match(error.message, /lebih besar daripada waktu mulai/i);
      }
    });

    it('menolak string tanggal yang tidak valid atau rusak', () => {
      const invalidDatePayload = {
        message: 'Promo Tanggal Rusak',
        starts_at: 'tanggal-asal',
        ends_at: validEndsAt,
        is_active: true,
      };

      const result = bannerFormSchema.safeParse(invalidDatePayload);
      assert.strictEqual(result.success, false);
    });
  });

  describe('2. Validasi Pesan Banner (Panjang & Plain Text Tanpa HTML)', () => {
    it('menerima pesan teks polos dengan panjang yang sesuai (3 s.d. 200 karakter)', () => {
      const result = bannerFormSchema.safeParse({
        message: 'Buku terbaru Frasa Klausa Media sudah dapat dipesan via Shopee!',
        starts_at: validStartsAt,
        ends_at: validEndsAt,
        is_active: true,
      });

      assert.strictEqual(result.success, true);
    });

    it('menolak pesan yang terlalu pendek (< 3 karakter)', () => {
      const result = bannerFormSchema.safeParse({
        message: 'Hi',
        starts_at: validStartsAt,
        ends_at: validEndsAt,
        is_active: true,
      });

      assert.strictEqual(result.success, false);
    });

    it('menolak pesan yang melebihi batas maksimal 200 karakter', () => {
      const result = bannerFormSchema.safeParse({
        message: 'A'.repeat(201),
        starts_at: validStartsAt,
        ends_at: validEndsAt,
        is_active: true,
      });

      assert.strictEqual(result.success, false);
    });

    it('menolak pesan yang menyisipkan tag HTML mentah (script, b, div)', () => {
      const payloadsWithHtml = [
        '<b>Promo Diskon!</b> Klik di sini.',
        'Promo hemat <script>alert(1)</script>',
        'Diskon besar <img src=x onerror=alert(1)>',
      ];

      for (const msg of payloadsWithHtml) {
        const result = bannerFormSchema.safeParse({
          message: msg,
          starts_at: validStartsAt,
          ends_at: validEndsAt,
          is_active: true,
        });

        assert.strictEqual(result.success, false, `Seharusnya menolak pesan: "${msg}"`);
        if (!result.success) {
          const error = result.error.errors.find((e) => e.path.includes('message'));
          assert.ok(error);
          assert.match(error.message, /teks polos tanpa tag HTML/i);
        }
      }
    });
  });

  describe('3. Validasi Allowlist Tautan Tujuan (link_url)', () => {
    it('mengizinkan path internal terdaftar: /buku/[slug], /blog/[slug], /katalog, /kontak', () => {
      const validInternalLinks = [
        '/buku/jejak-sunyi',
        '/buku/senja-di-kota-tua',
        '/blog/esai-sastra-kontemporer',
        '/katalog',
        '/blog',
        '/tentang-kami',
        '/kontak',
      ];

      for (const link of validInternalLinks) {
        const result = bannerLinkSchema.safeParse(link);
        assert.strictEqual(result.success, true, `Seharusnya mengizinkan path: ${link}`);
      }
    });

    it('mengizinkan URL eksternal dengan protokol https:// aman', () => {
      const validExternalLinks = [
        'https://shopee.co.id/frasaklausamedia',
        'https://tokopedia.com/frasaklausamedia',
        'https://instagram.com/frasaklausamedia',
        'https://contoh.com/promo/literasi?diskon=15',
      ];

      for (const link of validExternalLinks) {
        const result = bannerLinkSchema.safeParse(link);
        assert.strictEqual(result.success, true, `Seharusnya mengizinkan URL https: ${link}`);
      }
    });

    it('mengizinkan nilai kosong / null / undefined (tautan opsional)', () => {
      assert.strictEqual(bannerLinkSchema.safeParse('').success, true);
      assert.strictEqual(bannerLinkSchema.safeParse(null).success, true);
      assert.strictEqual(bannerLinkSchema.safeParse(undefined).success, true);
    });

    it('menolak protokol tidak aman (http://) dan berbahaya (javascript:, data:)', () => {
      const maliciousLinks = [
        'http://insecure-site.com/promo',
        'javascript:alert(document.cookie)',
        'data:text/html,<script>alert(1)</script>',
        '//attacker.com/bypass',
      ];

      for (const link of maliciousLinks) {
        const result = bannerLinkSchema.safeParse(link);
        assert.strictEqual(result.success, false, `Seharusnya menolak tautan berbahaya: ${link}`);
      }
    });

    it('menolak rute internal yang tidak diizinkan (misal: /admin/users, /api/auth)', () => {
      const disallowedInternalLinks = [
        '/admin/users',
        '/admin/settings',
        '/api/keep-alive',
        '/login',
      ];

      for (const link of disallowedInternalLinks) {
        const result = bannerLinkSchema.safeParse(link);
        assert.strictEqual(result.success, false, `Seharusnya menolak rute admin internal: ${link}`);
      }
    });
  });

  describe('4. Utilitas Konversi Waktu (WIB <-> UTC)', () => {
    it('combineWibToUtc mengonversi tanggal dan jam WIB ke ISO string UTC (+7 jam)', () => {
      // 2026-10-25 jam 14:00 WIB seharusnya 2026-10-25 07:00:00 UTC
      const utcIso = combineWibToUtc('2026-10-25', '14:00');
      assert.strictEqual(utcIso, '2026-10-25T07:00:00.000Z');
    });

    it('splitUtcToWib memecah UTC ISO ke tanggal dan jam WIB secara presisi', () => {
      const utcIso = '2026-10-25T07:00:00.000Z';
      const wib = splitUtcToWib(utcIso);

      assert.strictEqual(wib.dateString, '2026-10-25');
      assert.strictEqual(wib.timeString, '14:00');
      assert.match(wib.formattedWib, /25 Okt 2026.*14[:.]00 WIB/);
    });

    it('formatWibDateTime memformat tanggal dengan zona waktu Asia/Jakarta', () => {
      const utcIso = '2026-10-25T02:30:00.000Z'; // 09:30 WIB
      const formatted = formatWibDateTime(utcIso);
      assert.match(formatted, /09[:.]30 WIB/);
    });
  });
});
