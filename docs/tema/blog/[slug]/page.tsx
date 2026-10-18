import * as React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { getPublicPostBySlug } from '@/lib/posts/data-access';
import { sanitizeHtmlContent } from '@/lib/sanitizer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

/**
 * Metadata SEO dinamis untuk artikel blog (PRD §16.2).
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);

  if (!post) {
    return {
      title: 'Artikel Tidak Ditemukan | Frasa Klausa Media',
    };
  }

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt;

  return {
    title: `${title} | Frasa Klausa Media`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      authors: [post.author_name],
      tags: post.tags,
      images: post.cover_url ? [{ url: post.cover_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.cover_url ? [post.cover_url] : [],
    },
  };
}

export default async function PublicPostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);

  // Jika artikel berstatus draf, terjadwal, atau tidak ditemukan -> 404 (tidak bocor ke publik)
  if (!post) {
    notFound();
  }

  // Pertahanan berlapis sanitasi HTML saat render (PRD §15.5)
  const safeHtml = sanitizeHtmlContent(post.content || '');

  return (
    <div className="min-h-screen bg-background py-10 sm:py-16">
      <article className="container mx-auto px-4 sm:px-6 max-w-3xl">
        {/* Tombol Kembali */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="-ml-3 text-xs">
            <Link href="/blog">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Kembali ke Semua Artikel
            </Link>
          </Button>
        </div>

        {/* Header Artikel */}
        <header className="space-y-4 border-b pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">
              {post.category_name}
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{post.reading_time.label}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-serif leading-tight">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed italic">
            &ldquo;{post.excerpt}&rdquo;
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>{post.author_name}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {post.cover_url && (
          <div className="relative aspect-video w-full my-8 sm:my-10 overflow-hidden rounded-xl border bg-muted shadow-xs">
            <Image
              src={post.cover_url}
              alt={post.title}
              fill
              sizes="(max-width: 800px) 100vw, 800px"
              priority
              className="object-cover"
            />
          </div>
        )}

        {/* Isi Konten Render Tiptap */}
        <div
          className="prose prose-base sm:prose-lg max-w-none dark:prose-invert font-sans pt-4 leading-relaxed [&_img]:rounded-lg [&_img]:border [&_img]:shadow-xs [&_blockquote]:border-l-primary [&_blockquote]:italic"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        {/* Tag & Footer */}
        {post.tags.length > 0 && (
          <footer className="mt-12 border-t pt-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium mr-1">
                Topik:
              </span>
              {post.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </footer>
        )}
      </article>
    </div>
  );
}
