import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  buildStaticSitemapEntries,
  buildDynamicSitemapEntries,
} from '../src/lib/seo/sitemap-helper.ts';
import robots from '../src/app/robots.ts';
import {
  safeJsonLd,
  buildBookJsonLd,
  buildArticleJsonLd,
  buildOrganizationJsonLd,
  buildBreadcrumbJsonLd,
} from '../src/lib/seo/json-ld.ts';
import type { BookDetail } from '../src/lib/books/types.ts';
import type { PostDetail } from '../src/lib/posts/types.ts';
import { OFFICIAL_IDENTITY } from '../src/constants/index.ts';

describe('Tahap 12: SEO, Performa & Aksesibilitas Suite (PRD §10.7, §11, §16.1–16.4)', () => {
  describe('1. Dynamic Sitemap Generator (src/lib/seo/sitemap-helper.ts)', () => {
    test('menghasilkan daftar URL kanonikal publik statis utama dengan prioritas yang sesuai', () => {
      const baseUrl = 'https://frasaklausamedia.com';
      const items = buildStaticSitemapEntries(baseUrl);

      assert.strictEqual(Array.isArray(items), true);
      assert.strictEqual(items.length, 5);

      const urls = items.map((i) => i.url);
      assert.strictEqual(urls.includes(`${baseUrl}`), true);
      assert.strictEqual(urls.includes(`${baseUrl}/katalog`), true);
      assert.strictEqual(urls.includes(`${baseUrl}/blog`), true);
      assert.strictEqual(urls.includes(`${baseUrl}/tentang-kami`), true);
      assert.strictEqual(urls.includes(`${baseUrl}/kontak`), true);

      items.forEach((entry) => {
        assert.ok(entry.url.startsWith('https://'), `URL tidak valid: ${entry.url}`);
        assert.ok(entry.lastModified instanceof Date, `lastModified bukan Date pada ${entry.url}`);
        assert.ok(entry.priority !== undefined && entry.priority > 0, `Priority invalid pada ${entry.url}`);
      });
    });

    test('memetakan entitas dinamis (Buku, Kategori, Artikel) ke URL kanonikal tanpa query string', () => {
      const baseUrl = 'https://frasaklausamedia.com';
      const mockBooks = [
        { slug: 'buku-satu', updated_at: '2026-01-01T00:00:00Z', created_at: '2025-12-01T00:00:00Z' },
      ];
      const mockCategories = [
        { slug: 'sastra', updated_at: '2026-01-01T00:00:00Z', created_at: '2025-12-01T00:00:00Z' },
      ];
      const mockPosts = [
        { slug: 'artikel-literasi', updated_at: '2026-01-01T00:00:00Z', published_at: '2025-12-01T00:00:00Z' },
      ];

      const dynamicItems = buildDynamicSitemapEntries(baseUrl, mockBooks, mockCategories, mockPosts);

      assert.strictEqual(dynamicItems.length, 3);
      const urls = dynamicItems.map((i) => i.url);

      assert.strictEqual(urls.includes(`${baseUrl}/buku/buku-satu`), true);
      assert.strictEqual(urls.includes(`${baseUrl}/kategori/sastra`), true);
      assert.strictEqual(urls.includes(`${baseUrl}/blog/artikel-literasi`), true);

      urls.forEach((url) => {
        assert.strictEqual(url.includes('/admin'), false, `Area admin bocor di sitemap: ${url}`);
        assert.strictEqual(url.includes('/login'), false, `Area login bocor di sitemap: ${url}`);
        assert.strictEqual(url.includes('/api'), false, `Rute API bocor di sitemap: ${url}`);
        assert.strictEqual(url.includes('?'), false, `Query string bocor di sitemap: ${url}`);
      });
    });
  });

  describe('2. Direktif Mesin Pencari (src/app/robots.ts)', () => {
    test('mengonfigurasi aturan crawl publik dan membatasi rute privat', () => {
      const robotsConfig = robots();
      assert.ok(robotsConfig.rules, 'Aturan robots tidak ditemukan');

      const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
      assert.strictEqual(rules?.userAgent, '*');
      assert.strictEqual(rules?.allow, '/');

      const disallows = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];
      assert.strictEqual(disallows.includes('/admin'), true);
      assert.strictEqual(disallows.includes('/login'), true);
      assert.strictEqual(disallows.includes('/api/*'), true);

      assert.ok(
        typeof robotsConfig.sitemap === 'string' && robotsConfig.sitemap.endsWith('/sitemap.xml'),
        'URL sitemap pada robots.txt tidak valid'
      );
    });
  });

  describe('3. Keamanan & Sanitasi JSON-LD Anti-XSS (safeJsonLd)', () => {
    test('meng-escape karakter HTML sensitif (<, >, &) menjadi unicode yang aman', () => {
      const maliciousData = {
        title: 'Buku <script>alert("xss")</script>',
        publisher: 'Frasa & Klausa > Media',
      };

      const result = safeJsonLd(maliciousData);

      assert.strictEqual(result.includes('<script>'), false);
      assert.strictEqual(result.includes('</script>'), false);
      assert.strictEqual(result.includes('>'), false);
      assert.strictEqual(result.includes('&'), false);

      assert.strictEqual(result.includes('\\u003cscript\\u003e'), true);
      assert.strictEqual(result.includes('Frasa \\u0026 Klausa \\u003e Media'), true);
    });
  });

  describe('4. Schema.org "Book" Generator (buildBookJsonLd)', () => {
    const mockBook: BookDetail = {
      id: 'book-1',
      title: 'Hujan di Balik Jendela',
      slug: 'hujan-di-balik-jendela',
      author: 'Sapardi Djoko',
      publisher: 'Frasa Klausa Media',
      publish_year: 2024,
      page_count: 180,
      isbn: '978-602-1234-56-7',
      cover_url: 'https://images.supabase.co/covers/hujan.jpg',
      price_regular: 85000,
      price_promo: 70000,
      is_published: true,
      is_featured: true,
      category_id: 'cat-1',
      category_name: 'Puisi',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    };

    interface BookJsonLdShape {
      '@context': string;
      '@type': string;
      name: string;
      url: string;
      inLanguage: string;
      isbn: string | null;
      numberOfPages: number | null;
      datePublished: string;
      image: string;
      author: { '@type': string; name: string };
      publisher: { '@type': string; name: string };
      offers: {
        '@type': string;
        price: number;
        priceCurrency: string;
        availability: string;
      };
    }

    test('menghasilkan schema Book yang valid dengan harga promo efektif', () => {
      const baseUrl = 'https://frasaklausamedia.com';
      const jsonLd = buildBookJsonLd(mockBook, baseUrl) as unknown as BookJsonLdShape;

      assert.strictEqual(jsonLd['@context'], 'https://schema.org');
      assert.strictEqual(jsonLd['@type'], 'Book');
      assert.strictEqual(jsonLd.name, mockBook.title);
      assert.strictEqual(jsonLd.url, `${baseUrl}/buku/${mockBook.slug}`);
      assert.strictEqual(jsonLd.inLanguage, 'id');
      assert.strictEqual(jsonLd.isbn, mockBook.isbn);
      assert.strictEqual(jsonLd.numberOfPages, mockBook.page_count);
      assert.strictEqual(jsonLd.datePublished, '2024');
      assert.strictEqual(jsonLd.image, mockBook.cover_url);

      assert.strictEqual(jsonLd.author['@type'], 'Person');
      assert.strictEqual(jsonLd.author.name, mockBook.author);

      assert.strictEqual(jsonLd.publisher['@type'], 'Organization');
      assert.strictEqual(jsonLd.publisher.name, mockBook.publisher);

      // Pastikan offers memakai harga efektif (promo) dan mata uang IDR
      assert.strictEqual(jsonLd.offers['@type'], 'Offer');
      assert.strictEqual(jsonLd.offers.price, 70000);
      assert.strictEqual(jsonLd.offers.priceCurrency, 'IDR');
      assert.strictEqual(jsonLd.offers.availability, 'https://schema.org/InStock');
    });

    test('menggunakan harga regular bila tidak ada harga promo', () => {
      const bookWithoutPromo: BookDetail = {
        ...mockBook,
        price_promo: null,
      };

      const jsonLd = buildBookJsonLd(bookWithoutPromo, 'https://frasaklausamedia.com') as unknown as BookJsonLdShape;
      assert.strictEqual(jsonLd.offers.price, 85000);
    });
  });

  describe('5. Schema.org "BlogPosting" & "Organization" Generators', () => {
    const mockPost: PostDetail = {
      id: 'post-1',
      title: 'Tips Menulis Novel Pemula',
      slug: 'tips-menulis-novel-pemula',
      content: '<p>Konten artikel...</p>',
      excerpt: 'Panduan menulis bagi pemula.',
      author_id: 'user-1',
      author_name: 'Redaksi Frasa',
      status: 'published',
      published_at: '2024-05-10T10:00:00Z',
      cover_url: 'https://images.supabase.co/covers/tips.jpg',
      reading_time_minutes: 5,
      created_at: '2024-05-10T10:00:00Z',
      updated_at: '2024-05-11T12:00:00Z',
    };

    interface ArticleJsonLdShape {
      '@context': string;
      '@type': string;
      headline: string;
      author: Array<{ name: string }>;
      publisher: { name: string };
      mainEntityOfPage: { '@id': string };
    }

    interface OrganizationJsonLdShape {
      '@context': string;
      '@type': string;
      name: string;
      legalName: string;
      contactPoint: { telephone: string };
      sameAs: string[];
    }

    interface BreadcrumbJsonLdShape {
      '@type': string;
      itemListElement: Array<{
        position: number;
        item: string;
      }>;
    }

    test('menghasilkan schema BlogPosting lengkap dengan penulis dan penerbit', () => {
      const baseUrl = 'https://frasaklausamedia.com';
      const jsonLd = buildArticleJsonLd(mockPost, baseUrl) as unknown as ArticleJsonLdShape;

      assert.strictEqual(jsonLd['@context'], 'https://schema.org');
      assert.strictEqual(jsonLd['@type'], 'BlogPosting');
      assert.strictEqual(jsonLd.headline, mockPost.title);
      assert.strictEqual(jsonLd.author[0].name, mockPost.author_name);
      assert.strictEqual(jsonLd.publisher.name, OFFICIAL_IDENTITY.COMPANY_NAME);
      assert.strictEqual(jsonLd.mainEntityOfPage['@id'], `${baseUrl}/blog/${mockPost.slug}`);
    });

    test('menghasilkan schema Organization beranda dengan informasi resmi penerbit', () => {
      const baseUrl = 'https://frasaklausamedia.com';
      const jsonLd = buildOrganizationJsonLd(baseUrl) as unknown as OrganizationJsonLdShape;

      assert.strictEqual(jsonLd['@context'], 'https://schema.org');
      assert.strictEqual(jsonLd['@type'], 'Organization');
      assert.strictEqual(jsonLd.name, OFFICIAL_IDENTITY.COMPANY_NAME);
      assert.strictEqual(jsonLd.legalName, OFFICIAL_IDENTITY.LEGAL_NAME);
      assert.strictEqual(jsonLd.contactPoint.telephone, `+${OFFICIAL_IDENTITY.WHATSAPP}`);
      assert.strictEqual(Array.isArray(jsonLd.sameAs), true);
      assert.strictEqual(jsonLd.sameAs.length >= 3, true);
    });

    test('menghasilkan schema BreadcrumbList dengan posisi yang benar', () => {
      const baseUrl = 'https://frasaklausamedia.com';
      const breadcrumbs = [
        { name: 'Beranda', url: '/' },
        { name: 'Katalog', url: '/katalog' },
        { name: 'Buku A', url: '/buku/buku-a' },
      ];

      const jsonLd = buildBreadcrumbJsonLd(breadcrumbs, baseUrl) as unknown as BreadcrumbJsonLdShape;
      assert.strictEqual(jsonLd['@type'], 'BreadcrumbList');
      assert.strictEqual(jsonLd.itemListElement.length, 3);
      assert.strictEqual(jsonLd.itemListElement[0].position, 1);
      assert.strictEqual(jsonLd.itemListElement[0].item, `${baseUrl}/`);
      assert.strictEqual(jsonLd.itemListElement[2].position, 3);
      assert.strictEqual(jsonLd.itemListElement[2].item, `${baseUrl}/buku/buku-a`);
    });
  });

  describe('6. Audit Aksesibilitas WCAG 2.2 AA & Atribut Kode', () => {
    test('memastikan CSS global memuat aturan prefers-reduced-motion', () => {
      const cssPath = path.join(process.cwd(), 'src/app/globals.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      assert.strictEqual(cssContent.includes('prefers-reduced-motion: reduce'), true);
      assert.strictEqual(cssContent.includes('animation-duration: 0.01ms'), true);
    });

    test('memastikan PublicLayout memuat tautan Skip to Main Content dan target id #main-content', () => {
      const layoutPath = path.join(process.cwd(), 'src/app/(public)/layout.tsx');
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      assert.strictEqual(layoutContent.includes('href="#main-content"'), true);
      assert.strictEqual(layoutContent.includes('id="main-content"'), true);
      assert.strictEqual(layoutContent.includes('Lewati ke konten utama'), true);
    });

    test('memastikan metadata admin dan login mengatur robots noindex', () => {
      const adminLayoutPath = path.join(process.cwd(), 'src/app/(admin)/admin/layout.tsx');
      const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf-8');
      assert.strictEqual(adminLayoutContent.includes('index: false'), true);
      assert.strictEqual(adminLayoutContent.includes('follow: false'), true);

      const loginPath = path.join(process.cwd(), 'src/app/(auth)/login/page.tsx');
      const loginContent = fs.readFileSync(loginPath, 'utf-8');
      assert.strictEqual(loginContent.includes('index: false'), true);
      assert.strictEqual(loginContent.includes('follow: false'), true);
    });

    test('memastikan input harga pada filter katalog memiliki aria-label', () => {
      const filterBarPath = path.join(process.cwd(), 'src/components/public/katalog-filter-bar.tsx');
      const filterBarContent = fs.readFileSync(filterBarPath, 'utf-8');
      assert.strictEqual(filterBarContent.includes('aria-label="Harga minimum (IDR)"'), true);
      assert.strictEqual(filterBarContent.includes('aria-label="Harga maksimum (IDR)"'), true);
    });
  });
});
