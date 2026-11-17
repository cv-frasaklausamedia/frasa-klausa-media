'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  BookOpen,
  FileText,
  Loader2,
  Search,
  AlertCircle,
  Compass,
  Library,
  Newspaper,
  Phone,
  LogIn,
  ArrowRight,
  Sparkles,
  Tag,
} from 'lucide-react';
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
import type { BookListItem } from '@/lib/books/types';

interface GlobalSearchDialogProps {
  initialBooks?: BookListItem[];
}

interface NavRecommendation {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const RECOMMENDED_MENUS: NavRecommendation[] = [
  {
    title: 'Katalog Buku',
    description: 'Jelajahi seluruh koleksi buku terbitan & filter kategori',
    href: '/katalog',
    icon: Library,
  },
  {
    title: 'Artikel & Kabar Literasi',
    description: 'Esai sastra, resensi karya, dan kabar dunia kepenulisan',
    href: '/blog',
    icon: Newspaper,
  },
  {
    title: 'Tentang Kami',
    description: 'Visi, misi, dan profil penerbit Frasa Klausa Media',
    href: '/tentang-kami',
    icon: Compass,
  },
  {
    title: 'Kontak & Terbitkan Naskah',
    description: 'Konsultasi penerbitan, kirim naskah, dan kerja sama',
    href: '/kontak',
    icon: Phone,
  },
  {
    title: 'CMS Redaksi',
    description: 'Portal editorial dan manajemen konten (khusus redaktur)',
    href: '/login',
    icon: LogIn,
    badge: 'Redaktur',
  },
];

const POPULAR_CATEGORIES = [
  { name: 'Sastra & Klasik', href: '/kategori/sastra-klasik' },
  { name: 'Fiksi Kontemporer', href: '/kategori/fiksi-kontemporer' },
  { name: 'Non-Fiksi & Esai', href: '/kategori/non-fiksi-esai' },
  { name: 'Puisi & Sajak', href: '/kategori/puisi-sajak' },
  { name: 'Antologi Cerpen', href: '/kategori/antologi-cerpen' },
];

const FALLBACK_BOOKS: Partial<BookListItem>[] = [
  {
    id: 'fb-1',
    title: 'Jejak Sunyi di Sudut Kota',
    slug: 'jejak-sunyi-di-sudut-kota',
    author: 'Ahmad Farhan',
    cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
    price_regular: 88000,
    price_promo: 75000,
    category_name: 'Sastra & Klasik',
  },
  {
    id: 'fb-2',
    title: 'Risalah Hujan dan Kenangan',
    slug: 'risalah-hujan-dan-kenangan',
    author: 'Siti Nurhaliza A.',
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
    price_regular: 72000,
    price_promo: null,
    category_name: 'Puisi & Sajak',
  },
];

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

export function GlobalSearchDialog({ initialBooks = [] }: GlobalSearchDialogProps) {
  const router = useRouter();
  const { isSearchOpen, setSearchOpen } = useUIStore();

  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<GroupedSearchResults | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Rekomendasi buku (gunakan data server unggulan, fallback jika kosong)
  const recommendedBooks = React.useMemo(() => {
    if (initialBooks && initialBooks.length > 0) {
      return initialBooks;
    }
    return FALLBACK_BOOKS as BookListItem[];
  }, [initialBooks]);

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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

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
    router.push(`/buku/${slug}`);
  };

  const handleSelectPost = (slug: string) => {
    handleOpenChange(false);
    router.push(`/blog/${slug}`);
  };

  const handleNavigate = (href: string) => {
    handleOpenChange(false);
    router.push(href);
  };

  // Menu yang cocok saat pengguna mengetik kata kunci
  const matchingMenus = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return RECOMMENDED_MENUS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q)
    );
  }, [query]);

  // Kategori yang cocok saat pengguna mengetik kata kunci
  const matchingCategories = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return POPULAR_CATEGORIES.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [query]);

  const displayedResults = debouncedQuery.length >= 2 ? results : null;
  const isSearchLoading = debouncedQuery.length >= 2 ? isLoading : false;
  const isIdle = query.trim().length === 0;

  return (
    <CommandDialog open={isSearchOpen} onOpenChange={handleOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Pencarian Global Frasa Klausa Media</DialogTitle>
        <DialogDescription>
          Cari judul buku, penulis, kategori, dan artikel blog secara cepat.
        </DialogDescription>
      </DialogHeader>

      <CommandInput
        placeholder="Cari buku, penulis, artikel, atau ketik nama menu..."
        value={query}
        onValueChange={setQuery}
      />

      <CommandList className="max-h-[460px] p-2">
        {/* ============================================================ */}
        {/* 1. STATE IDLE: REKOMENDASI LENGKAP SAAT QUERY KOSONG       */}
        {/* ============================================================ */}
        {isIdle && (
          <div className="space-y-3 pb-2">
            {/* 1a. Rekomendasi Buku Pilihan */}
            {recommendedBooks.length > 0 && (
              <CommandGroup heading="Rekomendasi Buku Pilihan">
                {recommendedBooks.slice(0, 4).map((book) => {
                  const effectivePrice = book.price_promo ?? book.price_regular;
                  return (
                    <CommandItem
                      key={book.id}
                      value={`rec-book-${book.title}-${book.author || ''}`}
                      onSelect={() => handleSelectBook(book.slug)}
                      className="flex items-center gap-3 p-2.5 cursor-pointer rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-xs bg-muted border flex items-center justify-center shadow-2xs">
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium line-clamp-1 text-foreground">
                            {book.title}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-normal px-1.5 py-0 shrink-0 text-primary bg-primary/10 border-primary/20"
                          >
                            <Sparkles className="h-2.5 w-2.5 mr-0.5 inline" />
                            Pilihan
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {book.author || 'Penulis Frasa Klausa Media'}
                          {book.category_name ? ` • ${book.category_name}` : ''}
                        </p>
                      </div>
                      {effectivePrice !== undefined && effectivePrice !== null && (
                        <div className="text-right shrink-0">
                          {book.price_promo ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-semibold text-primary">
                                {formatRupiah(book.price_promo)}
                              </span>
                              <span className="text-[10px] text-muted-foreground line-through">
                                {formatRupiah(book.price_regular)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-foreground">
                              {formatRupiah(book.price_regular)}
                            </span>
                          )}
                        </div>
                      )}
                    </CommandItem>
                  );
                })}

                <CommandItem
                  value="nav-semua-buku"
                  onSelect={() => handleNavigate('/katalog')}
                  className="flex items-center justify-between p-2 text-xs text-primary font-medium cursor-pointer rounded-md hover:bg-primary/5 mt-1"
                >
                  <span className="flex items-center gap-2">
                    <Library className="h-3.5 w-3.5" />
                    Lihat Semua Koleksi di Katalog Buku
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </CommandItem>
              </CommandGroup>
            )}

            <CommandSeparator />

            {/* 1b. Menu Navigasi Rekomendasi */}
            <CommandGroup heading="Navigasi & Menu Cepat">
              {RECOMMENDED_MENUS.map((menu) => {
                const IconComponent = menu.icon;
                return (
                  <CommandItem
                    key={menu.href}
                    value={`menu-${menu.title}-${menu.description}`}
                    onSelect={() => handleNavigate(menu.href)}
                    className="flex items-center gap-3 p-2.5 cursor-pointer rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-md bg-muted/70 border flex items-center justify-center text-muted-foreground">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{menu.title}</p>
                        {menu.badge && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                            {menu.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {menu.description}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            {/* 1c. Kategori Populer */}
            <CommandGroup heading="Jelajahi Kategori Populer">
              <div className="flex flex-wrap gap-1.5 p-2">
                {POPULAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.href}
                    type="button"
                    onClick={() => handleNavigate(cat.href)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors cursor-pointer text-muted-foreground"
                  >
                    <Tag className="h-3 w-3" />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </CommandGroup>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. STATE KETIK MINIMAL: Belum 2 Karakter                     */}
        {/* ============================================================ */}
        {query.trim().length > 0 && query.trim().length < 2 && (
          <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1">
            <Search className="h-4 w-4 opacity-40 mb-1" />
            <p>Ketik minimal 2 karakter untuk menelusuri katalog buku & artikel...</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. MENU/KATEGORI YANG COCOK DENGAN KATA KUNCI (Instant UI)  */}
        {/* ============================================================ */}
        {query.trim().length > 0 && matchingMenus.length > 0 && (
          <CommandGroup heading="Menu & Halaman yang Cocok">
            {matchingMenus.map((menu) => {
              const IconComponent = menu.icon;
              return (
                <CommandItem
                  key={menu.href}
                  value={`match-menu-${menu.title}`}
                  onSelect={() => handleNavigate(menu.href)}
                  className="flex items-center gap-3 p-2 cursor-pointer rounded-md hover:bg-accent"
                >
                  <div className="h-7 w-7 shrink-0 rounded-md bg-muted/70 border flex items-center justify-center text-muted-foreground">
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{menu.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {menu.description}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {query.trim().length > 0 && matchingCategories.length > 0 && (
          <CommandGroup heading="Kategori Terkait">
            {matchingCategories.map((cat) => (
              <CommandItem
                key={cat.href}
                value={`match-cat-${cat.name}`}
                onSelect={() => handleNavigate(cat.href)}
                className="flex items-center gap-2 p-2 cursor-pointer rounded-md hover:bg-accent"
              >
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">Kategori Buku</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* ============================================================ */}
        {/* 4. STATE LOADING PENCARIAN SERVER                           */}
        {/* ============================================================ */}
        {isSearchLoading && (
          <div className="space-y-3 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Mencari &quot;{debouncedQuery}&quot; di katalog & blog...</span>
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

        {/* ============================================================ */}
        {/* 5. STATE ERROR                                               */}
        {/* ============================================================ */}
        {errorMessage && !isSearchLoading && (
          <div className="flex items-center gap-2 p-4 text-xs text-destructive bg-destructive/10 rounded-md my-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. STATE EMPTY (0 Hasil) + Rekomendasi Penyelamat           */}
        {/* ============================================================ */}
        {!isSearchLoading &&
          !errorMessage &&
          debouncedQuery.length >= 2 &&
          displayedResults &&
          displayedResults.total === 0 &&
          matchingMenus.length === 0 &&
          matchingCategories.length === 0 && (
            <div className="py-6 px-4 text-center space-y-4">
              <CommandEmpty className="py-2 text-xs text-muted-foreground">
                Tidak ditemukan buku atau artikel yang cocok dengan &quot;{debouncedQuery}&quot;.
              </CommandEmpty>
              <div className="p-3 rounded-lg border bg-muted/30 text-left space-y-2">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Rekomendasi Pintas:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/katalog')}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-background border hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Library className="h-3 w-3 text-primary" />
                    Buka Katalog Lengkap
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/blog')}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-background border hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Newspaper className="h-3 w-3 text-primary" />
                    Artikel Blog Terbaru
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/kontak')}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-background border hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Phone className="h-3 w-3 text-primary" />
                    Hubungi Redaksi
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* ============================================================ */}
        {/* 7. HASIL PENCARIAN SERVER: BUKU & POST                      */}
        {/* ============================================================ */}
        {!isSearchLoading && displayedResults && displayedResults.total > 0 && (
          <>
            {displayedResults.books.length > 0 && (
              <CommandGroup heading={`Buku Ditemukan (${displayedResults.books.length})`}>
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

            {displayedResults.books.length > 0 && displayedResults.posts.length > 0 && (
              <CommandSeparator />
            )}

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
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0 text-muted-foreground font-normal"
                      >
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
          <span>Navigasi</span>
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            ↑
          </kbd>
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            ↓
          </kbd>
        </div>
        <div className="flex items-center gap-2">
          <span>Pilih</span>
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Enter ↵
          </kbd>
          <span>Tutup</span>
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            ESC
          </kbd>
        </div>
      </div>
    </CommandDialog>
  );
}
