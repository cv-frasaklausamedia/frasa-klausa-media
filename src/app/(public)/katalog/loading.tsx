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
      <div className="space-y-4">
        {/* Category Pills Skeleton */}
        <div className="flex items-center gap-2 overflow-hidden pb-1">
          <Skeleton className="h-7 w-24 rounded-full shrink-0" />
          <Skeleton className="h-7 w-32 rounded-full shrink-0" />
          <Skeleton className="h-7 w-20 rounded-full shrink-0" />
          <Skeleton className="h-7 w-28 rounded-full shrink-0" />
          <Skeleton className="h-7 w-36 rounded-full shrink-0" />
        </div>

        {/* Search & Secondary Tools Box */}
        <div className="rounded-2xl border bg-card/70 p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-full sm:w-36 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* Book Grid Skeleton (8 Kartu) */}
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
