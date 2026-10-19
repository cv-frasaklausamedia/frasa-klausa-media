'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BookOpen, FileText, Loader2, Search, AlertCircle } from 'lucide-react';
import { useUIStore } from '@/stores/use-ui-store';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { GroupedSearchResults } from '@/validations/search';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateIndo(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function GlobalSearchDialog() {
  const router = useRouter();
  const { isSearchOpen, setSearchOpen } = useUIStore();

  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<GroupedSearchResults | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setSearchOpen(open);
      if (!open) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        setQuery('');
        setDebouncedQuery('');
        setResults(null);
        setErrorMessage(null);
        setIsLoading(false);
      }
    },
    [setSearchOpen]
  );

  // 1. Keyboard Shortcut Listener (Ctrl + K / Cmd + K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleOpenChange(!isSearchOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, handleOpenChange]);

  // 2. Debounce Input 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 3. Eksekusi Pencarian dengan Pembatalan Request Lama (AbortController)
  React.useEffect(() => {
    if (debouncedQuery.length < 2) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Memulai request async
    async function fetchSearch() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Terlalu banyak permintaan pencarian. Silakan tunggu beberapa detik.');
          }
          throw new Error('Terjadi kesalahan saat memuat hasil pencarian.');
        }

        const data: GroupedSearchResults = await response.json();
        setResults(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Permintaan dibatalkan karena query baru diketik
          return;
        }
        console.error('[GlobalSearchDialog] Fetch error:', err);
        setErrorMessage(
          err instanceof Error ? err.message : 'Terjadi kendala jaringan'
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchSearch();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  const handleSelectBook = (slug: string) => {
    handleOpenChange(false);
    router.push(`/katalog/${slug}`);
  };

  const handleSelectPost = (slug: string) => {
    handleOpenChange(false);
    router.push(`/blog/${slug}`);
  };

  const displayedResults = debouncedQuery.length >= 2 ? results : null;

  return (
    <CommandDialog open={isSearchOpen} onOpenChange={handleOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Pencarian Global Frasa Klausa Media</DialogTitle>
        <DialogDescription>
          Cari judul buku, penulis, dan artikel blog secara cepat.
        </DialogDescription>
      </DialogHeader>

      <CommandInput
        placeholder="Cari buku, penulis, atau artikel..."
        value={query}
        onValueChange={setQuery}
      />

      <CommandList className="max-h-[380px] p-2">
        {/* State: Query terlalu pendek */}
        {query.trim().length > 0 && query.trim().length < 2 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Ketik minimal 2 karakter untuk memulai pencarian...
          </div>
        )}

        {/* State: Belum ada input (Idle prompt) */}
        {query.trim().length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
            <Search className="h-5 w-5 opacity-40 mb-1" />
            <p className="font-medium text-foreground/80">Pencarian Cepat Literasi</p>
            <p>Ketik judul buku, nama penulis, atau topik artikel.</p>
          </div>
        )}

        {/* State: Loading */}
        {isLoading && (
          <div className="space-y-3 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Mencari &quot;{debouncedQuery}&quot;...</span>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-9 rounded-sm" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-9 rounded-sm" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </div>
        )}

        {/* State: Error / Rate limit */}
        {errorMessage && !isLoading && (
          <div className="flex items-center gap-2 p-4 text-xs text-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* State: Empty */}
        {!isLoading && !errorMessage && debouncedQuery.length >= 2 && displayedResults && displayedResults.total === 0 && (
          <CommandEmpty className="py-8 text-center text-xs text-muted-foreground">
            Tidak ditemukan buku atau artikel yang cocok dengan &quot;{debouncedQuery}&quot;.
          </CommandEmpty>
        )}

        {/* State: Results Grouped */}
        {!isLoading && displayedResults && displayedResults.total > 0 && (
          <>
            {displayedResults.books.length > 0 && (
              <CommandGroup heading={`Buku (${displayedResults.books.length})`}>
                {displayedResults.books.map((book) => (
                  <CommandItem
                    key={book.id}
                    value={`book-${book.title}-${book.author || ''}`}
                    onSelect={() => handleSelectBook(book.slug)}
                    className="flex items-center gap-3 p-2 cursor-pointer rounded-md hover:bg-accent"
                  >
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-xs bg-muted border flex items-center justify-center">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1 text-foreground">
                        {book.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {book.author || 'Penulis belum dicantumkan'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {book.promo_price ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-semibold text-primary">
                            {formatRupiah(book.promo_price)}
                          </span>
                          {book.price && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              {formatRupiah(book.price)}
                            </span>
                          )}
                        </div>
                      ) : book.price ? (
                        <span className="text-xs font-medium text-foreground">
                          {formatRupiah(book.price)}
                        </span>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {displayedResults.books.length > 0 && displayedResults.posts.length > 0 && <CommandSeparator />}

            {displayedResults.posts.length > 0 && (
              <CommandGroup heading={`Artikel Blog (${displayedResults.posts.length})`}>
                {displayedResults.posts.map((post) => (
                  <CommandItem
                    key={post.id}
                    value={`post-${post.title}`}
                    onSelect={() => handleSelectPost(post.slug)}
                    className="flex items-center gap-3 p-2 cursor-pointer rounded-md hover:bg-accent"
                  >
                    <div className="h-9 w-9 shrink-0 rounded-xs bg-muted/60 border flex items-center justify-center text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1 text-foreground">
                        {post.title}
                      </p>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    {post.published_at && (
                      <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground font-normal">
                        {formatDateIndo(post.published_at)}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>

      <div className="flex items-center justify-between border-t px-3 py-2 text-[11px] text-muted-foreground bg-muted/20">
        <div className="flex items-center gap-2">
          <span>Tekan</span>
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            ↑
          </kbd>
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            ↓
          </kbd>
          <span>untuk navigasi</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Pilih</span>
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Enter ↵
          </kbd>
        </div>
      </div>
    </CommandDialog>
  );
}
