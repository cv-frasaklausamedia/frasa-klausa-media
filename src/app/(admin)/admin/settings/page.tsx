import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, RotateCcw } from 'lucide-react';

import { requireSuperAdmin } from '@/lib/auth';
import { getSystemSettingsRecord } from '@/lib/settings/data-access';
import type { SystemSettingsPayload } from '@/types/settings';
import { Button } from '@/components/ui/button';
import { SettingsForm } from './_components/settings-form';
import AdminSettingsLoading from './loading';

export const metadata: Metadata = {
  title: 'Pengaturan Sistem — Super Admin Frasa Klausa Media',
  description: 'Konfigurasi preferensi global, kontak resmi, dan pengaturan platform Frasa Klausa Media.',
};

async function SettingsContent() {
  await connection();
  let settingsData: SystemSettingsPayload | null = null;
  let hasError = false;

  try {
    await requireSuperAdmin();
    settingsData = await getSystemSettingsRecord();
  } catch (error) {
    console.error('[AdminSettingsPage] Error loading settings:', error);
    hasError = true;
  }

  if (hasError || !settingsData) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Gagal Memuat Pengaturan Sistem
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Terjadi kendala saat menghubungi basis data atau sesi Anda telah berakhir.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/admin/settings">
              <RotateCcw className="mr-2 h-4 w-4" /> Coba Lagi
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <SettingsForm initialData={settingsData} />;
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pengaturan Sistem
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Konfigurasi preferensi operasional platform, kontak default penerbit, dan toggle modul sistem.
        </p>
      </div>

      <Suspense fallback={<AdminSettingsLoading />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
