import { Skeleton } from '@/components/ui/skeleton';

export function AdminShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar Skeleton (Matching expanded 16rem width) */}
      <div className="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar p-4 space-y-4">
        <div className="flex items-center gap-3 py-2 border-b border-sidebar-border pb-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-2 flex-1 pt-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
        <div className="pt-4 border-t border-sidebar-border flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-36 hidden sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[360px] w-full rounded-xl" />
          </div>
        </main>
      </div>
    </div>
  );
}
