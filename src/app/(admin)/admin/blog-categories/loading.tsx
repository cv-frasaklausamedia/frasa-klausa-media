import { Skeleton } from '@/components/ui/skeleton';

export default function BlogCategoriesLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Content Container Skeleton */}
      <div className="space-y-4">
        {/* Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2">
          <div className="flex flex-1 items-center gap-2">
            <Skeleton className="h-9 w-full sm:max-w-xs rounded-md" />
            <Skeleton className="h-9 w-[70px] rounded-md shrink-0" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md shrink-0" />
        </div>

        {/* Table Skeleton */}
        <div className="rounded-md border bg-card overflow-hidden">
          {/* Table Header */}
          <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20 hidden md:block" />
            <Skeleton className="h-4 w-24 hidden sm:block" />
            <Skeleton className="h-4 w-28 hidden lg:block" />
            <Skeleton className="h-4 w-8" />
          </div>

          {/* 10 Table Rows */}
          <div className="divide-y divide-border">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="px-4 py-3.5 flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full hidden md:block" />
                <Skeleton className="h-4 w-16 hidden sm:block" />
                <Skeleton className="h-4 w-28 hidden lg:block" />
                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Footer Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
