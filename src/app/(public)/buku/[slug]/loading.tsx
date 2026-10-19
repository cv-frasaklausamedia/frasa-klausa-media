import { Skeleton } from '@/components/ui/skeleton';

export default function BookDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <Skeleton className="h-4 w-60" />

      {/* Main Grid: Gallery + Detail Skeleton */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left Column: Gallery Skeleton */}
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="w-full aspect-[3/4] rounded-2xl" />
          <div className="flex gap-3">
            <Skeleton className="h-20 w-16 rounded-lg" />
            <Skeleton className="h-20 w-16 rounded-lg" />
            <Skeleton className="h-20 w-16 rounded-lg" />
          </div>
        </div>

        {/* Right Column: Book Info & Checkout Skeleton */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3 border-b pb-6">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-5 w-40" />
          </div>

          <Skeleton className="h-20 w-full rounded-xl" />

          {/* Checkout Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-md" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>

          {/* Specs Skeleton */}
          <div className="space-y-3 pt-4 border-t">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
