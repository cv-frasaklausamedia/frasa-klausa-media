import { Skeleton } from '@/components/ui/skeleton';

export default function AboutLoadingFallback() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-16 animate-pulse">
      {/* Hero skeleton - Full-bleed strip */}
      <div className="border-b bg-muted/20 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-4 text-center max-w-2xl mx-auto">
            <Skeleton className="h-6 w-36 mx-auto rounded-full" />
            <Skeleton className="h-12 w-full mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </div>
        </div>
      </div>

      {/* Main content skeleton - max-w-7xl */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 w-full">
        {/* Sejarah skeleton */}
        <div className="rounded-2xl border p-8 sm:p-12 space-y-4">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Visi & Misi skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border p-8 space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="rounded-2xl border p-8 space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
