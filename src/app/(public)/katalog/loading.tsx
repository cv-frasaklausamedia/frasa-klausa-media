import { Skeleton } from '@/components/ui/skeleton';

export function KatalogLoadingFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Breadcrumb & Header Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex items-center justify-between border-b pb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Book Grid Skeleton (12 Kartu) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-xl border bg-card overflow-hidden">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-24 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KatalogLoadingFallback;
