import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardChartSkeleton } from '@/components/admin/dashboard-chart-skeleton';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* 4 Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-2" />
              <div className="flex items-center justify-between gap-2 mt-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grid Konten 2 Kolom Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Utama */}
        <div className="lg:col-span-7 space-y-6">
          <DashboardChartSkeleton />
          <Card className="overflow-hidden border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-9 rounded" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-12 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Samping */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="overflow-hidden border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-2.5 border-b border-border/50 last:border-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-20 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
