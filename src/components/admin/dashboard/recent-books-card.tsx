import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, Plus, ArrowRight } from 'lucide-react';
import type { RecentBookItem } from '@/lib/dashboard';

interface RecentBooksCardProps {
  books: RecentBookItem[];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RecentBooksCard({ books }: RecentBooksCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            Buku Terbaru
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Entri judul buku yang baru ditambahkan ke katalog
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-1 text-primary hover:text-primary">
          <Link href="/admin/books">
            Semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-border p-4 bg-muted/20">
            <BookOpen className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-xs font-medium text-foreground">Belum ada data buku</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">Mulai tambahkan buku pertama ke katalog Anda</p>
            <Button size="sm" asChild className="h-7 text-xs gap-1.5">
              <Link href="/admin/books">
                <Plus className="h-3 w-3" /> Tambah Buku
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {books.map((book) => (
              <div
                key={book.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded border border-border bg-muted">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                        <BookOpen className="h-4 w-4 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {book.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {book.author} &bull; <span className="text-muted-foreground/90">{book.categoryName}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-medium text-foreground">
                        {formatRupiah(book.pricePromo ?? book.priceRegular)}
                      </span>
                      {book.pricePromo && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatRupiah(book.priceRegular)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={book.isPublished ? 'outline' : 'secondary'}
                    className={`text-[10px] px-1.5 py-0 font-normal ${
                      book.isPublished
                        ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 dark:border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-amber-500/40 text-amber-700 dark:text-amber-300 dark:border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/30'
                    }`}
                  >
                    {book.isPublished ? 'Terbit' : 'Draf'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Link href={`/admin/books`} title="Kelola Buku">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="sr-only">Detail {book.title}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
