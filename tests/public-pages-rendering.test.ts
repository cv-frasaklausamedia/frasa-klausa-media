import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_SOCIAL_CONTENT,
} from '../src/lib/site-content/defaults.ts';
import { sanitizeSiteNarrativeHtml } from '../src/lib/sanitizer.ts';
import { OFFICIAL_IDENTITY } from '../src/constants/index.ts';

describe('Tahap 11: Public Pages Content & CMS Defaults Suite (PRD §6.3.6, §6.3.7, §8)', () => {
  describe('1. Fallback Konten Halaman Tentang Kami (PRD §6.3.6 & US-08)', () => {
    test('memastikan DEFAULT_ABOUT_CONTENT memiliki atribut lengkap', () => {
      assert.strictEqual(typeof DEFAULT_ABOUT_CONTENT.title, 'string');
      assert.strictEqual(typeof DEFAULT_ABOUT_CONTENT.subtitle, 'string');
      assert.strictEqual(typeof DEFAULT_ABOUT_CONTENT.vision, 'string');
      assert.strictEqual(Array.isArray(DEFAULT_ABOUT_CONTENT.mission), true);
      assert.strictEqual(DEFAULT_ABOUT_CONTENT.mission.length >= 3, true);
      assert.strictEqual(Array.isArray(DEFAULT_ABOUT_CONTENT.values), true);
      assert.strictEqual(DEFAULT_ABOUT_CONTENT.values.length >= 3, true);
      assert.strictEqual(typeof DEFAULT_ABOUT_CONTENT.history, 'string');
    });

    test('sanitasi narasi sejarah membersihkan tag berbahaya', () => {
      const malicious = '<p>Sejarah kami <script>alert("hack")</script></p><iframe src="//evil.com"></iframe>';
      const clean = sanitizeSiteNarrativeHtml(malicious);
      assert.strictEqual(clean.includes('<script>'), false);
      assert.strictEqual(clean.includes('<iframe'), false);
      assert.strictEqual(clean.includes('<p>Sejarah kami'), true);
    });
  });

  describe('2. Fallback Konten Halaman Kontak & Identitas Resmi (PRD §8 & US-09)', () => {
    test('mencantumkan nomor telepon / WhatsApp resmi 0813-8060-4256', () => {
      assert.strictEqual(DEFAULT_CONTACT_CONTENT.phone, '0813-8060-4256');
      assert.strictEqual(DEFAULT_CONTACT_CONTENT.whatsapp, '0813-8060-4256');
      assert.strictEqual(OFFICIAL_IDENTITY.PHONE, '0813-8060-4256');
    });

    test('mencantumkan alamat email resmi frasaklausamedia@gmail.com', () => {
      assert.strictEqual(DEFAULT_CONTACT_CONTENT.email, 'frasaklausamedia@gmail.com');
      assert.strictEqual(OFFICIAL_IDENTITY.EMAIL, 'frasaklausamedia@gmail.com');
    });

    test('memiliki tautan Google Maps Embed yang valid', () => {
      assert.strictEqual(typeof DEFAULT_CONTACT_CONTENT.maps_embed_url, 'string');
      assert.strictEqual(DEFAULT_CONTACT_CONTENT.maps_embed_url.includes('google.com/maps/embed'), true);
    });

    test('media sosial resmi mencakup kanal utama penerbit', () => {
      assert.strictEqual(DEFAULT_SOCIAL_CONTENT.instagram.includes('instagram.com'), true);
      assert.strictEqual(DEFAULT_SOCIAL_CONTENT.facebook.includes('facebook.com'), true);
      assert.strictEqual(DEFAULT_SOCIAL_CONTENT.tiktok.includes('tiktok.com'), true);
      assert.strictEqual(DEFAULT_SOCIAL_CONTENT.shopee.includes('shopee.co.id'), true);
      assert.strictEqual(DEFAULT_SOCIAL_CONTENT.tokopedia.includes('tokopedia.com'), true);
    });
  });
});
