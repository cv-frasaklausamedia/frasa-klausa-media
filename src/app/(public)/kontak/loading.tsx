import { Skeleton } from '@/components/ui/skeleton';

export default function ContactLoadingFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-10 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-64 sm:w-96" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      {/* Grid skeleton: Info Kontak & Formulir */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri skeleton */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
        </div>

        {/* Kolom Kanan skeleton */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border p-8 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}
