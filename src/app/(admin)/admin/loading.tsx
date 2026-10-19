import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardChartSkeleton } from '@/components/admin/dashboard-chart-skeleton';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-7 w-36 rounded-full" />
      </div>

      {/* 4 Cards Skeleton dengan proporsi 1:1 terhadap DashboardMetricsCards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
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

      {/* Chart Skeleton */}
      <div className="grid gap-6">
        <DashboardChartSkeleton />
      </div>
    </div>
  );
}
