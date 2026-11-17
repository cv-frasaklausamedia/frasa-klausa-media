export interface SitemapItem {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: string[];
}

export interface DynamicBookSitemapInput {
  slug: string;
  cover_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface DynamicCategorySitemapInput {
  slug: string;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface DynamicPostSitemapInput {
  slug: string;
  cover_url?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
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
      url: `${baseUrl}/tentang-kami`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
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
 * Membangun entri sitemap untuk entitas dinamis (Buku, Kategori, Artikel Blog) dengan Image Sitemap
 */
export function buildDynamicSitemapEntries(
  baseUrl: string,
  books: DynamicBookSitemapInput[],
  categories: DynamicCategorySitemapInput[],
  posts: DynamicPostSitemapInput[],
  now = new Date()
): SitemapItem[] {
  const nowIso = now.toISOString();

  const bookRoutes: SitemapItem[] = books.map((book) => ({
    url: `${baseUrl}/buku/${book.slug}`,
    lastModified: new Date(book.updated_at || book.created_at || nowIso),
    changeFrequency: 'weekly',
    priority: 0.85,
    ...(book.cover_url ? { images: [book.cover_url] } : {}),
  }));

  const categoryRoutes: SitemapItem[] = categories.map((cat) => ({
    url: `${baseUrl}/kategori/${cat.slug}`,
    lastModified: new Date(cat.updated_at || cat.created_at || nowIso),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const postRoutes: SitemapItem[] = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at || nowIso),
    changeFrequency: 'weekly',
    priority: 0.75,
    ...(post.cover_url ? { images: [post.cover_url] } : {}),
  }));

  return [...bookRoutes, ...categoryRoutes, ...postRoutes];
}
