import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, RotateCcw } from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { blogCategoryQuerySchema } from '@/validations/blog-category';
import { getBlogCategoryList } from '@/lib/blog-categories/data-access';
import type { BlogCategoryListResponse } from '@/lib/blog-categories/types';
import { Button } from '@/components/ui/button';
import { BlogCategoryTable } from './_components/blog-category-table';
import BlogCategoriesLoading from './loading';

export const metadata: Metadata = {
  title: 'Kategori Blog | Admin Frasa Klausa Media',
  description: 'Kelola taksonomi kategori artikel blog, slug URL ramah SEO, dan topik literasi Frasa Klausa Media.',
};

interface BlogCategoriesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function BlogCategoriesContent({ searchParams }: BlogCategoriesPageProps) {
  // Opt-in ke dynamic request-time rendering untuk Next.js 16 Partial Prerendering (PPR)
  await connection();
  await requireAdmin();

  const rawParams = await searchParams;

  // Validasi defensif parameter URL query string menggunakan skema Zod (PRD §15.4)
  const queryParams = blogCategoryQuerySchema.parse(rawParams);

  let categoryData: BlogCategoryListResponse | null = null;
  let hasError = false;

  try {
    categoryData = await getBlogCategoryList(queryParams);
  } catch (error) {
    console.error('[BlogCategoriesPage] Error loading blog category list:', error);
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
              Gagal Memuat Data Kategori Blog
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Terjadi kendala saat menghubungi basis data. Silakan periksa koneksi atau muat ulang halaman.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/admin/blog-categories">
              <RotateCcw className="mr-2 h-4 w-4" /> Coba Lagi
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <BlogCategoryTable initialData={categoryData} />;
}

export default function BlogCategoriesPage({
  searchParams,
}: BlogCategoriesPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Kategori Blog
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola struktur topik artikel literasi, berita peluncuran, dan slug URL ramah SEO.
        </p>
      </div>

      <Suspense fallback={<BlogCategoriesLoading />}>
        <BlogCategoriesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
