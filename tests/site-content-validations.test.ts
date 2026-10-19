import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  heroContentSchema,
  aboutContentSchema,
  contactContentSchema,
  socialContentSchema,
  validateSiteCleanupPaths,
  GOOGLE_MAPS_EMBED_REGEX,
} from '../src/validations/site-content.ts';
import {
  DEFAULT_HERO_CONTENT,
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CONTACT_CONTENT,
} from '../src/lib/site-content/defaults.ts';
import { sanitizeSiteNarrativeHtml } from '../src/lib/sanitizer.ts';

describe('Site Content Validations & Defaults Suite (Tahap 7 - PRD §6.2.C, §8, §15.4)', () => {
  describe('1. Skema Hero Section', () => {
    it('menerima payload Hero yang valid dan lengkap', () => {
      const validHero = {
        badge: 'Penerbit Independen',
        headline: 'Mewujudkan Naskah Menjadi Buku Berkualitas',
        subheadline: 'Kami mendampingi para penulis dan merawat literasi dengan standar editorial terbaik.',
        primary_cta_label: 'Katalog Buku',
        primary_cta_url: '/katalog',
        secondary_cta_label: 'Kontak Kami',
        secondary_cta_url: '/kontak',
        cover_image_url: 'https://example.com/cover.jpg',
      };

      const result = heroContentSchema.safeParse(validHero);
      assert.strictEqual(result.success, true);
    });

    it('menolak headline yang terlalu pendek (< 5 karakter)', () => {
      const result = heroContentSchema.safeParse({
        ...DEFAULT_HERO_CONTENT,
        headline: 'Buku',
      });
      assert.strictEqual(result.success, false);
    });

    it('menolak tautan CTA utama yang tidak aman (misal javascript: atau tanpa slash)', () => {
      const result = heroContentSchema.safeParse({
        ...DEFAULT_HERO_CONTENT,
        primary_cta_url: 'javascript:alert(1)',
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('2. Skema Tentang Kami (About)', () => {
    it('menerima payload Tentang Kami dengan daftar misi dinamis', () => {
      const validAbout = {
        title: 'Tentang Penerbit Kami',
        subtitle: 'Rumah bagi Penulis',
        vision: 'Menjadi wadah literasi rujukan nasional.',
        mission: [
          'Kurasi naskah yang ketat dan profesional.',
          'Penerbitan buku berkualitas tinggi.',
        ],
        history: 'Didirikan pada tahun 2024 oleh para pegiat literasi.',
        values: [{ name: 'Integritas', description: 'Menghormati hak cipta.' }],
      };

      const result = aboutContentSchema.safeParse(validAbout);
      assert.strictEqual(result.success, true);
    });

    it('menolak payload jika butir misi kosong ([] / 0 butir)', () => {
      const result = aboutContentSchema.safeParse({
        ...DEFAULT_ABOUT_CONTENT,
        mission: [],
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.errors.some((e) => e.path.includes('mission')));
      }
    });
  });

  describe('3. Skema Kontak & Identitas Resmi (PRD §8)', () => {
    it('memvalidasi nilai default resmi sesuai PRD §8', () => {
      assert.strictEqual(DEFAULT_CONTACT_CONTENT.phone, '0813-8060-4256');
      assert.strictEqual(DEFAULT_CONTACT_CONTENT.whatsapp, '0813-8060-4256');
      assert.strictEqual(DEFAULT_CONTACT_CONTENT.email, 'frasaklausamedia@gmail.com');
      assert.strictEqual(DEFAULT_CONTACT_CONTENT.company_name, 'Frasa Klausa Media');

      const result = contactContentSchema.safeParse(DEFAULT_CONTACT_CONTENT);
      assert.strictEqual(result.success, true);
    });

    it('menolak alamat email dengan format tidak valid', () => {
      const result = contactContentSchema.safeParse({
        ...DEFAULT_CONTACT_CONTENT,
        email: 'bukan-email-valid',
      });
      assert.strictEqual(result.success, false);
    });

    it('memvalidasi format URL Google Maps Embed', () => {
      const validEmbed =
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126920.28639849206!2d106.758849!3d-6.229746';
      assert.strictEqual(GOOGLE_MAPS_EMBED_REGEX.test(validEmbed), true);

      const invalidEmbed = 'https://maps.google.com/bukan-embed';
      assert.strictEqual(GOOGLE_MAPS_EMBED_REGEX.test(invalidEmbed), false);
    });
  });

  describe('4. Skema Media Sosial & Marketplace', () => {
    it('menerima tautan https yang valid untuk semua kanal', () => {
      const validSocial = {
        instagram: 'https://instagram.com/frasaklausamedia',
        facebook: 'https://facebook.com/frasaklausamedia',
        tiktok: 'https://tiktok.com/@frasaklausamedia',
        twitter: 'https://x.com/frasaklausa',
        shopee: 'https://shopee.co.id/frasaklausamedia',
        tokopedia: 'https://tokopedia.com/frasaklausamedia',
        youtube: 'https://youtube.com/@frasaklausamedia',
      };

      const result = socialContentSchema.safeParse(validSocial);
      assert.strictEqual(result.success, true);
    });

    it('menolak URL tidak aman dengan protokol http://', () => {
      const result = socialContentSchema.safeParse({
        instagram: 'http://insecure-instagram.com',
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('5. Sanitasi Narasi Konten Halaman (XSS Prevention)', () => {
    it('membersihkan tag <script> dan event handler berbahaya pada teks narasi', () => {
      const dirtyHtml = '<p>Sejarah kami <script>alert("hacked")</script> berawal dari cinta buku.</p>';
      const clean = sanitizeSiteNarrativeHtml(dirtyHtml);

      assert.doesNotMatch(clean, /<script/i);
      assert.match(clean, /<p>Sejarah kami\s+berawal dari cinta buku\.<\/p>/);
    });

    it('menghapus atribut onerror inline pada gambar atau elemen lain', () => {
      const dirtyHtml = '<p>Narasi <img src="x" onerror="alert(1)"> penerbit.</p>';
      const clean = sanitizeSiteNarrativeHtml(dirtyHtml);

      assert.doesNotMatch(clean, /onerror/i);
      assert.doesNotMatch(clean, /<img/i);
    });

    it('mempertahankan tag teks yang aman (p, strong, em, ul, li, blockquote, a)', () => {
      const safeHtml = '<p>Visi kami adalah <strong>mencerdaskan</strong> bangsa dengan <a href="https://example.com" target="_blank">buku bermutu</a>.</p>';
      const clean = sanitizeSiteNarrativeHtml(safeHtml);

      assert.match(clean, /<strong>mencerdaskan<\/strong>/);
      assert.match(clean, /rel="noopener noreferrer"/);
    });
  });

  describe('6. Pembersihan Berkas Storage Yatim (Cleanup Validator)', () => {
    it('mengizinkan path berkas hero yang valid', () => {
      const paths = ['hero/00000000-0000-0000-0000-000000000000.webp'];
      const validated = validateSiteCleanupPaths(paths);
      assert.deepStrictEqual(validated, paths);
    });

    it('menolak path traversal ("..") atau path di luar folder hero/', () => {
      assert.throws(() => {
        validateSiteCleanupPaths(['hero/../../secret.txt']);
      });

      assert.throws(() => {
        validateSiteCleanupPaths(['other-folder/foto.jpg']);
      });
    });
  });
});
