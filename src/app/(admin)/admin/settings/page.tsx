import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';

import { requireSuperAdmin } from '@/lib/auth';
import { getSystemSettingsRecord } from '@/lib/settings/data-access';
import { SettingsForm } from './_components/settings-form';
import AdminSettingsLoading from './loading';

export const metadata: Metadata = {
  title: 'Pengaturan Sistem — Super Admin Frasa Klausa Media',
  description: 'Konfigurasi preferensi global, kontak resmi, dan pengaturan platform Frasa Klausa Media.',
};

async function SettingsContent() {
  await connection();
  // Verifikasi ketat server-side khusus Super Admin (Admin biasa mendapat 403)
  await requireSuperAdmin();

  const settingsData = await getSystemSettingsRecord();

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
