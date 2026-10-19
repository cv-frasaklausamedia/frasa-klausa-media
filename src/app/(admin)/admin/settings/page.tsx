import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { requireSuperAdmin } from '@/lib/auth';
import { UnderDevelopment } from '@/components/admin/under-development';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Pengaturan Sistem — Super Admin Frasa Klausa Media',
  description: 'Konfigurasi preferensi global, integrasi pihak ketiga, dan pengaturan platform Frasa Klausa Media.',
};

async function SettingsContent() {
  await connection();
  await requireSuperAdmin();

  return (
    <UnderDevelopment
      title="Pengaturan Sistem & Platform"
      description="Konfigurasi preferensi operasional platform, integrasi analitik pihak ketiga, keamanan sesi, dan pengaturan global Frasa Klausa Media."
      icon={Settings}
      isSuperAdminOnly={true}
      badgeText="Khusus Super Admin"
      estimatedPhase="Tahap 8 — Manajemen Akun & Pengaturan Sistem"
      plannedFeatures={[
        'Konfigurasi data default kontak penerbit, nomor WhatsApp utama, dan alamat operasional kantor',
        'Pengaturan durasi sesi login, batas percobaan gagal masuk, dan interval keep-alive basis data',
        'Integrasi analitik web pihak ketiga (Google Analytics / Search Console meta verification)',
        'Mode pemeliharaan sistem (Maintenance Mode) terjadwal untuk pembaruan besar',
        'Pengaturan batas unggah berkas sampul buku dan dokumen naskah pada Supabase Storage',
        'Pencadangan konfigurasi sistem dan manajemen environment variabel aplikasi',
      ]}
    />
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-5xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
