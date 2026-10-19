import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { UnderDevelopment } from '@/components/admin/under-development';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Artikel Blog — Admin Frasa Klausa Media',
  description: 'Kelola artikel literasi, berita peluncuran buku, dan publikasi opini Frasa Klausa Media.',
};

async function BlogContent() {
  await connection();
  await requireAdmin();

  return (
    <UnderDevelopment
      title="Artikel & Publikasi Blog"
      description="Tulis dan kelola artikel literasi, berita peluncuran buku, ulasan karya, dan opini editorial dengan editor visual modern."
      icon={FileText}
      estimatedPhase="Tahap 6 — Manajemen Blog & Rich Text Editor Tiptap"
      plannedFeatures={[
        'CRUD artikel literasi, liputan acara, dan esai sastra/opini pembaca',
        'Editor visual Tiptap Rich Text Editor (heading, list, gambar embed, quote, dan link)',
        'Sanitasi ketat output HTML di server menggunakan isomorphic-dompurify untuk proteksi keamanan XSS',
        'Penetapan nama penulis artikel (author_name) fleksibel untuk mengakomodasi kontributor tamu',
        'Unggah thumbnail artikel ke Supabase Storage dengan rasio gambar 16:9 yang teroptimasi',
        'Estimasi waktu baca otomatis (reading time) yang dihitung berdasarkan kepadatan kata',
        'Manajemen status publikasi: Simpan Draf (Draft) atau Terbitkan (Published)',
        'Pengaturan metadata SEO artikel (Open Graph title, description, dan slug URL unik)',
      ]}
    />
  );
}

export default function AdminBlogPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-5xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <BlogContent />
    </Suspense>
  );
}
