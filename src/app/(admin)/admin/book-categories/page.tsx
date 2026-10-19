import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, RotateCcw } from 'lucide-react';

import { categoryQuerySchema } from '@/validations/category';
import { getCategoryList } from '@/lib/categories/data-access';
import type { CategoryListResponse } from '@/lib/categories/types';
import { Button } from '@/components/ui/button';
import { CategoryTable } from './_components/category-table';
import BookCategoriesLoading from './loading';

export const metadata: Metadata = {
  title: 'Kategori Buku | Admin Frasa Klausa Media',
  description: 'Kelola kategori buku, slug URL, dan pengaturan SEO katalog Frasa Klausa Media.',
};

interface BookCategoriesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function BookCategoriesContent({ searchParams }: BookCategoriesPageProps) {
  // Opt-in ke dynamic request-time rendering untuk Next.js 16 Partial Prerendering (PPR)
  await connection();

  const rawParams = await searchParams;

  // Validasi defensif parameter URL query string menggunakan skema Zod (PRD §15.4)
  const queryParams = categoryQuerySchema.parse(rawParams);

  let categoryData: CategoryListResponse | null = null;
  let hasError = false;

  try {
    categoryData = await getCategoryList(queryParams);
  } catch (error) {
    console.error('[BookCategoriesPage] Error loading category list:', error);
    hasError = true;
  }

  if (hasError || !categoryData) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Gagal Memuat Data Kategori
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Terjadi kendala saat menghubungi basis data. Silakan periksa koneksi atau muat ulang halaman.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/admin/book-categories">
              <RotateCcw className="mr-2 h-4 w-4" /> Coba Lagi
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <CategoryTable initialData={categoryData} />;
}

export default function BookCategoriesPage({
  searchParams,
}: BookCategoriesPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Kategori Buku
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola kategori inventaris buku, pengaturan slug URL ramah SEO, dan struktur taksonomi katalog.
        </p>
      </div>

      <Suspense fallback={<BookCategoriesLoading />}>
        <BookCategoriesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
