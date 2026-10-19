import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export function StickyBannerSkeleton() {
  return (
    <div className="w-full bg-primary/10 border-b border-primary/20 py-2.5 px-4">
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-3">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-64 max-w-xs" />
      </div>
    </div>
  );
}

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-1 hidden sm:block">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-36 rounded-lg hidden sm:block" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </header>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="w-full border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-36 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-md" />
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </footer>
  );
}
