import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Layers, BookOpen } from 'lucide-react';
import { getCategoryBySlug } from '@/lib/categories/data-access';
import { getPublicBooks } from '@/lib/books/data-access';
import { publicCatalogQuerySchema } from '@/validations/book';
import { BookCard } from '@/components/public/book-card';
import { Pagination } from '@/components/public/pagination';
import { JsonLd } from '@/components/public/json-ld';
import { buildBreadcrumbJsonLd } from '@/lib/seo/json-ld';
import { OFFICIAL_IDENTITY } from '@/constants';
import { getFallbackOpenGraphImage } from '@/lib/seo/open-graph';

import { Suspense } from 'react';
import { connection } from 'next/server';
import { KatalogLoadingFallback } from '../../katalog/loading';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const rawParams = await searchParams;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: `Kategori Tidak Ditemukan | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    };
  }

  const isFiltered = Boolean(
    rawParams.minPrice || rawParams.maxPrice || rawParams.q || (rawParams.page && Number(rawParams.page) > 1)
  );

  const title = category.seo_title || `Katalog Buku Kategori ${category.name} | ${OFFICIAL_IDENTITY.COMPANY_NAME}`;
  const description =
    category.seo_description ||
    category.description ||
    `Temukan seluruh buku berkualitas kategori ${category.name} terbitan Frasa Klausa Media.`;
  const image = getFallbackOpenGraphImage(category.name);

  return {
    title,
    description,
    alternates: {
      canonical: `/kategori/${slug}`,
    },
    openGraph: {
      type: 'website',
      url: `/kategori/${slug}`,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
    robots: isFiltered
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

async function CategoryContent({ params, searchParams }: CategoryPageProps) {
  await connection();
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const rawParams = await searchParams;
  const queryParams = publicCatalogQuerySchema.parse({
    ...rawParams,
    kategori: slug,
  });

  const booksResponse = await getPublicBooks(queryParams);
  const { items: books, totalCount, page, pageCount } = booksResponse;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frasaklausamedia.com';
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Beranda', url: '/' },
      { name: 'Katalog Buku', url: '/katalog' },
      { name: category.name, url: `/kategori/${category.slug}` },
    ],
    baseUrl
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <JsonLd data={breadcrumbJsonLd} />
      {/* 1. Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/katalog" className="hover:text-foreground transition-colors">
          Katalog Buku
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">{category.name}</span>
      </nav>

      {/* 2. Header Kategori */}
      <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          <Layers className="h-3.5 w-3.5" />
          Kategori Buku
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {category.description}
          </p>
        )}
        <div className="mt-4 text-xs font-medium text-foreground/80">
          Menampilkan {totalCount} buku dalam kategori ini
        </div>
      </div>

      {/* 3. Grid Buku */}
      {books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 px-4 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h2 className="text-base font-serif font-bold text-foreground">
            Belum ada buku dalam kategori ini
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Koleksi buku untuk kategori ini sedang dalam tahap persiapan terbit.
          </p>
          <div className="mt-4">
            <Link
              href="/katalog"
              className="text-xs font-semibold text-primary underline underline-offset-4"
            >
              Lihat Kategori Lain di Katalog
            </Link>
          </div>
        </div>
      )}

      {/* 4. Pagination */}
      <Pagination
        currentPage={page}
        pageCount={pageCount}
        basePath={`/kategori/${slug}`}
        searchParams={{
          sort: queryParams.sort !== 'created_at_desc' ? queryParams.sort : undefined,
        }}
      />
    </div>
  );
}

export default function CategoryPage({ params, searchParams }: CategoryPageProps) {
  return (
    <Suspense fallback={<KatalogLoadingFallback />}>
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

