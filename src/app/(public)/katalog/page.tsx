import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import { getPublicBooks, getBookCategoriesOptions } from '@/lib/books/data-access';
import { publicCatalogQuerySchema } from '@/validations/book';
import { BookCard } from '@/components/public/book-card';
import { KatalogFilterBar } from '@/components/public/katalog-filter-bar';
import { KatalogSortSelect } from '@/components/public/katalog-sort-select';
import { Pagination } from '@/components/public/pagination';
import { OFFICIAL_IDENTITY } from '@/constants';

import { Suspense } from 'react';
import { connection } from 'next/server';
import { KatalogLoadingFallback } from './loading';

interface KatalogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: KatalogPageProps): Promise<Metadata> {
  const rawParams = await searchParams;
  const parsed = publicCatalogQuerySchema.parse(rawParams);

  // Hindari indexing duplikat untuk kombinasi filter rentang harga / pencarian tertentu (Tahap 12 alignment)
  const isFiltered = Boolean(parsed.kategori || parsed.minPrice || parsed.maxPrice || parsed.q);

  let categoryLabel: string | null = null;
  if (parsed.kategori) {
    const categories = await getBookCategoriesOptions();
    const matched = categories.find(
      (c) =>
        c.slug.toLowerCase() === parsed.kategori!.toLowerCase() ||
        c.name.toLowerCase() === parsed.kategori!.toLowerCase() ||
        c.id.toLowerCase() === parsed.kategori!.toLowerCase()
    );
    categoryLabel = matched ? matched.name : parsed.kategori;
  }

  const title = categoryLabel
    ? `Katalog Buku Kategori ${categoryLabel} | ${OFFICIAL_IDENTITY.COMPANY_NAME}`
    : `Katalog Buku Lengkap | ${OFFICIAL_IDENTITY.COMPANY_NAME}`;
  const description = categoryLabel
    ? `Jelajahi karya sastra dan buku berkualitas kategori ${categoryLabel} terbitan Frasa Klausa Media.`
    : 'Jelajahi karya sastra, novel, antologi puisi, dan buku berkualitas terbitan Frasa Klausa Media dengan filter kategori dan rentang harga.';

  return {
    title,
    description,
    alternates: {
      canonical: '/katalog',
    },
    openGraph: {
      type: 'website',
      url: '/katalog',
      title,
      description,
      images: [{ url: '/logo/logo-landscape.jpg', width: 1200, height: 630, alt: 'Katalog Buku Frasa Klausa Media' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo/logo-landscape.jpg'],
    },
    robots: isFiltered
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

async function KatalogContent({ searchParams }: KatalogPageProps) {
  await connection();
  const rawParams = await searchParams;
  const queryParams = publicCatalogQuerySchema.parse(rawParams);

  const [booksResponse, categories] = await Promise.all([
    getPublicBooks(queryParams),
    getBookCategoriesOptions(),
  ]);

  const { items: books, totalCount, page, pageCount } = booksResponse;

  const currentCategoryObj = categories.find(
    (c) =>
      c.slug.toLowerCase() === (queryParams.kategori || '').toLowerCase() ||
      c.name.toLowerCase() === (queryParams.kategori || '').toLowerCase() ||
      c.id.toLowerCase() === (queryParams.kategori || '').toLowerCase()
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* 1. Header & Breadcrumb */}
      <div className="space-y-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors">
            Beranda
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          {currentCategoryObj ? (
            <>
              <Link href="/katalog" className="hover:text-foreground transition-colors">
                Katalog Buku
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="font-semibold text-primary">{currentCategoryObj.name}</span>
            </>
          ) : (
            <span className="font-semibold text-foreground">Katalog Buku</span>
          )}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
              {currentCategoryObj ? `Kategori: ${currentCategoryObj.name}` : 'Katalog Buku'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
              {currentCategoryObj
                ? `Menampilkan koleksi buku pilihan dalam kategori ${currentCategoryObj.name} terbitan Frasa Klausa Media.`
                : 'Menampilkan karya-karya sastra dan buku pilihan kurator terbitan Frasa Klausa Media.'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground font-medium self-start sm:self-auto bg-muted/60 px-3.5 py-1.5 rounded-full border">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Total <strong>{totalCount}</strong> judul buku</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar Interaktif */}
      <KatalogFilterBar
        categories={categories}
        currentCategory={queryParams.kategori}
        currentMinPrice={queryParams.minPrice}
        currentMaxPrice={queryParams.maxPrice}
        currentQ={queryParams.q}
      />

      {/* 3. Toolbar Hasil & Pengurutan */}
      <div className="flex items-center justify-between border-b pb-4 gap-4">
        <span className="text-xs text-muted-foreground font-medium">
          Halaman <strong className="text-foreground">{page}</strong> dari <strong>{pageCount}</strong>
        </span>
        <KatalogSortSelect currentSort={queryParams.sort} />
      </div>

      {/* 4. Grid Kartu Buku */}
      {books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        /* Empty State yang Ramah */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 px-4 text-center bg-muted/15">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-serif font-bold text-foreground">
            Tidak ada buku yang sesuai kriteria
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {currentCategoryObj
              ? `Belum ada buku yang diterbitkan dalam kategori "${currentCategoryObj.name}". Coba sesuaikan filter atau lihat kategori lain.`
              : 'Coba sesuaikan kata kunci pencarian, ubah rentang harga, atau reset filter untuk melihat koleksi lainnya.'}
          </p>
          <div className="mt-6">
            <Link
              href="/katalog"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
            >
              Kembalikan ke Semua Buku
            </Link>
          </div>
        </div>
      )}

      {/* 5. Pagination */}
      <Pagination
        currentPage={page}
        pageCount={pageCount}
        basePath="/katalog"
        searchParams={{
          q: queryParams.q || undefined,
          kategori: queryParams.kategori,
          minPrice: queryParams.minPrice,
          maxPrice: queryParams.maxPrice,
          sort: queryParams.sort !== 'created_at_desc' ? queryParams.sort : undefined,
        }}
      />
    </div>
  );
}

export default function PublicKatalogPage({ searchParams }: KatalogPageProps) {
  return (
    <Suspense fallback={<KatalogLoadingFallback />}>
      <KatalogContent searchParams={searchParams} />
    </Suspense>
  );
}
