import { Skeleton } from '@/components/ui/skeleton';

export default function BlogLoadingFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-64 sm:w-96" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      {/* Filter & Search Bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-b pb-6">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full sm:w-64 rounded-md" />
      </div>

      {/* Grid kartu artikel skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-4">
            <Skeleton className="aspect-[16/9] w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="pt-2 border-t flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
