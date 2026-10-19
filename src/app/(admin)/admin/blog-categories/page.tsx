import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { Bookmark } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { UnderDevelopment } from '@/components/admin/under-development';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Kategori Blog — Admin Frasa Klausa Media',
  description: 'Kelola taksonomi kategori artikel blog, slug URL, dan pengaturan SEO artikel Frasa Klausa Media.',
};

async function BlogCategoriesContent() {
  await connection();
  await requireAdmin();

  return (
    <UnderDevelopment
      title="Kategori Artikel Blog"
      description="Atur struktur pengelompokan artikel blog, topik bahasan sastra, slug URL ramah SEO, dan taksonomi konten literasi."
      icon={Bookmark}
      estimatedPhase="Tahap 6 — Manajemen Blog & Taksonomi Konten"
      plannedFeatures={[
        'CRUD data kategori blog (disimpan terpisah di tabel blog_categories dari kategori buku)',
        'Generasi otomatis slug URL ramah SEO dengan validasi keunikan berbasis Zod & Supabase',
        'Pengaturan metadata SEO khusus kategori (meta title, deskripsi, dan canonical URL)',
        'Pemantauan jumlah artikel aktif yang terhubung pada setiap kategori secara real-time',
        'Validasi perlindungan integritas relasi: pencegahan hapus kategori bila masih ada artikel',
        'Tabel data interaktif dengan fitur pencarian instan dan penyortiran urutan tampilan',
      ]}
    />
  );
}

export default function AdminBlogCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-5xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <BlogCategoriesContent />
    </Suspense>
  );
}
