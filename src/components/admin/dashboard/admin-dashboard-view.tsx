import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardMetricsCards } from '@/components/admin/dashboard-metrics';
import { LazyDashboardChart } from '@/components/admin/lazy-dashboard-chart';
import { RecentBooksCard } from './recent-books-card';
import { RecentInquiriesCard } from './recent-inquiries-card';
import { BannerStatusCard } from './banner-status-card';
import { FileText, Inbox, Plus } from 'lucide-react';
import type { AdminDashboardData } from '@/lib/dashboard';
import type { AuthenticatedUser } from '@/lib/auth';

interface AdminDashboardViewProps {
  user: AuthenticatedUser;
  data: AdminDashboardData;
}

export function AdminDashboardView({ user, data }: AdminDashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Header Halaman Khusus Admin Konten */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
              Dashboard Konten & Literasi
            </h1>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              Admin Konten
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang kembali, <span className="font-semibold text-foreground">{user.fullName}</span>. Pantau katalog buku, artikel literasi, dan pesan pembaca.
          </p>
        </div>

        {/* Quick Action Buttons Mobile-First */}
        <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-2 shrink-0">
          <Button size="sm" asChild className="h-8 sm:h-9 text-xs gap-1.5 shadow-xs w-full sm:w-auto justify-center px-2.5 sm:px-3">
            <Link href="/admin/books">
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Tambah Buku</span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="h-8 sm:h-9 text-xs gap-1.5 border-border w-full sm:w-auto justify-center px-2.5 sm:px-3">
            <Link href="/admin/blog/new">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Tulis Blog</span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="h-8 sm:h-9 text-xs gap-1.5 border-border w-full sm:w-auto justify-center px-2.5 sm:px-3">
            <Link href="/admin/inbox">
              <Inbox className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Inbox</span>
              {data.metrics.unreadInquiries > 0 && (
                <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.2 text-[10px] text-destructive-foreground font-semibold shrink-0">
                  {data.metrics.unreadInquiries}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Kartu Metrik Utama Konten */}
      <DashboardMetricsCards metrics={data.metrics} />

      {/* Grid Konten 2 Kolom Responsif */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Visualisasi Sebaran Kategori & Buku Terbaru */}
        <div className="lg:col-span-7 space-y-6">
          <LazyDashboardChart data={data.chartData} />
          <RecentBooksCard books={data.recentBooks} />
        </div>

        {/* Kolom Kanan: Pesan Masuk & Status Banner Promo */}
        <div className="lg:col-span-5 space-y-6">
          <RecentInquiriesCard inquiries={data.recentInquiries} />
          <BannerStatusCard banners={data.activeBanners} />
        </div>
      </div>
    </div>
  );
}
