import { Suspense } from 'react';
import { connection } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Pengaturan Sistem — Super Admin Frasa Klausa Media',
};

async function SettingsContent() {
  await connection();
  await requireSuperAdmin();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Pengaturan Sistem
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi preferensi global, integrasi pihak ketiga, dan pengaturan platform.
          </p>
        </div>
        <Badge variant="outline" className="w-fit font-mono text-xs gap-1.5 py-1 px-3 border-amber-500/30 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-3.5 w-3.5" /> Khusus Super Admin
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Konfigurasi Global Platform</CardTitle>
          <CardDescription className="text-xs">
            Halaman ini diproteksi secara ketat dengan <code className="font-mono text-primary">requireSuperAdmin()</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Pengaturan kontak & sosmed default, integrasi analytics, dan pengaturan lanjutan platform akan diaktifkan pada <strong>Tahap 8 (Akun & Pengaturan)</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="space-y-4 max-w-5xl mx-auto p-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-40 w-full" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
