'use client';

import * as React from 'react';
import Link from 'next/link';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import type { Banner } from '@/types';
import { cn } from '@/lib/utils';

interface StickyBannerProps {
  banner: Banner | null;
  className?: string;
}

const emptySubscribe = () => () => {};

/**
 * StickyBanner Promosi Berjadwal
 *
 * Ditampilkan di atas navbar publik bila terdapat banner promo aktif.
 * Dilengkapi tombol tutup (dismiss) dengan penyimpanan sesi per-banner id
 * tanpa merusak layout atau menyebabkan layout shift.
 */
export function StickyBanner({ banner, className }: StickyBannerProps) {
  const [localDismissedId, setLocalDismissedId] = React.useState<string | null>(null);

  // Baca status dismiss dari sessionStorage tanpa cascading render
  const isSessionDismissed = React.useSyncExternalStore(
    emptySubscribe,
    () => {
      if (!banner?.id) return false;
      try {
        return sessionStorage.getItem(`fkm_dismissed_banner_${banner.id}`) === 'true';
      } catch {
        return false;
      }
    },
    () => false
  );

  const isDismissed = localDismissedId === banner?.id || isSessionDismissed;

  if (!banner || !banner.is_active || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    if (banner?.id) {
      setLocalDismissedId(banner.id);
      try {
        sessionStorage.setItem(`fkm_dismissed_banner_${banner.id}`, 'true');
      } catch {
        // Abaikan jika storage dibatasi browser
      }
    }
  };

  const isInternalLink = banner.link_url && banner.link_url.startsWith('/');

  return (
    <aside
      aria-label="Pengumuman promosi"
      className={cn(
        'relative z-50 w-full bg-primary text-primary-foreground border-b border-primary/20 transition-all duration-200',
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 sm:py-2.5">
        <div className="flex flex-1 items-center justify-center gap-2 text-center text-xs sm:text-sm font-medium">
          <Sparkles className="h-4 w-4 shrink-0 text-primary-foreground/90 animate-pulse" />
          <span className="line-clamp-1">{banner.message}</span>

          {banner.link_url && (
            isInternalLink ? (
              <Link
                href={banner.link_url}
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity ml-1 shrink-0"
              >
                <span>Lihat Promo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <a
                href={banner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity ml-1 shrink-0"
              >
                <span>Lihat Promo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-md p-1 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white transition-colors"
          aria-label="Tutup banner promosi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
