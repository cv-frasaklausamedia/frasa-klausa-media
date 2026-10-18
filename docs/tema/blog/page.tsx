import * as React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, FileText, User, BookOpen } from 'lucide-react';
import { getPublicPostsList, getAllBlogCategories } from '@/lib/posts/data-access';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { OFFICIAL_IDENTITY } from '@/constants';

export const metadata: Metadata = {
  title: 'Blog & Ruang Literasi | Frasa Klausa Media',
  description:
    'Kumpulan artikel literasi, berita peluncuran buku, esai sastra, dan tips kepenulisan dari Frasa Klausa Media.',
  openGraph: {
    title: 'Blog & Ruang Literasi | Frasa Klausa Media',
    description:
      'Kumpulan artikel literasi, berita peluncuran buku, esai sastra, dan tips kepenulisan dari Frasa Klausa Media.',
  },
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default async function PublicBlogPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const page = typeof rawParams.page === 'string' ? Number(rawParams.page) || 1 : 1;
  const categorySlug =
    typeof rawParams.kategori === 'string' ? rawParams.kategori : undefined;
  const tag = typeof rawParams.tag === 'string' ? rawParams.tag : undefined;
  const q = typeof rawParams.q === 'string' ? rawParams.q : undefined;

  const [postsResult, categories] = await Promise.all([
    getPublicPostsList({
      page,
      pageSize: 9,
      category_slug: categorySlug,
      tag,
      q,
    }),
    getAllBlogCategories(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Publik Konsisten */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">
                {OFFICIAL_IDENTITY.COMPANY_NAME}
              </span>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Penerbit Buku & Media Literasi
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Beranda
            </Link>
            <Link
              href="/katalog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Katalog
            </Link>
            <Link
              href="/tentang-kami"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Tentang Kami
            </Link>
            <Link
              href="/blog"
              className="text-sm font-semibold text-primary transition-colors px-2 py-1 border-b-2 border-primary"
            >
              Blog
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Header Halaman Publik */}
      <section className="border-b bg-muted/20 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center space-y-4">
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            Ruang Literasi & Warta
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-serif">
            Jejak Kata & Gagasan
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Menelusuri semesta pemikiran, ulasan karya sastra, serta kabar terbaru dari balik meja redaksi Frasa Klausa Media.
          </p>

          {/* Form Filter Kategori Sederhana */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <Button
              asChild
              variant={!categorySlug ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs h-8"
            >
              <Link href="/blog">Semua Topik</Link>
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                asChild
                variant={categorySlug === cat.slug ? 'default' : 'outline'}
                size="sm"
                className="rounded-full text-xs h-8"
              >
                <Link href={`/blog?kategori=${cat.slug}`}>{cat.name}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Artikel Publik */}
      <main className="container mx-auto px-4 sm:px-6 max-w-5xl py-12">
        {postsResult.posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {postsResult.posts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Cover Thumbnail */}
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative aspect-video w-full overflow-hidden bg-muted"
                >
                  {post.cover_url ? (
                    <Image
                      src={post.cover_url}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground/40">
                      <FileText className="h-10 w-10" />
                    </div>
                  )}
                  <Badge
                    className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur-xs font-normal text-[11px]"
                    variant="outline"
                  >
                    {post.category_name}
                  </Badge>
                </Link>

                {/* Konten Kartu */}
                <div className="flex flex-1 flex-col p-5 justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(post.published_at || post.created_at)}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.reading_time.label}</span>
                      </div>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors font-serif">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium text-foreground truncate max-w-[160px]">
                      <User className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{post.author_name}</span>
                    </div>

                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-primary font-medium hover:underline text-xs"
                    >
                      Baca Selengkapnya →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center max-w-md mx-auto my-12">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-foreground">
              Belum Ada Artikel Diterbitkan
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Kunjungi kembali halaman ini nanti untuk menyimak tulisan literasi terbaru.
            </p>
          </div>
        )}

        {/* Paginasi Sederhana */}
        {postsResult.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-12">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/blog?page=${page - 1}${categorySlug ? `&kategori=${categorySlug}` : ''}`}
                >
                  ← Halaman Sebelumnya
                </Link>
              </Button>
            )}
            <span className="text-xs text-muted-foreground px-2">
              Halaman {page} dari {postsResult.totalPages}
            </span>
            {page < postsResult.totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/blog?page=${page + 1}${categorySlug ? `&kategori=${categorySlug}` : ''}`}
                >
                  Halaman Berikutnya →
                </Link>
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer Publik */}
      <footer className="border-t py-8 text-xs text-muted-foreground text-center">
        <p>
          {OFFICIAL_IDENTITY.COMPANY_NAME} &copy; {new Date().getFullYear()} &mdash; All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
