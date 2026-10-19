import { Skeleton } from '@/components/ui/skeleton';

export default function AboutLoadingFallback() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12 animate-pulse">
      {/* Hero skeleton */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <Skeleton className="h-6 w-32 mx-auto rounded-full" />
        <Skeleton className="h-12 w-full mx-auto" />
        <Skeleton className="h-6 w-3/4 mx-auto" />
      </div>

      {/* Sejarah skeleton */}
      <div className="rounded-2xl border p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Visi & Misi skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl border p-8 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="rounded-2xl border p-8 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
