import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, RotateCcw } from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { postQuerySchema } from '@/validations/post';
import { getAdminPosts, getBlogCategoriesOptions } from '@/lib/posts/data-access';
import type { PostListResponse, BlogCategoryOption } from '@/lib/posts/types';
import { Button } from '@/components/ui/button';
import { PostTable } from './_components/post-table';
import BlogLoading from './loading';

export const metadata: Metadata = {
  title: 'Artikel Blog — Admin Frasa Klausa Media',
  description: 'Kelola artikel literasi, berita peluncuran buku, dan opini editorial dengan editor visual modern.',
};

interface AdminBlogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function BlogContent({ searchParams }: AdminBlogPageProps) {
  // Opt-in ke dynamic request-time rendering untuk Partial Prerendering
  await connection();
  await requireAdmin();

  const rawParams = await searchParams;

  // Validasi defensif parameter URL query string menggunakan Zod (PRD §15.4)
  const queryParams = postQuerySchema.parse(rawParams);

  let postData: PostListResponse | null = null;
  let categories: BlogCategoryOption[] = [];
  let hasError = false;

  try {
    const [fetchedPosts, fetchedCategories] = await Promise.all([
      getAdminPosts(queryParams),
      getBlogCategoriesOptions(),
    ]);
    postData = fetchedPosts;
    categories = fetchedCategories;
  } catch (error) {
    console.error('[AdminBlogPage] Error loading blog list:', error);
    hasError = true;
  }

  if (hasError || !postData) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Gagal Memuat Data Artikel
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Terjadi kendala saat menghubungi basis data. Silakan periksa koneksi atau muat ulang halaman.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/admin/blog">
              <RotateCcw className="mr-2 h-4 w-4" /> Coba Lagi
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <PostTable initialData={postData} categories={categories} />;
}

export default function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Artikel & Publikasi Blog
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tulis dan kelola artikel literasi, berita peluncuran buku, ulasan karya, dan opini editorial dengan editor Tiptap modern.
        </p>
      </div>

      <Suspense fallback={<BlogLoading />}>
        <BlogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
