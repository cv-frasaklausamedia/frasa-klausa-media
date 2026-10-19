import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { PanelsTopLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { UnderDevelopment } from '@/components/admin/under-development';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Konten Halaman — Admin Frasa Klausa Media',
  description: 'Kelola konten teks, narasi profil, informasi kontak, dan media pada halaman publik tanpa koding.',
};

async function SiteContentContent() {
  await connection();
  await requireAdmin();

  return (
    <UnderDevelopment
      title="Manajemen Konten Halaman Publik"
      description="Perbarui narasi penerbit, teks Hero beranda, profil 'Tentang Kami', informasi kontak kantor, dan media sosial tanpa menyentuh kode sumber."
      icon={PanelsTopLeft}
      estimatedPhase="Tahap 7 — CMS Konten Halaman Publik & Profil Penerbit"
      plannedFeatures={[
        'Kustomisasi Hero Section Beranda: Judul utama, sub-judul, tombol aksi (CTA), dan gambar latar',
        'Pengelolaan konten halaman "Tentang Kami": Visi, misi, profil redaksi, dan filosofi literasi',
        'Pengaturan data identitas kontak resmi: nomor WhatsApp, surel (email), dan alamat redaksi',
        'Manajemen tautan akun media sosial resmi penerbit (Instagram, TikTok, Facebook, YouTube)',
        'Konfigurasi sematan iframe Google Maps responsif untuk lokasi kantor penerbitan',
        'Pratinjau langsung konten halaman publik sebelum perubahan dipublikasikan secara langsung',
      ]}
    />
  );
}

export default function AdminSiteContentPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-5xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <SiteContentContent />
    </Suspense>
  );
}
