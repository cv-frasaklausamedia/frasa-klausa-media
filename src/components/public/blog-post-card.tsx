import Link from 'next/link';
import Image from 'next/image';
import { Newspaper, Clock, Calendar, User } from 'lucide-react';
import type { PostListItem } from '@/lib/posts/types';
import { formatDateIndo } from '@/lib/utils';
import { formatReadingTime } from '@/validations/post';
import { Badge } from '@/components/ui/badge';

interface BlogPostCardProps {
  post: PostListItem;
  headingLevel?: 'h2' | 'h3';
  priority?: boolean;
}

export function BlogPostCard({
  post,
  headingLevel: Heading = 'h3',
  priority = false,
}: BlogPostCardProps) {
  const hasCategory = Boolean(post.category_name);

  return (
    <article className="group flex flex-col rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200">
      {/* 1. Cover Thumbnail */}
      <Link
        href={`/blog/${post.slug}`}
        className="relative aspect-[16/9] w-full overflow-hidden bg-muted block"
        tabIndex={-1}
        aria-hidden="true"
      >
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted/40">
            <Newspaper className="h-10 w-10 opacity-30" />
          </div>
        )}

        {hasCategory && (
          <div className="absolute top-3 left-3 z-10">
            <Badge
              variant="secondary"
              className="bg-background/90 text-foreground backdrop-blur-xs text-[11px] font-medium border shadow-2xs hover:bg-background transition-colors"
            >
              {post.category_name}
            </Badge>
          </div>
        )}
      </Link>

      {/* 2. Informasi Konten */}
      <div className="flex flex-1 flex-col p-5">
        {/* Meta Tanggal & Waktu Baca */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2.5">
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDateIndo(post.published_at)}</span>
            </span>
          )}
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatReadingTime(post.reading_time_minutes)}</span>
          </span>
        </div>

        {/* Judul Artikel */}
        <Heading className="font-serif font-bold text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          <Link
            href={`/blog/${post.slug}`}
            className="focus-visible:outline-hidden focus-visible:underline"
          >
            {post.title}
          </Link>
        </Heading>

        {/* Ringkasan Kutipan */}
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
          {post.excerpt || 'Baca selengkapnya artikel literasi menarik ini.'}
        </p>

        {/* Penulis */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground/80">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            {post.author_name}
          </span>
          <Link
            href={`/blog/${post.slug}`}
            className="text-primary font-medium hover:underline text-[11px]"
            aria-label={`Baca artikel: ${post.title}`}
          >
            Baca Artikel &rarr;
          </Link>
        </div>
      </div>
    </article>
  );
}
