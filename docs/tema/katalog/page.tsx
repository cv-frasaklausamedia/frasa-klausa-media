import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { OFFICIAL_IDENTITY } from '@/constants';
import { getBooksList, getAllBookCategories } from '@/lib/books/data-access';
import {
  BookOpen,
  Search,
  BookMarked,
  Calendar,
  User,
  ShoppingBag,
  Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
  title: 'Katalog Buku | Frasa Klausa Media',
  description:
    'Jelajahi karya-karya sastra, novel, antologi puisi, buku referensi, dan tulisan berkualitas terbitan CV Frasa Klausa Media.',
  openGraph: {
    title: 'Katalog Buku | Frasa Klausa Media',
    description:
      'Jelajahi karya-karya sastra, novel, antologi puisi, buku referensi, dan tulisan berkualitas terbitan CV Frasa Klausa Media.',
  },
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function formatRupiah(amount?: number | null): string {
  if (!amount || amount <= 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PublicKatalogPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const page = typeof rawParams.page === 'string' ? Number(rawParams.page) || 1 : 1;
  const categoryId = typeof rawParams.kategori === 'string' ? rawParams.kategori : undefined;
  const q = typeof rawParams.q === 'string' ? rawParams.q : undefined;

  const [booksResult, categories] = await Promise.all([
    getBooksList({
      page,
      pageSize: 10,
      q: q || '',
      category_id: categoryId,
      status: 'published',
      sort: 'created_at.desc',
    }),
    getAllBookCategories(),
  ]);

  const { items: books, totalCount, pageCount } = booksResult;

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* 1. Header Publik Konsisten */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">
                {OFFICIAL_IDENTITY.COMPANY_NAME}
              </span>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Penerbit Buku & Media Literasi
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Beranda
            </Link>
            <Link
              href="/katalog"
              className="text-sm font-semibold text-primary transition-colors px-2 py-1 border-b-2 border-primary"
            >
              Katalog
            </Link>
            <Link
              href="/tentang-kami"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Tentang Kami
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Blog
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* 2. Hero Section Katalog */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/30 to-background py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center space-y-4">
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            Koleksi Terbitan
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight font-serif">
            Katalog Buku Resmi
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Temukan ragam karya naskah fiksi, non-fiksi, puisi, dan buku akademik persembahan para penulis terbaik Frasa Klausa Media.
          </p>

          {/* Form Pencarian */}
          <div className="pt-4 max-w-xl mx-auto">
            <form method="GET" action="/katalog" className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                name="q"
                defaultValue={q || ''}
                placeholder="Cari judul buku, nama penulis, atau ISBN..."
                className="pl-10 pr-24 h-11 rounded-full bg-card shadow-xs"
              />
              {categoryId && (
                <input type="hidden" name="kategori" value={categoryId} />
              )}
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 h-8 rounded-full px-4 text-xs font-medium"
              >
                Cari
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* 3. Filter Kategori & Galeri Buku */}
      <section className="py-10 md:py-14 flex-1">
        <div className="mx-auto max-w-6xl px-6 space-y-8">
          {/* Filter Pills Kategori */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 mr-1" />
            <Button
              asChild
              variant={!categoryId ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs shrink-0"
            >
              <Link href={q ? `/katalog?q=${encodeURIComponent(q)}` : '/katalog'}>
                Semua Kategori ({totalCount})
              </Link>
            </Button>
            {categories.map((cat) => {
              const isActive = categoryId === cat.id;
              const href = q
                ? `/katalog?kategori=${cat.id}&q=${encodeURIComponent(q)}`
                : `/katalog?kategori=${cat.id}`;
              return (
                <Button
                  key={cat.id}
                  asChild
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs shrink-0"
                >
                  <Link href={href}>{cat.name}</Link>
                </Button>
              );
            })}
          </div>

          {/* Grid Buku */}
          {books.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-16 text-center space-y-3">
              <BookMarked className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-base font-semibold">Belum Ada Buku Ditemukan</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {q
                  ? `Tidak ada buku yang sesuai dengan pencarian "${q}". Coba kata kunci lain atau pilih semua kategori.`
                  : 'Katalog buku saat ini sedang diperbarui oleh redaksi.'}
              </p>
              {(q || categoryId) && (
                <Button asChild variant="outline" size="sm" className="mt-2 text-xs">
                  <Link href="/katalog">Reset Filter</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {books.map((book) => {
                const hasPromo = book.price_promo !== null && book.price_promo < book.price_regular;
                return (
                  <div
                    key={book.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition hover:shadow-md"
                  >
                    {/* Cover Buku */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <BookOpen className="h-10 w-10 opacity-30" />
                        </div>
                      )}
                      {book.is_featured && (
                        <span className="absolute top-2.5 left-2.5 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-xs">
                          Unggulan
                        </span>
                      )}
                      {hasPromo && (
                        <span className="absolute top-2.5 right-2.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          Promo
                        </span>
                      )}
                    </div>

                    {/* Informasi Buku */}
                    <div className="flex flex-1 flex-col p-4 justify-between space-y-3">
                      <div className="space-y-1.5">
                        {book.category && (
                          <p className="text-[11px] font-medium text-primary">
                            {book.category.name}
                          </p>
                        )}
                        <h2 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {book.title}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{book.author}</span>
                        </div>
                        {book.publish_year && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>Tahun {book.publish_year}</span>
                          </div>
                        )}
                      </div>

                      {/* Harga & Tombol Pesan */}
                      <div className="pt-2 border-t space-y-2">
                        <div className="flex items-baseline gap-2">
                          {hasPromo ? (
                            <>
                              <span className="text-sm font-extrabold text-foreground">
                                {formatRupiah(book.price_promo)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                {formatRupiah(book.price_regular)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-foreground">
                              {formatRupiah(book.price_regular)}
                            </span>
                          )}
                        </div>

                        <Button asChild size="sm" className="w-full gap-1.5 text-xs h-8">
                          <Link
                            href={`https://wa.me/6281380604256?text=${encodeURIComponent(
                              `Halo Admin CV Frasa Klausa Media, saya berminat membeli buku "${book.title}" (ISBN: ${book.isbn || '-'}). Bagaimana ketersediaan stoknya?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Pesan via WhatsApp
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginasi Sederhana */}
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              {page > 1 && (
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <Link
                    href={`/katalog?page=${page - 1}${categoryId ? `&kategori=${categoryId}` : ''}${
                      q ? `&q=${encodeURIComponent(q)}` : ''
                    }`}
                  >
                    Sebelumnya
                  </Link>
                </Button>
              )}
              <span className="text-xs text-muted-foreground px-3">
                Halaman {page} dari {pageCount}
              </span>
              {page < pageCount && (
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <Link
                    href={`/katalog?page=${page + 1}${categoryId ? `&kategori=${categoryId}` : ''}${
                      q ? `&q=${encodeURIComponent(q)}` : ''
                    }`}
                  >
                    Selanjutnya
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Footer Publik */}
      <footer className="border-t py-8 text-xs text-muted-foreground text-center">
        <p>
          {OFFICIAL_IDENTITY.COMPANY_NAME} &copy; {new Date().getFullYear()} &mdash; All Rights Reserved.
        </p>
      </footer>
    </main>
  );
}
