import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  // Logika pembuatan rentang halaman yang rapi (1 ... 4 5 6 ... 10)
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
      className="flex items-center justify-center gap-1.5 pt-8"
    >
      {/* Tombol Sebelumnya */}
      <Button
        asChild={currentPage > 1}
        disabled={currentPage <= 1}
        variant="outline"
        size="sm"
        className="h-9 gap-1 px-3 text-xs"
        aria-label="Halaman sebelumnya"
      >
        {currentPage > 1 ? (
          <Link href={buildUrl(currentPage - 1)} prefetch={false}>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </Link>
        ) : (
          <span>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </span>
        )}
      </Button>

      {/* Nomor-Nomor Halaman */}
      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <Button
              key={`page-${p}`}
              asChild={!isActive}
              variant={isActive ? 'default' : 'outline'}
              size="icon"
              className={cn(
                'h-9 w-9 text-xs',
                isActive && 'pointer-events-none font-bold'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Ke halaman ${p}`}
            >
              {isActive ? (
                <span>{p}</span>
              ) : (
                <Link href={buildUrl(p)} prefetch={false}>
                  {p}
                </Link>
              )}
            </Button>
          );
        })}
      </div>

      {/* Tombol Berikutnya */}
      <Button
        asChild={currentPage < pageCount}
        disabled={currentPage >= pageCount}
        variant="outline"
        size="sm"
        className="h-9 gap-1 px-3 text-xs"
        aria-label="Halaman berikutnya"
      >
        {currentPage < pageCount ? (
          <Link href={buildUrl(currentPage + 1)} prefetch={false}>
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span>
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </nav>
  );
}
