'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardMetricsCards } from '@/components/admin/dashboard-metrics';
import { LazyDashboardChart } from '@/components/admin/lazy-dashboard-chart';
import { RecentBooksCard } from './recent-books-card';
import { RecentInquiriesCard } from './recent-inquiries-card';
import { BannerStatusCard } from './banner-status-card';
import { RecentAuditLogsCard } from './recent-audit-logs-card';
import { SystemHealthCard } from './system-health-card';
import { RecentAccountsCard } from './recent-accounts-card';
import {
  ShieldCheck,
  Users,
  Settings,
  BookOpen,
  UserPlus,
  ExternalLink,
  Layers,
  Inbox,
  Activity,
} from 'lucide-react';
import type { SuperAdminDashboardData } from '@/lib/dashboard';
import type { AuthenticatedUser } from '@/lib/auth';

interface SuperAdminDashboardViewProps {
  user: AuthenticatedUser;
  data: SuperAdminDashboardData;
}

export function SuperAdminDashboardView({ user, data }: SuperAdminDashboardViewProps) {
  const [activeTab, setActiveTab] = React.useState('system');

  return (
    <div className="space-y-6">
      {/* Header Halaman Khusus Super Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
              Pusat Kendali & Tata Kelola
            </h1>
            <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-xs gap-1 font-medium shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5" /> Super Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang, <span className="font-semibold text-foreground">{user.fullName}</span>. Anda memiliki akses penuh ke tata kelola sistem, audit keamanan, dan manajemen konten.
          </p>
        </div>

        {/* Quick Actions Khusus Super Admin Mobile-First */}
        <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-2 shrink-0">
          <Button size="sm" asChild className="h-8 sm:h-9 text-xs gap-1.5 shadow-xs w-full sm:w-auto justify-center px-2.5 sm:px-3">
            <Link href="/admin/users">
              <UserPlus className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Tambah Admin</span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="h-8 sm:h-9 text-xs gap-1.5 border-border w-full sm:w-auto justify-center px-2.5 sm:px-3">
            <Link href="/admin/settings">
              <Settings className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Pengaturan</span>
            </Link>
          </Button>
          <Button size="sm" variant="ghost" asChild className="h-8 sm:h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground border border-border sm:border-transparent w-full sm:w-auto justify-center px-2.5 sm:px-3">
            <Link href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Lihat Situs</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs Switcher: Sistem & Keamanan VS Konten & Katalog */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 h-9 p-1 bg-muted/80 border border-border">
            <TabsTrigger value="system" className="text-xs gap-1.5 data-[state=active]:font-semibold">
              <Activity className="h-3.5 w-3.5" /> Sistem & Keamanan
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs gap-1.5 data-[state=active]:font-semibold">
              <Layers className="h-3.5 w-3.5" /> Konten & Katalog
            </TabsTrigger>
          </TabsList>

          <span className="text-xs text-muted-foreground hidden sm:inline">
            Mode Tinjauan: <span className="font-medium text-foreground">{activeTab === 'system' ? 'Tata Kelola Platform' : 'Operasional Konten'}</span>
          </span>
        </div>

        {/* TAB 1: SISTEM & KEAMANAN */}
        <TabsContent value="system" className="space-y-6 mt-0">
          {/* 4 Kartu Metrik Tata Kelola Super Admin */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Akun Administrator
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {data.metrics.activeAdmins}
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    / {data.metrics.totalAdmins} aktif
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{data.metrics.superAdmins} Super Admin</p>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-amber-500/40 text-amber-700 dark:text-amber-300">
                    Otorisasi
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inventaris Publik
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {data.metrics.totalBooks}
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">judul buku</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{data.metrics.totalPosts} artikel blog</p>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-primary/40 text-primary">
                    Katalog
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inquiry Pembaca
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Inbox className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {data.metrics.unreadInquiries}
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">pesan baru</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Menunggu tindak lanjut</p>
                  <Badge
                    variant={data.metrics.unreadInquiries > 0 ? 'destructive' : 'secondary'}
                    className="text-[10px] shrink-0"
                  >
                    {data.metrics.unreadInquiries > 0 ? 'Perlu Respon' : 'Selesai'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Audit Trail
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {data.metrics.totalAuditLogs}
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">rekaman</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Log aksi administratif</p>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                    Append-Only
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid Tata Kelola 2 Kolom Responsif */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Live Audit Logs */}
            <div className="lg:col-span-7 space-y-6">
              <RecentAuditLogsCard logs={data.recentAuditLogs} />
            </div>

            {/* Kolom Kanan: Kesehatan Sistem & Pengelola Akun */}
            <div className="lg:col-span-5 space-y-6">
              <SystemHealthCard status={data.systemStatus} />
              <RecentAccountsCard accounts={data.recentAccounts} />
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: KONTEN & KATALOG */}
        <TabsContent value="content" className="space-y-6 mt-0">
          <DashboardMetricsCards metrics={data.adminOverview.metrics} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <LazyDashboardChart data={data.adminOverview.chartData} />
              <RecentBooksCard books={data.adminOverview.recentBooks} />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <RecentInquiriesCard inquiries={data.adminOverview.recentInquiries} />
              <BannerStatusCard banners={data.adminOverview.activeBanners} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
