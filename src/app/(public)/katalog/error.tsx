'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function KatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[KatalogError] Terjadi kendala rendering katalog:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
        Katalog Belum Dapat Ditampilkan
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        Sistem mengalami hambatan saat memuat data katalog buku. Silakan coba muat ulang atau kembali ke halaman beranda.
      </p>

      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground/60 bg-muted px-2.5 py-1 rounded-md">
          Kode Diagnostik: {error.digest}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} size="sm" className="gap-2 text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          Coba Muat Ulang
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2 text-xs">
          <Link href="/">
            <Home className="h-3.5 w-3.5" />
            Halaman Utama
          </Link>
        </Button>
      </div>
    </div>
  );
}
