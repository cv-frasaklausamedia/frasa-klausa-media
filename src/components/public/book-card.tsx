import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/validations/book';
import type { BookListItem, BookRelatedOption } from '@/lib/books/types';

interface BookCardProps {
  book: BookListItem | BookRelatedOption;
  priority?: boolean;
}

export function BookCard({ book, priority = false }: BookCardProps) {
  const hasPromo =
    book.price_promo !== null &&
    book.price_promo !== undefined &&
    book.price_promo > 0 &&
    book.price_promo < book.price_regular;

  // Hitung persentase diskon
  const discountPercent = hasPromo
    ? Math.round(((book.price_regular - (book.price_promo ?? 0)) / book.price_regular) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-xs transition-all duration-300 hover:shadow-md hover:border-primary/40 overflow-hidden">
      {/* Cover Image Container dengan aspect ratio tetap 3/4 untuk mencegah CLS */}
      <Link
        href={`/buku/${book.slug}`}
        className="relative block w-full aspect-[3/4] overflow-hidden bg-muted/60"
        tabIndex={-1}
        aria-hidden="true"
      >
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={`Sampul buku ${book.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-muted-foreground/50">
            <BookOpen className="h-10 w-10 mb-2 stroke-[1.5]" />
            <span className="text-xs font-serif italic line-clamp-2 px-2 text-foreground/70">
              {book.title}
            </span>
          </div>
        )}

        {/* Badge Diskon Promo */}
        {hasPromo && discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge
              variant="destructive"
              className="px-2 py-0.5 text-xs font-bold tracking-tight shadow-xs"
            >
              Hemat {discountPercent}%
            </Badge>
          </div>
        )}
      </Link>

      {/* Informasi Buku */}
      <div className="flex flex-1 flex-col p-4">
        {/* Kategori (jika tersedia) */}
        {'category_name' in book && book.category_name && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-primary/80 mb-1">
            {book.category_name}
          </p>
        )}

        {/* Judul Buku */}
        <h3 className="font-serif font-semibold text-base leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          <Link href={`/buku/${book.slug}`} className="focus-visible:outline-hidden focus-visible:underline">
            {book.title}
          </Link>
        </h3>

        {/* Penulis */}
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
          {book.author}
        </p>

        {/* Komparasi Harga */}
        <div className="mt-auto pt-3 flex flex-wrap items-baseline gap-2">
          {hasPromo ? (
            <>
              <span className="font-bold text-base text-primary">
                {formatRupiah(book.price_promo!)}
              </span>
              <span className="text-xs text-muted-foreground/70 line-through">
                {formatRupiah(book.price_regular)}
              </span>
            </>
          ) : (
            <span className="font-bold text-base text-foreground">
              {formatRupiah(book.price_regular)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
