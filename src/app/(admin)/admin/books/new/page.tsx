import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getBookCategoriesOptions } from '@/lib/books/data-access';
import { BookForm } from '../_components/book-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Tambah Buku Baru — Admin Frasa Klausa Media',
  description: 'Tambah buku baru ke katalog Frasa Klausa Media.',
};

function NewBookSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center pb-4 border-b">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function NewBookContent() {
  await connection();
  await requireAdmin();

  const categories = await getBookCategoriesOptions();

  return <BookForm categories={categories} />;
}

export default function NewBookPage() {
  return (
    <Suspense fallback={<NewBookSkeleton />}>
      <NewBookContent />
    </Suspense>
  );
}
