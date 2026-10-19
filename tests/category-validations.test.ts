import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSlug,
  SLUG_REGEX,
  categoryFormSchema,
  categoryQuerySchema,
  CATEGORY_PAGE_SIZE_OPTIONS,
  CATEGORY_SORT_OPTIONS,
} from '../src/validations/category.ts';

describe('Category Validations Suite (Unit Tests)', () => {
  describe('generateSlug Utility', () => {
    it('mengubah teks kapital dan spasi menjadi slug valid', () => {
      assert.equal(generateSlug('Sastra Klasik Nusantara'), 'sastra-klasik-nusantara');
    });

    it('menghapus aksen dan diakritik unicode NFD secara bersih', () => {
      assert.equal(generateSlug('Kafé Filosofi René'), 'kafe-filosofi-rene');
    });

    it('menghapus karakter khusus dan simbol yang tidak aman', () => {
      assert.equal(generateSlug('Buku #1 (Best Seller!) & Puisi*'), 'buku-1-best-seller-puisi');
    });

    it('memangkas tanda hubung berulang dan di ujung teks', () => {
      assert.equal(generateSlug('---kumpulan---cerpen---'), 'kumpulan-cerpen');
    });

    it('menangani string kosong atau hanya spasi dengan aman', () => {
      assert.equal(generateSlug(''), '');
      assert.equal(generateSlug('   '), '');
    });

    it('menghasilkan slug yang lolos validasi SLUG_REGEX', () => {
      const generated = generateSlug('Antologi Sastra Dunia 2026!');
      assert.equal(SLUG_REGEX.test(generated), true);
    });
  });

  describe('SLUG_REGEX Pattern', () => {
    it('menerima slug yang valid', () => {
      assert.equal(SLUG_REGEX.test('fiksi'), true);
      assert.equal(SLUG_REGEX.test('sastra-klasik'), true);
      assert.equal(SLUG_REGEX.test('buku-anak-123'), true);
    });

    it('menolak slug yang mengandung huruf besar, spasi, atau simbol terlarang', () => {
      assert.equal(SLUG_REGEX.test('Fiksi'), false);
      assert.equal(SLUG_REGEX.test('sastra klasik'), false);
      assert.equal(SLUG_REGEX.test('sastra_klasik'), false);
      assert.equal(SLUG_REGEX.test('sastra/klasik'), false);
      assert.equal(SLUG_REGEX.test('sastra@klasik'), false);
    });

    it('menolak slug dengan leading, trailing, atau double hyphen', () => {
      assert.equal(SLUG_REGEX.test('-sastra'), false);
      assert.equal(SLUG_REGEX.test('sastra-'), false);
      assert.equal(SLUG_REGEX.test('sastra--klasik'), false);
    });
  });

  describe('categoryFormSchema (Client & Server Validation)', () => {
    it('menerima payload kategori yang valid', () => {
      const payload = {
        name: 'Sastra Kontemporer',
        slug: 'sastra-kontemporer',
        description: 'Kategori buku sastra era modern.',
        seo_title: 'Buku Sastra Kontemporer Terbaik',
        seo_description: 'Koleksi lengkap buku sastra kontemporer Frasa Klausa Media.',
      };

      const result = categoryFormSchema.safeParse(payload);
      assert.equal(result.success, true);
    });

    it('mengubah string kosong pada kolom opsional menjadi null', () => {
      const payload = {
        name: 'Novel',
        slug: 'novel',
        description: '',
        seo_title: '',
        seo_description: '',
      };

      const result = categoryFormSchema.safeParse(payload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.description, null);
        assert.equal(result.data.seo_title, null);
        assert.equal(result.data.seo_description, null);
      }
    });

    it('menolak nama yang terlalu pendek (< 2 karakter) atau terlalu panjang (> 100 karakter)', () => {
      const tooShort = categoryFormSchema.safeParse({ name: 'A', slug: 'valid-slug' });
      assert.equal(tooShort.success, false);

      const tooLong = categoryFormSchema.safeParse({
        name: 'A'.repeat(101),
        slug: 'valid-slug',
      });
      assert.equal(tooLong.success, false);
    });

    it('menolak format slug yang melanggar regex', () => {
      const invalidSlug = categoryFormSchema.safeParse({
        name: 'Kategori Buku',
        slug: 'Kategori Buku Dengan Spasi',
      });
      assert.equal(invalidSlug.success, false);
    });

    it('menolak seo_title > 70 karakter dan seo_description > 160 karakter (PRD §15.4)', () => {
      const titleTooLong = categoryFormSchema.safeParse({
        name: 'Buku Baru',
        slug: 'buku-baru',
        seo_title: 'A'.repeat(71),
      });
      assert.equal(titleTooLong.success, false);

      const descTooLong = categoryFormSchema.safeParse({
        name: 'Buku Baru',
        slug: 'buku-baru',
        seo_description: 'B'.repeat(161),
      });
      assert.equal(descTooLong.success, false);
    });
  });

  describe('categoryQuerySchema (URL Query Allowlist & Defensive Fallbacks)', () => {
    it('menerima query parameters yang sah secara penuh', () => {
      const query = {
        page: '2',
        pageSize: '25',
        q: 'puisi',
        sort: 'name_asc',
      };

      const parsed = categoryQuerySchema.parse(query);
      assert.equal(parsed.page, 2);
      assert.equal(parsed.pageSize, 25);
      assert.equal(parsed.q, 'puisi');
      assert.equal(parsed.sort, 'name_asc');
    });

    it('fallback defensif: manipulasi page ilegal (negatif/string/nol) kembali ke 1', () => {
      assert.equal(categoryQuerySchema.parse({ page: '-5' }).page, 1);
      assert.equal(categoryQuerySchema.parse({ page: '0' }).page, 1);
      assert.equal(categoryQuerySchema.parse({ page: 'hack"OR 1=1' }).page, 1);
      assert.equal(categoryQuerySchema.parse({}).page, 1);
    });

    it('fallback defensif: pageSize non-allowlist otomatis dikembalikan ke default 10', () => {
      // Hanya [10, 25, 50, 100] yang diizinkan
      assert.equal(categoryQuerySchema.parse({ pageSize: '999' }).pageSize, 10);
      assert.equal(categoryQuerySchema.parse({ pageSize: '15' }).pageSize, 10);
      assert.equal(categoryQuerySchema.parse({ pageSize: 'bad-input' }).pageSize, 10);

      // Cek semua allowlist sah
      for (const size of CATEGORY_PAGE_SIZE_OPTIONS) {
        assert.equal(categoryQuerySchema.parse({ pageSize: String(size) }).pageSize, size);
      }
    });

    it('fallback defensif: sort yang tidak ada di allowlist kembali ke created_at_desc', () => {
      assert.equal(categoryQuerySchema.parse({ sort: 'dangerous_col;DROP' }).sort, 'created_at_desc');
      assert.equal(categoryQuerySchema.parse({ sort: 'unknown_sort' }).sort, 'created_at_desc');

      for (const validSort of CATEGORY_SORT_OPTIONS) {
        assert.equal(categoryQuerySchema.parse({ sort: validSort }).sort, validSort);
      }
    });

    it('membersihkan dan membatasi panjang pencarian q', () => {
      const parsed = categoryQuerySchema.parse({ q: '   kata kunci   ' });
      assert.equal(parsed.q, 'kata kunci');
    });
  });
});
