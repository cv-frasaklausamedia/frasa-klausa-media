import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Hammer,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export interface UnderDevelopmentProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badgeText?: string;
  isSuperAdminOnly?: boolean;
  estimatedPhase: string;
  plannedFeatures: string[];
  actionHref?: string;
  actionLabel?: string;
}

export function UnderDevelopment({
  title,
  description,
  icon: Icon,
  badgeText = 'Dalam Pengembangan',
  isSuperAdminOnly = false,
  estimatedPhase,
  plannedFeatures,
  actionHref = '/admin',
  actionLabel = 'Kembali ke Dashboard',
}: UnderDevelopmentProps) {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Halaman Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs border border-primary/20">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground flex items-center gap-2">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdminOnly && (
            <Badge
              variant="outline"
              className="font-mono text-xs gap-1.5 py-1 px-3 border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Khusus Super Admin
            </Badge>
          )}
          <Badge
            variant="outline"
            className="font-mono text-xs gap-1.5 py-1 px-3 border-primary/30 bg-primary/5 text-primary"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {badgeText}
          </Badge>
        </div>
      </div>

      {/* Kartu Status & Roadmap Modul */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Hammer className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                Status Modul & Fitur Terencana
              </CardTitle>
            </div>
            <Badge variant="secondary" className="w-fit text-xs font-mono font-medium">
              <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
              {estimatedPhase}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Modul ini sedang disiapkan sesuai roadmap arsitektur PRD Frasa Klausa Media.
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-6">
          {/* Daftar Fitur yang Direncanakan */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Fitur yang Akan Hadir pada Rilis Modul Ini:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plannedFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-card hover:bg-accent/40 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/90 leading-snug">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Banner Peringatan Info */}
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
            Data skema basis data, antarmuka formulir, dan endpoint API untuk modul ini sedang dirancang secara modular. Anda dapat memantau atau mengelola kategori data yang telah aktif melalui panel navigasi lainnya.
          </div>

          {/* Tombol Navigasi Cepat */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild variant="default" size="sm">
              <Link href={actionHref}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {actionLabel}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/book-categories">
                Kelola Kategori Buku
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
