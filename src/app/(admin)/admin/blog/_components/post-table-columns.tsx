'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Clock,
  Calendar,
  Globe,
  Archive,
  User,
} from 'lucide-react';

import type { PostListItem } from '@/lib/posts/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostColumnOptions {
  onDeleteClick: (post: PostListItem) => void;
  onToggleStatusClick: (post: PostListItem) => void;
  isPending: boolean;
}

export function getPostColumns({
  onDeleteClick,
  onToggleStatusClick,
  isPending,
}: PostColumnOptions): ColumnDef<PostListItem>[] {
  return [
    {
      accessorKey: 'title',
      header: 'Artikel',
      cell: ({ row }) => {
        const post = row.original;

        return (
          <div className="flex items-center gap-3 max-w-md">
            {/* Thumbnail Cover 16:9 */}
            <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded border bg-muted flex items-center justify-center">
              {post.cover_url ? (
                <Image
                  src={post.cover_url}
                  alt={post.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground/60" />
              )}
            </div>

            {/* Judul, Slug & Waktu Baca */}
            <div className="min-w-0 flex-1 space-y-1">
              <Link
                href={`/admin/blog/${post.id}/edit`}
                className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1 text-sm"
              >
                {post.title}
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono text-[11px] truncate max-w-[160px]">
                  /{post.slug}
                </span>
                <span className="inline-flex items-center gap-1 bg-muted/60 px-1.5 py-0.5 rounded text-[11px]">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {post.reading_time_minutes} mnt baca
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'author_name',
      header: 'Penulis',
      cell: ({ row }) => {
        const author = row.original.author_name;
        return (
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[140px]">{author}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'category_name',
      header: 'Kategori',
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="space-y-1">
            <Badge variant="secondary" className="font-normal text-xs">
              {post.category_name}
            </Badge>
            {post.tags && post.tags.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {post.tags.length} tag
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const post = row.original;
        const now = new Date();
        const isScheduled =
          post.status === 'published' &&
          post.published_at &&
          new Date(post.published_at) > now;

        if (isScheduled) {
          return (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-xs"
            >
              <Calendar className="h-3 w-3" />
              Terjadwal
            </Badge>
          );
        }

        if (post.status === 'published') {
          return (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-xs"
            >
              <Globe className="h-3 w-3" />
              Terbit
            </Badge>
          );
        }

        return (
          <Badge
            variant="outline"
            className="border-muted-foreground/30 bg-muted text-muted-foreground gap-1 text-xs"
          >
            <Archive className="h-3 w-3" />
            Draf
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Tanggal',
      cell: ({ row }) => {
        const post = row.original;
        const dateToShow = post.published_at || post.created_at;
        const label = post.status === 'published' ? 'Terbit' : 'Dibuat';

        const formatted = new Intl.DateTimeFormat('id-ID', {
          dateStyle: 'medium',
        }).format(new Date(dateToShow));

        return (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p className="text-foreground">{formatted}</p>
            <p className="text-[11px] text-muted-foreground/80">{label}</p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => {
        const post = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={isPending}
                aria-label="Buka menu aksi artikel"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Aksi Artikel
              </DropdownMenuLabel>

              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/blog/${post.id}/preview`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="h-4 w-4 text-primary" />
                  <span>Pratinjau Draf</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/blog/${post.id}/edit`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  <span>Ubah Artikel</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onToggleStatusClick(post)}
                className="flex items-center gap-2 cursor-pointer"
              >
                {post.status === 'published' ? (
                  <>
                    <Archive className="h-4 w-4 text-amber-500" />
                    <span>Jadikan Draf</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 text-emerald-500" />
                    <span>Terbitkan Sekarang</span>
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDeleteClick(post)}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span>Hapus Artikel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
