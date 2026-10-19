import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRateLimiter } from '../src/lib/rate-limit/memory.ts';
import type { BookSearchResultItem, PostSearchResultItem, GroupedSearchResults } from '../src/validations/search.ts';

describe('Search Route & Rate Limiting Suite (Tahap 9 - PRD §6.3.8)', () => {
  it('1. Rate Limiter membatasi permintaan berlebihan pada endpoint pencarian', async () => {
    const memoryLimiter = new MemoryRateLimiter({ limit: 3, windowSeconds: 60 });
    const testIp = '192.168.1.100';

    // 3 request pertama harus berhasil
    const r1 = await memoryLimiter.limit(`search:${testIp}`);
    const r2 = await memoryLimiter.limit(`search:${testIp}`);
    const r3 = await memoryLimiter.limit(`search:${testIp}`);

    assert.equal(r1.success, true);
    assert.equal(r2.success, true);
    assert.equal(r3.success, true);
    assert.equal(r3.remaining, 0);

    // Request ke-4 harus ditolak (429 Too Many Requests simulation)
    const r4 = await memoryLimiter.limit(`search:${testIp}`);
    assert.equal(r4.success, false);
    assert.equal(r4.remaining, 0);
  });

  it('2. Mengelompokkan hasil RPC search_global_content ke dalam books dan posts secara tepat', () => {
    const mockRpcResults = [
      {
        id: 'book-1',
        type: 'book',
        title: 'Hujan Bulan Juni',
        slug: 'hujan-bulan-juni',
        cover_url: 'https://images.unsplash.com/cover1.jpg',
        subtitle: 'Sapardi Djoko Damono',
        price: '75000.00',
        promo_price: '65000.00',
        published_at: '2026-01-01T00:00:00Z',
        similarity_score: 0.85,
      },
      {
        id: 'post-1',
        type: 'post',
        title: 'Mengenal Tipografi Puisi',
        slug: 'mengenal-tipografi-puisi',
        cover_url: null,
        subtitle: 'Panduan menyusun tipografi karya sastra.',
        price: null,
        promo_price: null,
        published_at: '2026-02-15T00:00:00Z',
        similarity_score: 0.65,
      },
    ];

    const books: BookSearchResultItem[] = [];
    const posts: PostSearchResultItem[] = [];

    for (const item of mockRpcResults) {
      if (item.type === 'book') {
        books.push({
          id: item.id,
          type: 'book',
          title: item.title,
          slug: item.slug,
          cover_url: item.cover_url,
          author: item.subtitle,
          price: item.price ? Number(item.price) : null,
          promo_price: item.promo_price ? Number(item.promo_price) : null,
          similarity_score: item.similarity_score,
        });
      } else if (item.type === 'post') {
        posts.push({
          id: item.id,
          type: 'post',
          title: item.title,
          slug: item.slug,
          cover_url: item.cover_url,
          excerpt: item.subtitle,
          published_at: item.published_at,
          similarity_score: item.similarity_score,
        });
      }
    }

    const grouped: GroupedSearchResults = {
      books,
      posts,
      total: books.length + posts.length,
    };

    assert.equal(grouped.total, 2);
    assert.equal(grouped.books.length, 1);
    assert.equal(grouped.posts.length, 1);

    assert.equal(grouped.books[0].title, 'Hujan Bulan Juni');
    assert.equal(grouped.books[0].author, 'Sapardi Djoko Damono');
    assert.equal(grouped.books[0].price, 75000);
    assert.equal(grouped.books[0].promo_price, 65000);

    assert.equal(grouped.posts[0].title, 'Mengenal Tipografi Puisi');
    assert.equal(grouped.posts[0].excerpt, 'Panduan menyusun tipografi karya sastra.');
  });
});
