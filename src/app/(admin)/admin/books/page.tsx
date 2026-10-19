import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, RotateCcw } from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { bookQuerySchema } from '@/validations/book';
import { getAdminBooks, getBookCategoriesOptions } from '@/lib/books/data-access';
import type { BookListResponse, BookCategoryOption } from '@/lib/books/types';
import { Button } from '@/components/ui/button';
import { BookTable } from './_components/book-table';
import BooksLoading from './loading';

export const metadata: Metadata = {
  title: 'Katalog Buku — Admin Frasa Klausa Media',
  description: 'Kelola inventaris dan katalog buku, sampul, spesifikasi ISBN, serta status publikasi.',
};

interface AdminBooksPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function BooksContent({ searchParams }: AdminBooksPageProps) {
  // Opt-in ke dynamic request-time rendering untuk Next.js 16 Partial Prerendering (PPR)
  await connection();
  await requireAdmin();

  const rawParams = await searchParams;

  // Validasi defensif parameter URL query string menggunakan Zod (PRD §15.4)
  const queryParams = bookQuerySchema.parse(rawParams);

  let bookData: BookListResponse | null = null;
  let categories: BookCategoryOption[] = [];
  let hasError = false;

  try {
    const [fetchedBooks, fetchedCategories] = await Promise.all([
      getAdminBooks(queryParams),
      getBookCategoriesOptions(),
    ]);
    bookData = fetchedBooks;
    categories = fetchedCategories;
  } catch (error) {
    console.error('[AdminBooksPage] Error loading book list:', error);
    hasError = true;
  }


  if (hasError || !bookData) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Gagal Memuat Data Buku
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Terjadi kendala saat menghubungi basis data. Silakan periksa koneksi atau muat ulang halaman.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/admin/books">
              <RotateCcw className="mr-2 h-4 w-4" /> Coba Lagi
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <BookTable initialData={bookData} categories={categories} />;
}

export default function AdminBooksPage({ searchParams }: AdminBooksPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Katalog Buku
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola publikasi buku, sampul, spesifikasi ISBN, penetapan harga, dan tautan checkout multi-kanal.
        </p>
      </div>

      <Suspense fallback={<BooksLoading />}>
        <BooksContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
