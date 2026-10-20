import { Skeleton } from '@/components/ui/skeleton';

export default function ContactLoadingFallback() {
  return (
    <div className="flex flex-col gap-10 sm:gap-12 pb-16 animate-pulse">
      {/* Header skeleton - Full-bleed strip */}
      <div className="border-b bg-muted/20 py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3 max-w-2xl">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-10 w-64 sm:w-96" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
        </div>
      </div>

      {/* Grid skeleton: Info Kontak & Formulir - max-w-7xl */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Kolom Kiri skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border p-6 sm:p-8 space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
          </div>

          {/* Kolom Kanan skeleton */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border p-6 sm:p-8 space-y-6">
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
    </div>
  );
}
