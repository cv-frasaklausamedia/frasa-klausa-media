import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Database, Clock, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface SystemHealthCardProps {
  status: {
    database: 'online' | 'degraded';
    keepAliveActive: boolean;
    maintenanceMode: boolean;
    publicRegistration: boolean;
    marketplaceRedirect: boolean;
    whatsappNumber: string;
  };
}

export function SystemHealthCard({ status }: SystemHealthCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary shrink-0" />
            Kesehatan & Status Sistem
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Status operasional infrastruktur & kebijakan platform
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-1 text-primary hover:text-primary">
          <Link href="/admin/settings">
            Konfigurasi <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pt-0">
        {/* Status Koneksi DB & Keep-Alive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-foreground">Database Supabase</p>
                <p className="text-[10px] text-muted-foreground">PostgreSQL & Auth RLS</p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Online
            </Badge>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs font-semibold text-foreground">Anti Auto-Pause</p>
                <p className="text-[10px] text-muted-foreground">Cron Keep-Alive 5 Hari</p>
              </div>
            </div>
            <Badge variant="outline" className="border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 text-[10px]">
              Aktif
            </Badge>
          </div>
        </div>

        {/* Kebijakan Fitur Global */}
        <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Kebijakan Keamanan & Fitur
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground text-[11px]">Mode Pemeliharaan</span>
              <Badge variant={status.maintenanceMode ? 'destructive' : 'secondary'} className="text-[9px] px-1.5 py-0">
                {status.maintenanceMode ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground text-[11px]">Registrasi Publik</span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                {status.publicRegistration ? 'Dibuka' : 'Terkunci (Aman)'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground text-[11px]">Redirect Marketplace</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                {status.marketplaceRedirect ? 'Diaktifkan' : 'Nonaktif'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground text-[11px]">WhatsApp Order</span>
              <span className="font-mono text-[10px] text-foreground font-medium flex items-center gap-1">
                <Phone className="h-2.5 w-2.5 text-emerald-600" /> {status.whatsappNumber}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
