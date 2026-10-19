import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Clock,
  Calendar,
  User,
  ShieldAlert,
  Tag,
  Globe,
  Archive,
} from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { getPostById } from '@/lib/posts/data-access';
import { SanitizedHtml } from '@/components/common/sanitized-html';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PostPreviewPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Pratinjau Draf Artikel — Admin Frasa Klausa Media',
  description: 'Mode pratinjau draf internal artikel blog.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PostPreviewPage({ params }: PostPreviewPageProps) {
  await connection();
  // Autentikasi ketat: hanya Admin aktif yang dapat melihat pratinjau draf
  await requireAdmin();

  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  const isPublished = post.status === 'published';
  const now = new Date();
  const isScheduled =
    isPublished && post.published_at && new Date(post.published_at) > now;

  const dateToShow = post.published_at || post.created_at;
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
  }).format(new Date(dateToShow));

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Banner Peringatan Pratinjau Draf Admin */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Mode Pratinjau Draf Internal</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Halaman ini hanya dapat diakses oleh Admin berautentikasi dan tidak dapat dilihat oleh publik anonim.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 bg-background">
              <Link href={`/admin/blog/${post.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span>Ubah Artikel</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5">
              <Link href="/admin/blog">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Daftar</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Konten Pratinjau Artikel */}
      <article className="space-y-6">
        {/* Metadata Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {post.category?.name || 'Kategori Blog'}
            </Badge>

            {isScheduled ? (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-xs"
              >
                <Calendar className="h-3 w-3" />
                Terjadwal ({new Date(post.published_at!).toLocaleDateString('id-ID')})
              </Badge>
            ) : isPublished ? (
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-xs"
              >
                <Globe className="h-3 w-3" />
                Terbit
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-muted-foreground/30 bg-muted text-muted-foreground gap-1 text-xs"
              >
                <Archive className="h-3 w-3" />
                Draf
              </Badge>
            )}

            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Clock className="h-3.5 w-3.5" />
              {post.reading_time_minutes} menit baca
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-y py-2.5">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {post.author_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {formattedDate}
            </span>
          </div>

          {post.excerpt && (
            <p className="text-base sm:text-lg text-muted-foreground font-serif italic border-l-2 border-primary/40 pl-4 py-1">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Gambar Sampul */}
        {post.cover_url && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-xs">
            <Image
              src={post.cover_url}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        )}

        {/* Konten Tersanitasi Aman dengan Mode Post */}
        <SanitizedHtml
          html={post.content}
          mode="post"
          className="prose prose-base sm:prose-lg dark:prose-invert max-w-none pt-4"
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="border-t pt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
              <Tag className="h-3.5 w-3.5" /> Tag:
            </span>
            {post.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs font-normal">
                #{t}
              </Badge>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
