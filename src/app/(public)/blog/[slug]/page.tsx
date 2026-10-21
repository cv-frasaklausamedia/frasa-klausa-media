import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, User, ChevronRight, ArrowLeft, Tag } from 'lucide-react';

import { getPublicPostBySlug, getPublicRelatedPosts } from '@/lib/posts/data-access';
import { sanitizePostHtml } from '@/lib/sanitizer';
import { formatDateIndo } from '@/lib/utils';
import { formatReadingTime } from '@/validations/post';
import { OFFICIAL_IDENTITY } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShareButtons } from '@/components/public/share-buttons';
import { BlogPostCard } from '@/components/public/blog-post-card';
import { JsonLd } from '@/components/public/json-ld';
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/json-ld';
import { getOpenGraphImage } from '@/lib/seo/open-graph';
import BlogPostDetailLoading from './loading';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);

  if (!post) {
    return {
      title: `Artikel Tidak Ditemukan | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    };
  }

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt;
  const image = getOpenGraphImage({ sourceUrl: post.cover_url, alt: post.title });

  return {
    title: `${title} | Blog ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      url: `/blog/${post.slug}`,
      title,
      description,
      publishedTime: post.published_at || undefined,
      authors: [post.author_name],
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}

async function BlogPostDetailContent({ params }: BlogPostPageProps) {
  await connection();
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);

  // Jika artikel tidak ditemukan atau belum terpublikasi, kembalikan 404
  if (!post) {
    notFound();
  }

  // Sanitasi konten teks kaya HTML
  const sanitizedContent = sanitizePostHtml(post.content);

  // Ambil artikel terkait dalam kategori yang sama
  const relatedPosts = await getPublicRelatedPosts(post.id, post.category_id, 3);

  const category = post.category;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frasaklausamedia.com';
  const articleJsonLd = buildArticleJsonLd(post, baseUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Beranda', url: '/' },
      { name: 'Blog', url: '/blog' },
      ...(category ? [{ name: category.name, url: `/blog?kategori=${category.slug}` }] : []),
      { name: post.title, url: `/blog/${post.slug}` },
    ],
    baseUrl
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      {/* 1. Breadcrumb Navigasi */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/blog" className="hover:text-foreground transition-colors">
          Blog
        </Link>
        {category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/blog?kategori=${category.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {category.name}
            </Link>
          </>
        )}
      </nav>

      {/* 2. Grid 2 Kolom Responsif: 70% Konten Artikel & 30% Komponen Share/Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Kolom Kiri: 70% Lebar (lg:col-span-8) */}
        <article className="lg:col-span-8 space-y-8 min-w-0">
          {/* Header Artikel */}
          <header className="space-y-4">
            {category && (
              <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                {category.name}
              </Badge>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground leading-[1.2]">
              {post.title}
            </h1>

            {/* Ringkasan Subtitle */}
            {post.excerpt && (
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
                {post.excerpt}
              </p>
            )}

            {/* Info Penulis, Tanggal, dan Read Time */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-2 border-y border-border/70 py-3">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <User className="h-4 w-4 text-muted-foreground" />
                {post.author_name}
              </span>
              <span>•</span>
              {post.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateIndo(post.published_at)}</span>
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatReadingTime(post.reading_time_minutes)}</span>
              </span>
            </div>
          </header>

          {/* Cover Image Artikel */}
          {post.cover_url && (
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-border bg-muted shadow-xs">
              <Image
                src={post.cover_url}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 840px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Konten Teks Kaya Tersanitasi dengan Tipografi Teroptimasi (Tailwind Prose) */}
          <main className="pt-2">
            <div
              className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-sm leading-relaxed text-base sm:text-lg"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </main>

          {/* Tag Topik Artikel */}
          {post.tags && post.tags.length > 0 && (
            <footer className="pt-6 border-t border-border/70">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                  <Tag className="h-3.5 w-3.5" /> Topik:
                </span>
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </footer>
          )}
        </article>

        {/* Kolom Kanan: 30% Lebar (lg:col-span-4) - Komponen Share & Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Kartu Komponen Share */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="space-y-1">
                <span className="text-base font-serif font-bold text-foreground block">
                  Suka artikel ini?
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bagikan wawasan dan karya ini ke jejaring sosial Anda.
                </p>
              </div>

              <div className="pt-3 border-t border-border/60">
                <ShareButtons title={post.title} />
              </div>
            </div>

            {/* Kartu Profil Penulis & Navigasi Cepat */}
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif font-bold text-sm shrink-0">
                  {post.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{post.author_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{OFFICIAL_IDENTITY.COMPANY_NAME}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ruang literasi terbuka untuk mewujudkan naskah menjadi buku berkualitas dan berdaya saing.
              </p>
              <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
                <Link href="/blog">
                  <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Semua Blog
                </Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. Rekomendasi Artikel Terkait (Full-Width 100% di Kontainer max-w-7xl) */}
      {relatedPosts.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-border/80">
          <div className="space-y-1">
            <h2 className="text-2xl font-serif font-bold text-foreground">
              Artikel Terkait
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Jelajahi tulisan lain dalam kategori yang sama.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((related) => (
              <BlogPostCard key={related.id} post={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function BlogPostDetailPage({ params }: BlogPostPageProps) {
  return (
    <Suspense fallback={<BlogPostDetailLoading />}>
      <BlogPostDetailContent params={params} />
    </Suspense>
  );
}
