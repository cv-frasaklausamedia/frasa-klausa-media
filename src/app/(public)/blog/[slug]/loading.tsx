import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPostDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-4 w-48" />

      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Cover image skeleton */}
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />

      {/* Content paragraphs skeleton */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
