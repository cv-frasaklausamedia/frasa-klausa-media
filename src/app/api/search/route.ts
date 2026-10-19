import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limit';
import {
  searchQuerySchema,
  type BookSearchResultItem,
  type PostSearchResultItem,
  type GroupedSearchResults,
} from '@/validations/search';
import type { Database } from '@/types/database';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/monitoring';

// Rate Limiter: Maksimal 30 request per menit per alamat IP
const searchRateLimiter = createRateLimiter({
  limit: 30,
  windowSeconds: 60,
});

function getClientIpFromRequest(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    // 1. Ekstraksi IP & Proteksi Rate Limiting
    const clientIp = getClientIpFromRequest(request);
    const rateLimit = await searchRateLimiter.limit(`search:${clientIp}`);

    if (!rateLimit.success) {
      logger.warn('Search rate limit exceeded', {
        route: '/api/search',
        status: 429,
        metadata: { clientIp },
      });
      const retryAfter = Math.max(1, rateLimit.reset - Math.floor(Date.now() / 1000));
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan pencarian. Silakan coba sesaat lagi.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.reset),
          },
        }
      );
    }

    // 2. Ekstraksi & Validasi Parameter URL
    const { searchParams } = new URL(request.url);
    const rawQ = searchParams.get('q');
    const rawLimit = searchParams.get('limit') || '10';

    // Kembalikan hasil kosong jika query belum memenuhi batas minimal tanpa melempar 400
    if (!rawQ || rawQ.trim().length < 2) {
      const emptyResult: GroupedSearchResults = { books: [], posts: [], total: 0 };
      return NextResponse.json(emptyResult, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }

    const validationResult = searchQuerySchema.safeParse({
      q: rawQ,
      limit: rawLimit,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Parameter pencarian tidak valid',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { q, limit } = validationResult.data;

    // 3. Eksekusi RPC Full-Text Search PostgreSQL (Public / Anon client)
    const supabase = createPublicClient();
    const { data: rawResults, error: rpcError } = await supabase.rpc(
      'search_global_content',
      {
        search_query: q,
        result_limit: limit,
      }
    );

    if (rpcError) {
      console.error('[API /api/search] Supabase RPC error:', rpcError);
      return NextResponse.json(
        { error: 'Gagal melakukan pencarian konten' },
        { status: 500 }
      );
    }

    type RpcItem = Database['public']['Functions']['search_global_content']['Returns'][number];
    const items = (rawResults || []) as RpcItem[];

    // 4. Transformasi & Pengelompokan Hasil
    const books: BookSearchResultItem[] = [];
    const posts: PostSearchResultItem[] = [];

    for (const item of items) {
      if (item.type === 'book') {
        books.push({
          id: item.id,
          type: 'book',
          title: item.title,
          slug: item.slug,
          cover_url: item.cover_url,
          author: item.subtitle,
          price: item.price !== null ? Number(item.price) : null,
          promo_price: item.promo_price !== null ? Number(item.promo_price) : null,
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

    const result: GroupedSearchResults = {
      books,
      posts,
      total: books.length + posts.length,
    };

    logger.info('Search query processed', {
      route: '/api/search',
      status: 200,
      durationMs: Date.now() - startTime,
      metadata: {
        queryLength: q.length,
        bookResultsCount: books.length,
        postResultsCount: posts.length,
      },
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (error) {
    // Biarkan Next.js menangani internal control-flow exceptions (bailing out of prerendering)
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof (error as Record<string, unknown>).digest === 'string' &&
      ((error as Record<string, unknown>).digest as string).startsWith('NEXT_')
    ) {
      throw error;
    }

    captureException(error, {
      route: '/api/search',
      status: 500,
    });
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat memproses pencarian' },
      { status: 500 }
    );
  }
}
