import { Suspense } from 'react';
import { connection } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDashboardMetrics, getBooksPerCategoryStats } from '@/lib/dashboard';
import { DashboardMetricsCards } from '@/components/admin/dashboard-metrics';
import { LazyDashboardChart } from '@/components/admin/lazy-dashboard-chart';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AdminDashboardLoading from './loading';

export const metadata = {
  title: 'Dashboard — Admin Frasa Klausa Media',
};

async function DashboardContent() {
  await connection();
  const user = await requireAdmin();

  // Ambil data agregasi di server secara efisien dan paralel
  const [metrics, chartData] = await Promise.all([
    getDashboardMetrics(),
    getBooksPerCategoryStats(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
            Ringkasan Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang kembali, <span className="font-medium text-foreground">{user.fullName}</span>. Kelola katalog dan media literasi Anda dari panel ini.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-primary/40 text-primary w-fit">
          <Sparkles className="h-3.5 w-3.5" /> Shell Admin Siap
        </Badge>
      </div>

      {/* 4 Kartu Metrik Utama */}
      <DashboardMetricsCards metrics={metrics} />

      {/* Grafik Sebaran Buku per Kategori */}
      <div className="grid gap-6">
        <LazyDashboardChart data={chartData} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
