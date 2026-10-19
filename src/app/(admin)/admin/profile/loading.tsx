import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Kolom Kiri: Avatar Card */}
        <div className="md:col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-2 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-40" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Skeleton className="h-32 w-32 rounded-full mb-4" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-44 mb-4" />
              <Skeleton className="h-8 w-36 rounded-md" />
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Settings Card */}
        <div className="md:col-span-8">
          <Card>
            <CardHeader className="pb-4 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-56" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-9 w-36 rounded-md mt-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
