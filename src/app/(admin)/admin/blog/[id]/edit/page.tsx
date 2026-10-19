import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getPostById, getBlogCategoriesOptions } from '@/lib/posts/data-access';
import { PostForm } from '../../_components/post-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Ubah Artikel — Admin Frasa Klausa Media',
  description: 'Perbarui artikel blog dan publikasi Frasa Klausa Media.',
  robots: {
    index: false,
    follow: false,
  },
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

function EditPostSkeleton() {
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

async function EditPostContent({ params }: EditPostPageProps) {
  await connection();
  await requireAdmin();

  const { id } = await params;

  if (!id || !UUID_REGEX.test(id)) {
    notFound();
  }

  const [post, categories] = await Promise.all([
    getPostById(id),
    getBlogCategoriesOptions(),
  ]);

  if (!post) {
    notFound();
  }

  return <PostForm initialData={post} categories={categories} />;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  return (
    <Suspense fallback={<EditPostSkeleton />}>
      <EditPostContent params={params} />
    </Suspense>
  );
}
