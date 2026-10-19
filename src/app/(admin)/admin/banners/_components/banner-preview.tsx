'use client';

import * as React from 'react';
import { Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerPreviewProps {
  message: string;
  linkUrl?: string | null;
  isActive?: boolean;
}

export function BannerPreview({
  message,
  linkUrl,
  isActive = true,
}: BannerPreviewProps) {
  const displayMessage =
    message.trim() || 'Contoh: Promo Spesial Pekan Literasi — Dapatkan diskon 15% untuk buku pilihan!';

  const isExternal = linkUrl?.startsWith('http');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Pratinjau Sticky Banner Publik</span>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
            isActive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-zinc-500/10 text-zinc-500'
          )}
        >
          {isActive ? 'Simulasi: Aktif' : 'Simulasi: Nonaktif'}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-primary/20 bg-primary/5 shadow-xs transition-all">
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 text-center text-xs sm:text-sm font-medium text-primary">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="font-semibold uppercase tracking-wider text-[11px] bg-primary/10 px-2 py-0.5 rounded-full">
              Promo
            </span>
          </div>

          <p className="line-clamp-2 sm:line-clamp-1 max-w-xl text-foreground font-normal">
            {displayMessage}
          </p>

          {linkUrl && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-80 shrink-0">
              Lihat Selengkapnya
              {isExternal ? (
                <ExternalLink className="h-3 w-3" />
              ) : (
                <ArrowRight className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
