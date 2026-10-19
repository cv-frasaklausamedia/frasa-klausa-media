import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { UnderDevelopment } from '@/components/admin/under-development';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Banner Promosi — Admin Frasa Klausa Media',
  description: 'Atur banner pengumuman promosi berjadwal di atas navbar publik Frasa Klausa Media.',
};

async function BannersContent() {
  await connection();
  await requireAdmin();

  return (
    <UnderDevelopment
      title="Banner Promosi Berjadwal"
      description="Kelola pengumuman sticky banner di bagian paling atas situs publik, atur rentang jadwal tayang, dan arahkan pembaca ke promo buku unggulan."
      icon={Sparkles}
      estimatedPhase="Tahap 7 — Banner Promo & Manajemen Konten Halaman"
      plannedFeatures={[
        'Pengaturan teks pengumuman/promo sticky di atas navbar publik dengan tautan CTA',
        'Penjadwalan waktu tayang otomatis berbasis tanggal dan jam (mulai s.d. berakhir)',
        'Sakelar toggle cepat aktif/nonaktif langsung dari baris tabel data',
        'Target tautan dinamis: arahkan langsung ke halaman detail buku, promo, atau artikel blog',
        'Pratinjau banner secara langsung (live visual preview) sebelum disimpan',
        'Otomasi aktivasi dan kedaluwarsa banner tanpa perlu intervensi manual tim admin',
      ]}
    />
  );
}

export default function AdminBannersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-5xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <BannersContent />
    </Suspense>
  );
}
