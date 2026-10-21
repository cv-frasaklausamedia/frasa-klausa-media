import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import type { ActiveBannerItem } from '@/lib/dashboard';

interface BannerStatusCardProps {
  banners: ActiveBannerItem[];
}

function formatDateRange(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${s.toLocaleDateString('id-ID', opts)} – ${e.toLocaleDateString('id-ID', opts)}`;
  } catch {
    return 'Rentang aktif';
  }
}

export function BannerStatusCard({ banners }: BannerStatusCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            Banner Promo Aktif
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Pengumuman sticky bar yang tayang di navbar publik
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-1 text-primary hover:text-primary">
          <Link href="/admin/banners">
            Kelola <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center rounded-lg border border-dashed border-border p-4 bg-muted/20">
            <Sparkles className="h-7 w-7 text-muted-foreground/60 mb-2" />
            <p className="text-xs font-medium text-foreground">Tidak ada banner aktif</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 mb-2.5">
              Pasang banner promo untuk diskon buku atau pengumuman penting
            </p>
            <Button size="sm" variant="outline" asChild className="h-7 text-xs">
              <Link href="/admin/banners">Buat Banner Baru</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="p-3 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 transition-colors flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">
                    {banner.message}
                  </p>
                  <Badge className="text-[9px] px-1.5 py-0 bg-primary text-primary-foreground shrink-0 font-medium">
                    Tayang
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3 text-primary/70" />
                    {formatDateRange(banner.startDate, banner.endDate)}
                  </span>
                  {banner.linkUrl && (
                    <span className="flex items-center gap-0.5 text-primary hover:underline">
                      Tautan Aktif <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
