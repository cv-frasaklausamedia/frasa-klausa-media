import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  pageCount: number;
  basePath: string;
  searchParams?: Record<string, string | number | undefined>;
}

export function Pagination({
  currentPage,
  pageCount,
  basePath,
  searchParams = {},
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const buildUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && k !== 'page') {
        params.set(k, String(v));
      }
    });
    if (targetPage > 1) {
      params.set('page', String(targetPage));
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Logika pembuatan rentang halaman desktop yang rapi (1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(pageCount - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < pageCount - 2) {
      pages.push('ellipsis');
    }

    pages.push(pageCount);

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Navigasi Halaman"
      className="flex flex-col items-center justify-center pt-8 pb-4"
    >
      {/* 1. Tampilan Mobile Ringkas & Anti-Overflow (< sm) */}
      <div className="flex sm:hidden items-center justify-between w-full max-w-xs gap-3">
        {currentPage > 1 ? (
          <Link
            href={buildUrl(currentPage - 1)}
            prefetch={false}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-9 px-3 rounded-lg gap-1.5 text-xs font-medium whitespace-nowrap inline-flex items-center'
            )}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span>Sebelumnya</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-9 px-3 rounded-lg gap-1.5 text-xs font-medium whitespace-nowrap inline-flex items-center opacity-40 cursor-not-allowed'
            )}
            aria-label="Halaman sebelumnya"
            aria-disabled="true"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span>Sebelumnya</span>
          </button>
        )}

        <span className="text-xs text-muted-foreground font-medium select-none whitespace-nowrap px-2.5 py-1 rounded-md bg-muted/40 border border-border/40">
          <strong className="text-foreground font-semibold">{currentPage}</strong> / {pageCount}
        </span>

        {currentPage < pageCount ? (
          <Link
            href={buildUrl(currentPage + 1)}
            prefetch={false}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-9 px-3 rounded-lg gap-1.5 text-xs font-medium whitespace-nowrap inline-flex items-center'
            )}
            aria-label="Halaman berikutnya"
          >
            <span>Berikutnya</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-9 px-3 rounded-lg gap-1.5 text-xs font-medium whitespace-nowrap inline-flex items-center opacity-40 cursor-not-allowed'
            )}
            aria-label="Halaman berikutnya"
            aria-disabled="true"
          >
            <span>Berikutnya</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        )}
      </div>

      {/* 2. Tampilan Tablet & Desktop Lengkap (>= sm) */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        {/* Tombol Sebelumnya */}
        {currentPage > 1 ? (
          <Link
            href={buildUrl(currentPage - 1)}
            prefetch={false}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-9 px-3.5 text-xs font-medium rounded-lg border-border/60 gap-1.5 whitespace-nowrap inline-flex items-center'
            )}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span>Sebelumnya</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-9 px-3.5 text-xs font-medium rounded-lg border-border/60 gap-1.5 whitespace-nowrap inline-flex items-center opacity-40 cursor-not-allowed'
            )}
            aria-label="Halaman sebelumnya"
            aria-disabled="true"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span>Sebelumnya</span>
          </button>
        )}

        {/* Nomor-Nomor Halaman */}
        <div className="flex items-center gap-1.5 mx-1">
          {pages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-9 w-9 items-center justify-center text-muted-foreground/60 select-none"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            const isActive = p === currentPage;
            if (isActive) {
              return (
                <span
                  key={`page-${p}`}
                  aria-current="page"
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'icon' }),
                    'h-9 w-9 text-xs font-semibold rounded-lg pointer-events-none shadow-xs select-none'
                  )}
                >
                  {p}
                </span>
              );
            }

            return (
              <Link
                key={`page-${p}`}
                href={buildUrl(p)}
                prefetch={false}
                aria-label={`Ke halaman ${p}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'icon' }),
                  'h-9 w-9 text-xs font-medium rounded-lg border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                )}
              >
                {p}
              </Link>
            );
          })}
        </div>

        {/* Tombol Berikutnya */}
        {currentPage < pageCount ? (
          <Link
            href={buildUrl(currentPage + 1)}
            prefetch={false}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-9 px-3.5 text-xs font-medium rounded-lg border-border/60 gap-1.5 whitespace-nowrap inline-flex items-center'
            )}
            aria-label="Halaman berikutnya"
          >
            <span>Berikutnya</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-9 px-3.5 text-xs font-medium rounded-lg border-border/60 gap-1.5 whitespace-nowrap inline-flex items-center opacity-40 cursor-not-allowed'
            )}
            aria-label="Halaman berikutnya"
            aria-disabled="true"
          >
            <span>Berikutnya</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        )}
      </div>
    </nav>
  );
}
