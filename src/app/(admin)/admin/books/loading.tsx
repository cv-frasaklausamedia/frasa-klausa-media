import { Skeleton } from '@/components/ui/skeleton';

export default function BooksLoading() {
  return (
    <div className="space-y-4">
      {/* Toolbar Skeleton (Search, Filters, Page Size, Tambah Buku) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 py-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-full sm:w-64 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md shrink-0" />
          <Skeleton className="h-9 w-32 rounded-md shrink-0" />
          <Skeleton className="h-9 w-40 rounded-md shrink-0" />
          <Skeleton className="h-9 w-20 rounded-md shrink-0" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md shrink-0" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border bg-card overflow-hidden">
        {/* Table Header */}
        <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24 hidden md:block" />
          <Skeleton className="h-4 w-24 hidden sm:block" />
          <Skeleton className="h-4 w-16 hidden lg:block" />
          <Skeleton className="h-4 w-16 hidden lg:block" />
          <Skeleton className="h-4 w-8" />
        </div>

        {/* 10 Table Rows */}
        <div className="divide-y divide-border">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 flex items-center justify-between gap-4"
            >
              {/* Cover Thumbnail Skeleton */}
              <Skeleton className="h-14 w-10 rounded shrink-0" />

              {/* Title & Author Skeleton */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-3 w-32 max-w-full" />
              </div>

              {/* Category Skeleton */}
              <Skeleton className="h-5 w-24 rounded-full hidden md:block shrink-0" />

              {/* Price Skeleton */}
              <div className="space-y-1 hidden sm:block shrink-0 w-24 text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-14 ml-auto" />
              </div>

              {/* Badges Skeleton */}
              <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>

              {/* Action Menu Skeleton */}
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
  );
}
