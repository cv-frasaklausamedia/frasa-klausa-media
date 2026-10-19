import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { Sparkles, Clock, CalendarX, Layers } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { bannerQuerySchema } from '@/validations/banner';
import { getBannersList } from '@/lib/banners/data-access';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { BannerTable } from './_components/banner-table';

export const metadata: Metadata = {
  title: 'Banner Promosi — Admin Frasa Klausa Media',
  description: 'Kelola banner pengumuman promosi berjadwal di atas navbar publik Frasa Klausa Media.',
};

interface AdminBannersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function BannersContent({ searchParams }: AdminBannersPageProps) {
  await connection();
  await requireAdmin();

  const rawParams = await searchParams;
  const queryParams = bannerQuerySchema.parse(rawParams);

  const bannerData = await getBannersList(queryParams);
  const { counts } = bannerData.meta;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
          Banner Promosi Berjadwal
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Atur pengumuman promo sticky di bagian atas navbar situs publik, kelola rentang waktu mulai dan selesai tayang (WIB), serta arahkan calon pembaca ke buku atau artikel pilihan.
        </p>
      </div>

      {/* Kartu Ringkasan Metrik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Aktif Sekarang</p>
              <p className="text-2xl font-bold text-primary font-mono">{counts.active_now}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Akan Datang</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {counts.upcoming}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Kedaluwarsa</p>
              <p className="text-2xl font-bold text-foreground font-mono">{counts.expired}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <CalendarX className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Total Banner</p>
              <p className="text-2xl font-bold text-foreground font-mono">{counts.all}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Banner */}
      <BannerTable initialData={bannerData} />
    </div>
  );
}

export default async function AdminBannersPage({ searchParams }: AdminBannersPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <BannersContent searchParams={searchParams} />
    </Suspense>
  );
}
