import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper, ChevronRight, Search, X } from 'lucide-react';

import { getPublicPosts, getBlogCategoriesOptions } from '@/lib/posts/data-access';
import { publicBlogQuerySchema } from '@/validations/post';
import { BlogPostCard } from '@/components/public/blog-post-card';
import { Pagination } from '@/components/public/pagination';
import { OFFICIAL_IDENTITY } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import BlogLoadingFallback from './loading';

interface BlogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const rawParams = await searchParams;
  const parsed = publicBlogQuerySchema.parse(rawParams);

  const isFiltered = Boolean(parsed.kategori || parsed.q);

  const title = parsed.kategori
    ? `Artikel Kategori ${parsed.kategori} | Blog ${OFFICIAL_IDENTITY.COMPANY_NAME}`
    : `Blog & Kabar Literasi | ${OFFICIAL_IDENTITY.COMPANY_NAME}`;
  const description =
    'Kumpulan artikel sastra, wawasan penerbitan buku, tips menulis, dan kabar kegiatan literasi terkini dari Frasa Klausa Media.';

  return {
    title,
    description,
    alternates: {
      canonical: '/blog',
    },
    openGraph: {
      type: 'website',
      url: '/blog',
      title,
      description,
      images: [{ url: '/logo/logo-landscape.jpg', width: 1200, height: 630, alt: 'Blog Frasa Klausa Media' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo/logo-landscape.jpg'],
    },
    robots: isFiltered
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

async function BlogContent({ searchParams }: BlogPageProps) {
  await connection();
  const rawParams = await searchParams;
  const queryParams = publicBlogQuerySchema.parse(rawParams);

  const [postsResponse, categories] = await Promise.all([
    getPublicPosts(queryParams),
    getBlogCategoriesOptions(),
  ]);

  const { items: posts, totalCount, page, pageCount } = postsResponse;

  // Temukan nama kategori aktif bila sedang difilter
  const activeCategory = categories.find(
    (c) => c.slug === queryParams.kategori || c.id === queryParams.kategori
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* 1. Header & Breadcrumb */}
      <div className="space-y-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Beranda
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-foreground">Blog Literasi</span>
          {activeCategory && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-primary font-medium">{activeCategory.name}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
              Blog & Kabar Literasi
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Eksplorasi wawasan seputar dunia kepenulisan, bedah karya, esai sastra, dan pengumuman resmi penerbitan Frasa Klausa Media.
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-medium shrink-0">
            Total {totalCount} artikel terbit
          </div>
        </div>
      </div>

      {/* 2. Filter Kategori & Pencarian */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b pb-6">
        {/* Kategori Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <Button
            asChild
            variant={!queryParams.kategori ? 'default' : 'outline'}
            size="sm"
            className="rounded-full text-xs h-8 px-3.5 shrink-0"
          >
            <Link href={queryParams.q ? `/blog?q=${encodeURIComponent(queryParams.q)}` : '/blog'}>
              Semua
            </Link>
          </Button>

          {categories.map((cat) => {
            const isActive =
              queryParams.kategori === cat.slug || queryParams.kategori === cat.id;
            const targetUrl = new URLSearchParams();
            targetUrl.set('kategori', cat.slug);
            if (queryParams.q) targetUrl.set('q', queryParams.q);

            return (
              <Button
                key={cat.id}
                asChild
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="rounded-full text-xs h-8 px-3.5 shrink-0"
              >
                <Link href={`/blog?${targetUrl.toString()}`}>{cat.name}</Link>
              </Button>
            );
          })}
        </div>

        {/* Search Bar Form */}
        <form method="GET" action="/blog" className="flex items-center gap-2 max-w-sm w-full">
          {queryParams.kategori && (
            <input type="hidden" name="kategori" value={queryParams.kategori} />
          )}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={queryParams.q}
              placeholder="Cari judul artikel..."
              className="pl-8 text-xs h-9"
              aria-label="Cari judul artikel"
            />
            {queryParams.q && (
              <Link
                href={queryParams.kategori ? `/blog?kategori=${queryParams.kategori}` : '/blog'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Hapus kata kunci pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-9 px-3 text-xs">
            Cari
          </Button>
        </form>
      </div>

      {/* 3. Status Filter Aktif */}
      {(queryParams.kategori || queryParams.q) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <span>Menampilkan hasil untuk:</span>
          {activeCategory && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Kategori: {activeCategory.name}
              <Link href={queryParams.q ? `/blog?q=${encodeURIComponent(queryParams.q)}` : '/blog'}>
                <X className="h-3 w-3 hover:text-foreground" />
              </Link>
            </Badge>
          )}
          {queryParams.q && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Kata kunci: &ldquo;{queryParams.q}&rdquo;
              <Link href={queryParams.kategori ? `/blog?kategori=${queryParams.kategori}` : '/blog'}>
                <X className="h-3 w-3 hover:text-foreground" />
              </Link>
            </Badge>
          )}
          <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-muted-foreground">
            <Link href="/blog">Reset Semua Filter</Link>
          </Button>
        </div>
      )}

      {/* 4. Daftar Artikel / Empty State */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center space-y-4 my-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Newspaper className="h-7 w-7 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-foreground">
              Tidak Ada Artikel Ditemukan
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Tidak ada artikel yang sesuai dengan kriteria pencarian atau kategori yang dipilih.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2 text-xs">
            <Link href="/blog">Lihat Semua Artikel</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, idx) => (
            <BlogPostCard key={post.id} post={post} priority={idx < 3} />
          ))}
        </div>
      )}

      {/* 5. Paginasi Server-side Ramah SEO */}
      <Pagination
        currentPage={page}
        pageCount={pageCount}
        basePath="/blog"
        searchParams={{
          q: queryParams.q || undefined,
          kategori: queryParams.kategori || undefined,
          sort: queryParams.sort !== 'published_at_desc' ? queryParams.sort : undefined,
        }}
      />
    </div>
  );
}

export default function BlogPage({ searchParams }: BlogPageProps) {
  return (
    <Suspense fallback={<BlogLoadingFallback />}>
      <BlogContent searchParams={searchParams} />
    </Suspense>
  );
}
