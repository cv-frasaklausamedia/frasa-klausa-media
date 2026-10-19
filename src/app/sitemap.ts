import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/server';
import {
  buildStaticSitemapEntries,
  buildDynamicSitemapEntries,
} from '@/lib/seo/sitemap-helper';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frasaklausamedia.com';
  const now = new Date();

  // 1. Rute Statis Publik Utama (Hanya URL Kanonikal)
  const staticRoutes = buildStaticSitemapEntries(baseUrl, now);

  try {
    const supabase = createPublicClient();
    const nowIso = now.toISOString();

    // 2. Ambil seluruh data dinamis terpublikasi secara paralel
    const [booksRes, categoriesRes, postsRes] = await Promise.all([
      supabase
        .from('books')
        .select('slug, updated_at, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('book_categories')
        .select('slug, updated_at, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('posts')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .lte('published_at', nowIso)
        .order('published_at', { ascending: false }),
    ]);

    const dynamicRoutes = buildDynamicSitemapEntries(
      baseUrl,
      booksRes.data || [],
      categoriesRes.data || [],
      postsRes.data || [],
      now
    );

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error('[sitemap.ts] Gagal memuat data dinamis untuk sitemap:', error);
    // Fallback aman: kembalikan setidaknya rute statis agar sitemap tidak 500
    return staticRoutes;
  }
}
