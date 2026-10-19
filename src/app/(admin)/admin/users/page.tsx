import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { requireSuperAdmin } from '@/lib/auth';
import { UnderDevelopment } from '@/components/admin/under-development';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Manajemen Akun — Super Admin Frasa Klausa Media',
  description: 'Daftar pengelola CMS, pengaturan hak akses, dan status keaktifan akun admin Frasa Klausa Media.',
};

async function UsersContent() {
  await connection();
  await requireSuperAdmin();

  return (
    <UnderDevelopment
      title="Manajemen Akun Pengguna"
      description="Kelola akun pengelola CMS, buat kredensial admin baru, atur status aktif/nonaktif, dan kendalikan otorisasi peran sistem."
      icon={Users}
      isSuperAdminOnly={true}
      badgeText="Khusus Super Admin"
      estimatedPhase="Tahap 8 — Manajemen Akun & Pengaturan Sistem"
      plannedFeatures={[
        'Pembuatan akun admin baru via Server Action dengan supabase.auth.admin.createUser() tanpa ketergantungan SMTP',
        'Penetapan peran eksklusif: hanya Super Admin aktif yang berhak membuat atau mengubah role akun lain',
        'Trigger basis data defensif: mencegah Super Admin mendemosi akunnya sendiri demi mencegah lockout sistem',
        'Pemberian status aktif/nonaktif akun (is_active) secara instan untuk pemutusan akses cepat',
        'Fitur reset kata sandi sementara untuk admin yang mengalami kendala login',
        'Audit log aktivitas perubahan hak akses dan riwayat pembuatan pengguna baru',
      ]}
    />
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 max-w-5xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
