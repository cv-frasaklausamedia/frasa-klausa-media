import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getBookById, getBookCategoriesOptions } from '@/lib/books/data-access';
import { BookForm } from '../../_components/book-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Edit Buku — Admin Frasa Klausa Media',
  description: 'Perbarui informasi dan katalog buku Frasa Klausa Media.',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface EditBookPageProps {
  params: Promise<{ id: string }>;
}

function EditBookSkeleton() {
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

async function EditBookContent({ params }: EditBookPageProps) {
  await connection();
  await requireAdmin();

  const { id } = await params;

  // Validasi ID sebagai UUID yang valid
  if (!id || !UUID_REGEX.test(id)) {
    notFound();
  }

  const [book, categories] = await Promise.all([
    getBookById(id),
    getBookCategoriesOptions(),
  ]);

  if (!book) {
    notFound();
  }

  return <BookForm initialData={book} categories={categories} />;
}

export default function EditBookPage({ params }: EditBookPageProps) {
  return (
    <Suspense fallback={<EditBookSkeleton />}>
      <EditBookContent params={params} />
    </Suspense>
  );
}
