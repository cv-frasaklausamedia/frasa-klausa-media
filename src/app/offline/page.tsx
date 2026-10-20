'use client';

import * as React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Home, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OFFICIAL_IDENTITY } from '@/constants';

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(false);

  React.useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    window.location.reload();
  };

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-primary mb-6 border border-amber-500/20 shadow-xs">
        <WifiOff className="h-10 w-10 stroke-[1.5]" />
        <span
          className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-background ${
            isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
          }`}
          title={isOnline ? 'Terhubung kembali' : 'Offline'}
        />
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
        Mode Luar Jaringan (Offline)
      </span>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground mb-4">
        Koneksi Internet Terputus
      </h1>

      <p className="max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
        Halaman ini belum tersimpan di memori perangkat Anda. Pastikan koneksi internet atau Wi-Fi aktif untuk membuka kembali katalog dan artikel {OFFICIAL_IDENTITY.COMPANY_NAME}.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          size="default"
          className="gap-2 text-xs sm:text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Memuat Ulang...' : 'Coba Lagi'}
        </Button>

        <Button asChild variant="outline" size="default" className="gap-2 text-xs sm:text-sm">
          <Link href="/">
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </Button>

        <Button asChild variant="ghost" size="default" className="gap-2 text-xs sm:text-sm">
          <Link href="/katalog">
            <BookOpen className="h-4 w-4" />
            Buka Katalog Tersimpan
          </Link>
        </Button>
      </div>
    </div>
  );
}
