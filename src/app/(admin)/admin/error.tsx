'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Catat error client-side ke konsol browser
    console.error('[AdminError Boundary] Client error caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Terjadi Kesalahan Saat Memuat Halaman
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Sistem mengalami kendala saat memproses permintaan. Silakan coba kembali beberapa saat lagi.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground/70">
              ID Masalah: {error.digest}
            </p>
          )}
        </div>
        <Button
          onClick={() => reset()}
          variant="outline"
          size="sm"
          className="mt-3 gap-2"
        >
          <RotateCcw className="h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    </div>
  );
}
