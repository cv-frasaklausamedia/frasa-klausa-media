import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  blogCategoryFormSchema,
  blogCategoryQuerySchema,
  BLOG_CATEGORY_PAGE_SIZE_OPTIONS,
  BLOG_CATEGORY_SORT_OPTIONS,
} from '../src/validations/blog-category.ts';

describe('Blog Category Validations Suite (Unit Tests)', () => {
  describe('blogCategoryFormSchema Validations', () => {
    it('menerima payload form kategori blog yang valid dan lengkap', () => {
      const input = {
        name: 'Resensi Buku & Kritik Sastra',
        slug: 'resensi-buku-dan-kritik-sastra',
        description: 'Ulasan mendalam buku fiksi dan non-fiksi terbitan terbaru.',
        seo_title: 'Resensi Buku & Kritik Sastra | Frasa Klausa',
        seo_description: 'Temukan berbagai resensi buku sastra terbaik dan telaah kritis bersama redaksi Frasa Klausa Media.',
      };

      const result = blogCategoryFormSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.name, 'Resensi Buku & Kritik Sastra');
        assert.equal(result.data.slug, 'resensi-buku-dan-kritik-sastra');
        assert.equal(result.data.seo_title, 'Resensi Buku & Kritik Sastra | Frasa Klausa');
      }
    });

    it('menerima payload minimal dengan deskripsi dan SEO opsional kosong', () => {
      const input = {
        name: 'Opini Sastra',
        slug: 'opini-sastra',
      };

      const result = blogCategoryFormSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.description, null);
        assert.equal(result.data.seo_title, null);
        assert.equal(result.data.seo_description, null);
      }
    });

    it('menolak nama kategori yang terlalu pendek (< 2 karakter)', () => {
      const input = {
        name: 'A',
        slug: 'artikel-a',
      };

      const result = blogCategoryFormSchema.safeParse(input);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.path.includes('name')));
      }
    });

    it('menolak slug yang mengandung huruf besar atau spasi', () => {
      const input = {
        name: 'Berita Peluncuran',
        slug: 'Berita Peluncuran',
      };

      const result = blogCategoryFormSchema.safeParse(input);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.path.includes('slug')));
      }
    });

    it('menolak meta title yang melebihi batas 70 karakter', () => {
      const input = {
        name: 'Tips Menulis',
        slug: 'tips-menulis',
        seo_title: 'A'.repeat(71),
      };

      const result = blogCategoryFormSchema.safeParse(input);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.path.includes('seo_title')));
      }
    });

    it('menolak meta description yang melebihi batas 160 karakter', () => {
      const input = {
        name: 'Tips Menulis',
        slug: 'tips-menulis',
        seo_description: 'B'.repeat(161),
      };

      const result = blogCategoryFormSchema.safeParse(input);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((issue) => issue.path.includes('seo_description')));
      }
    });
  });

  describe('blogCategoryQuerySchema URL Parameter Parsing & Fallback', () => {
    it('mengembalikan nilai default saat query params kosong', () => {
      const parsed = blogCategoryQuerySchema.parse({});
      assert.equal(parsed.page, 1);
      assert.equal(parsed.pageSize, 10);
      assert.equal(parsed.q, '');
      assert.equal(parsed.sort, 'created_at_desc');
    });

    it('melakukan parsing parameter valid dari string URL', () => {
      const parsed = blogCategoryQuerySchema.parse({
        page: '3',
        pageSize: '25',
        q: 'sastra',
        sort: 'name_asc',
      });

      assert.equal(parsed.page, 3);
      assert.equal(parsed.pageSize, 25);
      assert.equal(parsed.q, 'sastra');
      assert.equal(parsed.sort, 'name_asc');
    });

    it('mendukung opsi sorting khusus jumlah artikel (posts_desc, posts_asc)', () => {
      const parsedDesc = blogCategoryQuerySchema.parse({ sort: 'posts_desc' });
      assert.equal(parsedDesc.sort, 'posts_desc');

      const parsedAsc = blogCategoryQuerySchema.parse({ sort: 'posts_asc' });
      assert.equal(parsedAsc.sort, 'posts_asc');
    });

    it('memberikan fallback aman pada nilai ilegal (pertahanan dari URL injection)', () => {
      const parsed = blogCategoryQuerySchema.parse({
        page: '-5',
        pageSize: '999',
        q: '  injeksi pencarian  ',
        sort: 'hacked_sort_column',
      });

      assert.equal(parsed.page, 1);
      assert.equal(parsed.pageSize, 10);
      assert.equal(parsed.q, 'injeksi pencarian');
      assert.equal(parsed.sort, 'created_at_desc');
    });
  });

  describe('Options Allowlist Consistency', () => {
    it('memastikan batas halaman mencakup nilai 10, 25, 50, dan 100', () => {
      assert.deepEqual(Array.from(BLOG_CATEGORY_PAGE_SIZE_OPTIONS), [10, 25, 50, 100]);
    });

    it('memastikan allowlist sort mencakup semua opsi yang didukung', () => {
      assert.ok(BLOG_CATEGORY_SORT_OPTIONS.includes('created_at_desc'));
      assert.ok(BLOG_CATEGORY_SORT_OPTIONS.includes('created_at_asc'));
      assert.ok(BLOG_CATEGORY_SORT_OPTIONS.includes('name_asc'));
      assert.ok(BLOG_CATEGORY_SORT_OPTIONS.includes('name_desc'));
      assert.ok(BLOG_CATEGORY_SORT_OPTIONS.includes('posts_desc'));
      assert.ok(BLOG_CATEGORY_SORT_OPTIONS.includes('posts_asc'));
    });
  });
});
