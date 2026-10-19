import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getBlogCategoriesOptions } from '@/lib/posts/data-access';
import { PostForm } from '../_components/post-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Tulis Artikel Baru — Admin Frasa Klausa Media',
  description: 'Tulis dan publikasikan artikel literasi baru ke blog Frasa Klausa Media.',
};

function NewPostSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center pb-4 border-b">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function NewPostContent() {
  await connection();
  const admin = await requireAdmin();
  const categories = await getBlogCategoriesOptions();

  // Ambil nama profil admin jika ada
  const defaultAuthor = admin.email.split('@')[0] || 'Admin Editorial';

  return <PostForm categories={categories} defaultAuthorName={defaultAuthor} />;
}

export default function NewPostPage() {
  return (
    <Suspense fallback={<NewPostSkeleton />}>
      <NewPostContent />
    </Suspense>
  );
}
