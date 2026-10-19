export interface SitemapItem {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Membangun entri sitemap untuk rute statis publik utama (hanya URL kanonikal)
 */
export function buildStaticSitemapEntries(baseUrl: string, now = new Date()): SitemapItem[] {
  return [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/katalog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tentang-kami`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kontak`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}

/**
 * Membangun entri sitemap untuk entitas dinamis (Buku, Kategori, Artikel Blog)
 */
export function buildDynamicSitemapEntries(
  baseUrl: string,
  books: { slug: string; updated_at?: string | null; created_at?: string | null }[],
  categories: { slug: string; updated_at?: string | null; created_at?: string | null }[],
  posts: { slug: string; updated_at?: string | null; published_at?: string | null }[],
  now = new Date()
): SitemapItem[] {
  const nowIso = now.toISOString();

  const bookRoutes: SitemapItem[] = books.map((book) => ({
    url: `${baseUrl}/buku/${book.slug}`,
    lastModified: new Date(book.updated_at || book.created_at || nowIso),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryRoutes: SitemapItem[] = categories.map((cat) => ({
    url: `${baseUrl}/kategori/${cat.slug}`,
    lastModified: new Date(cat.updated_at || cat.created_at || nowIso),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const postRoutes: SitemapItem[] = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at || nowIso),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...bookRoutes, ...categoryRoutes, ...postRoutes];
}
