import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  publicCatalogQuerySchema,
  formatRupiah,
  buildWhatsAppUrl,
  normalizeWhatsAppNumber,
  formatWhatsAppMessage,
  DEFAULT_WA_NUMBER,
  DEFAULT_WA_TEMPLATE,
} from '../src/validations/book.ts';

describe('Tahap 10: Public Catalog & Checkout Validations Suite', () => {
  describe('1. Skema Validasi Query URL Katalog Publik (PRD §6.3.3 & §10.2)', () => {
    test('memproses query default tanpa parameter dengan nilai fallback yang sah', () => {
      const parsed = publicCatalogQuerySchema.parse({});
      assert.strictEqual(parsed.page, 1);
      assert.strictEqual(parsed.pageSize, 12);
      assert.strictEqual(parsed.q, '');
      assert.strictEqual(parsed.kategori, undefined);
      assert.strictEqual(parsed.minPrice, undefined);
      assert.strictEqual(parsed.maxPrice, undefined);
      assert.strictEqual(parsed.sort, 'created_at_desc');
    });

    test('memvalidasi dan membatasi rentang harga min & max dalam angka wajar', () => {
      const parsed = publicCatalogQuerySchema.parse({
        minPrice: '50000',
        maxPrice: '150000',
      });
      assert.strictEqual(parsed.minPrice, 50000);
      assert.strictEqual(parsed.maxPrice, 150000);
    });

    test('menangani format harga dengan karakter non-angka (mis. Rp100.000 -> 100000)', () => {
      const parsed = publicCatalogQuerySchema.parse({
        minPrice: 'Rp 25.000',
        maxPrice: 'Rp 250.000',
      });
      assert.strictEqual(parsed.minPrice, 25000);
      assert.strictEqual(parsed.maxPrice, 250000);
    });

    test('membatasi harga maksimum ekstrem di atas 100.000.000', () => {
      const parsed = publicCatalogQuerySchema.parse({
        maxPrice: '9999999999',
      });
      assert.strictEqual(parsed.maxPrice, 100000000);
    });

    test('memvalidasi sorting allowlist dan fallback ke created_at_desc untuk sort berbahaya/ilegal', () => {
      const validSort = publicCatalogQuerySchema.parse({ sort: 'price_asc' });
      assert.strictEqual(validSort.sort, 'price_asc');

      const illegalSort = publicCatalogQuerySchema.parse({
        sort: "title; DROP TABLE books; --" as unknown as 'price_asc',
      });
      assert.strictEqual(illegalSort.sort, 'created_at_desc');
    });

    test('memproses filter kategori baik slug maupun alias category', () => {
      const withKategori = publicCatalogQuerySchema.parse({ kategori: 'sastra' });
      assert.strictEqual(withKategori.kategori, 'sastra');

      const withCategory = publicCatalogQuerySchema.parse({ category: 'puisi' });
      assert.strictEqual(withCategory.kategori, 'puisi');
    });

    test('membatasi dan membersihkan parameter kata kunci pencarian (max 100 karakter)', () => {
      const longQuery = 'a'.repeat(200);
      const parsed = publicCatalogQuerySchema.parse({ q: longQuery });
      assert.strictEqual(parsed.q.length, 100);
    });
  });

  describe('2. Checkout Multi-Kanal & Format Pesan WhatsApp (PRD §7 & DoD)', () => {
    test('formatRupiah memformat mata uang IDR dengan benar tanpa desimal', () => {
      const formatted = formatRupiah(88000);
      // Format id-ID: Rp 88.000 atau Rp88.000 tergantung runtime
      assert.match(formatted, /Rp\s?88\.000/);
    });

    test('normalisasi nomor WhatsApp resmi dengan fallback default 0813-8060-4256', () => {
      // Input nomor standar nasional
      assert.strictEqual(normalizeWhatsAppNumber('0813-8060-4256'), '6281380604256');
      assert.strictEqual(normalizeWhatsAppNumber('+62 813 8060 4256'), '6281380604256');
      assert.strictEqual(normalizeWhatsAppNumber('81380604256'), '6281380604256');

      // Input kosong atau tidak valid fallback ke default
      assert.strictEqual(normalizeWhatsAppNumber(null), DEFAULT_WA_NUMBER);
      assert.strictEqual(normalizeWhatsAppNumber(''), DEFAULT_WA_NUMBER);
      assert.strictEqual(normalizeWhatsAppNumber('1234'), DEFAULT_WA_NUMBER);
    });

    test('formatWhatsAppMessage menyusun pesan baku pemesanan dengan judul dan harga Rupiah', () => {
      const msg = formatWhatsAppMessage(
        DEFAULT_WA_TEMPLATE,
        'Jejak Sunyi di Sudut Kota',
        75000
      );
      assert.match(
        msg,
        /Halo Frasa Klausa Media, saya ingin memesan buku "Jejak Sunyi di Sudut Kota" seharga Rp\s?75\.000\. Apakah stok masih tersedia\?/
      );
    });

    test('buildWhatsAppUrl membentuk URL wa.me yang di-encode secara valid di server', () => {
      const url = buildWhatsAppUrl(
        '0813-8060-4256',
        DEFAULT_WA_TEMPLATE,
        'Jejak Sunyi di Sudut Kota',
        75000
      );

      assert.ok(url.startsWith('https://wa.me/6281380604256?text='));
      const textParam = new URL(url).searchParams.get('text');
      assert.ok(textParam);
      assert.match(
        textParam,
        /Halo Frasa Klausa Media, saya ingin memesan buku "Jejak Sunyi di Sudut Kota" seharga Rp\s?75\.000\. Apakah stok masih tersedia\?/
      );
    });

    test('fallback rule: URL marketplace Shopee & Tokopedia kosong dapat dideteksi dengan aman', () => {
      const isAvailable = (url: string | null | undefined) => Boolean(url && url.trim().length > 0);

      assert.strictEqual(isAvailable('https://shopee.co.id/toko-resmi'), true);
      assert.strictEqual(isAvailable(''), false);
      assert.strictEqual(isAvailable('   '), false);
      assert.strictEqual(isAvailable(null), false);
      assert.strictEqual(isAvailable(undefined), false);
    });
  });
});
