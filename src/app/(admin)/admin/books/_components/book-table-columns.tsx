'use client';

import { useOptimistic, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  BookOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BookListItem } from '@/lib/books/types';
import {
  toggleBookPublishedAction,
  toggleBookFeaturedAction,
} from '@/actions/book';

interface ColumnActionsProps {
  book: BookListItem;
  onDelete: (book: BookListItem) => void;
}

function ColumnActions({ book, onDelete }: ColumnActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          aria-label={`Aksi untuk buku ${book.title}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link
            href={`/admin/books/${book.id}/edit`}
            className="cursor-pointer flex items-center gap-2"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            <span>Edit Buku</span>
          </Link>
        </DropdownMenuItem>
        {/* TODO: Aktifkan menu "Lihat di Web" setelah rute publik /buku/[slug] dibangun pada tahap katalog publik */}
        {/*
        {book.is_published && (
          <DropdownMenuItem asChild>
            <Link
              href={`/buku/${book.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span>Lihat di Web</span>
            </Link>
          </DropdownMenuItem>
        )}
        */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(book)}
          className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span>Hapus Buku</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Komponen Toggle Optimistic untuk Status Published
 */
function PublishedToggle({ book }: { book: BookListItem }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticPublished, setOptimisticPublished] = useOptimistic(
    book.is_published,
    (_current, nextVal: boolean) => nextVal
  );

  const handleToggle = (checked: boolean) => {
    if (isPending) return;

    startTransition(async () => {
      setOptimisticPublished(checked);
      try {
        const res = await toggleBookPublishedAction(book.id, checked);
        if (!res.ok) {
          toast.error(res.error.message || 'Gagal memperbarui status publikasi.');
        } else {
          toast.success(
            checked
              ? `Buku "${book.title}" berhasil dipublikasikan.`
              : `Buku "${book.title}" disimpan sebagai draf.`
          );
        }
      } catch (err) {
        console.error('[PublishedToggle] Error:', err);
        toast.error('Terjadi kesalahan jaringan saat mengubah status publikasi.');
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Switch
        checked={optimisticPublished}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={`Toggle publikasi buku ${book.title}`}
        className="data-[state=checked]:bg-emerald-600 scale-90"
      />
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  );
}

/**
 * Komponen Toggle Optimistic untuk Status Featured
 */
function FeaturedToggle({ book }: { book: BookListItem }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFeatured, setOptimisticFeatured] = useOptimistic(
    book.is_featured,
    (_current, nextVal: boolean) => nextVal
  );

  const handleToggle = (checked: boolean) => {
    if (isPending) return;

    startTransition(async () => {
      setOptimisticFeatured(checked);
      try {
        const res = await toggleBookFeaturedAction(book.id, checked);
        if (!res.ok) {
          toast.error(res.error.message || 'Gagal memperbarui status unggulan.');
        } else {
          toast.success(
            checked
              ? `Buku "${book.title}" ditandai sebagai unggulan.`
              : `Buku "${book.title}" dicabut dari unggulan.`
          );
        }
      } catch (err) {
        console.error('[FeaturedToggle] Error:', err);
        toast.error('Terjadi kesalahan jaringan saat mengubah status unggulan.');
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Switch
        checked={optimisticFeatured}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={`Toggle unggulan buku ${book.title}`}
        className="data-[state=checked]:bg-amber-600 scale-90"
      />
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  );
}

/**
 * Format mata uang Rupiah
 */
function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface GetBookColumnsOptions {
  currentSort: string;
  onSort: (columnKey: string) => void;
  onDelete: (book: BookListItem) => void;
}

export function getBookColumns({
  currentSort,
  onSort,
  onDelete,
}: GetBookColumnsOptions): ColumnDef<BookListItem>[] {
  const renderSortIcon = (ascVal: string, descVal: string) => {
    if (currentSort === ascVal) {
      return <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />;
    }
    if (currentSort === descVal) {
      return <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />;
    }
    return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />;
  };

  return [
    // 1. Sampul Buku (Thumbnail Next/Image dengan Fallback Ikon)
    {
      id: 'cover',
      header: 'Sampul',
      cell: ({ row }) => {
        const book = row.original;
        return (
          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded border bg-muted flex items-center justify-center">
            {book.cover_url ? (
              <Image
                src={book.cover_url}
                alt={`Sampul buku ${book.title}`}
                fill
                sizes="40px"
                className="object-cover"
                unoptimized={false}
              />
            ) : (
              <BookOpen className="h-5 w-5 text-muted-foreground/60" />
            )}
          </div>
        );
      },
    },

    // 2. Judul & Penulis
    {
      accessorKey: 'title',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
          onClick={() => onSort('title')}
        >
          <span>Judul & Penulis</span>
          {renderSortIcon('title_asc', 'title_desc')}
        </Button>
      ),
      cell: ({ row }) => {
        const book = row.original;
        return (
          <div className="space-y-0.5 max-w-[280px]">
            <Link
              href={`/admin/books/${book.id}/edit`}
              className="font-medium text-sm text-foreground hover:underline line-clamp-1 block"
              title={book.title}
            >
              {book.title}
            </Link>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span>{book.author}</span>
              {book.publish_year && (
                <>
                  <span>•</span>
                  <span>{book.publish_year}</span>
                </>
              )}
            </div>
          </div>
        );
      },
    },

    // 3. Kategori
    {
      accessorKey: 'category_name',
      header: 'Kategori',
      cell: ({ row }) => {
        const categoryName = row.original.category_name;
        return (
          <Badge variant="outline" className="font-normal text-xs text-muted-foreground">
            {categoryName || 'Tanpa Kategori'}
          </Badge>
        );
      },
    },

    // 4. Harga
    {
      accessorKey: 'price_regular',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
          onClick={() => onSort('price')}
        >
          <span>Harga</span>
          {renderSortIcon('price_asc', 'price_desc')}
        </Button>
      ),
      cell: ({ row }) => {
        const book = row.original;
        const hasPromo = book.price_promo !== null && book.price_promo < book.price_regular;

        return (
          <div className="text-xs space-y-0.5">
            {hasPromo ? (
              <>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(book.price_promo!)}
                </div>
                <div className="text-muted-foreground line-through text-[11px]">
                  {formatRupiah(book.price_regular)}
                </div>
              </>
            ) : (
              <div className="font-medium text-foreground">
                {formatRupiah(book.price_regular)}
              </div>
            )}
          </div>
        );
      },
    },

    // 5. Status Terbit (Optimistic Toggle)
    {
      accessorKey: 'is_published',
      header: 'Terbit',
      cell: ({ row }) => <PublishedToggle book={row.original} />,
    },

    // 6. Status Unggulan (Optimistic Toggle)
    {
      accessorKey: 'is_featured',
      header: 'Unggulan',
      cell: ({ row }) => <FeaturedToggle book={row.original} />,
    },

    // 7. Aksi
    {
      id: 'actions',
      cell: ({ row }) => (
        <ColumnActions book={row.original} onDelete={onDelete} />
      ),
    },
  ];
}
