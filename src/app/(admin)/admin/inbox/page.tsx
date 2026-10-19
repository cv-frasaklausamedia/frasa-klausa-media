import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { Inbox, MailCheck, MailX, Archive } from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { inquiryQuerySchema } from '@/validations/inquiry';
import { getAdminInquiries, getInquiriesMetrics } from '@/lib/inquiries/data-access';
import { InboxTable } from './_components/inbox-table';
import AdminInboxLoading from './loading';

export const metadata: Metadata = {
  title: 'Kotak Masuk Pesan — Admin Frasa Klausa Media',
  description:
    'Kelola pesan pertanyaan pembaca, tawaran kerja sama, dan pengajuan naskah dari form kontak publik.',
};

interface AdminInboxPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function InboxContent({ searchParams }: AdminInboxPageProps) {
  await connection();
  // Verifikasi hanya admin aktif yang dapat mengakses (PRD §5 & §13)
  await requireAdmin();

  const rawParams = await searchParams;
  const queryParams = inquiryQuerySchema.parse(rawParams);

  const [inquiriesData, metrics] = await Promise.all([
    getAdminInquiries(queryParams),
    getInquiriesMetrics(),
  ]);

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
          Kotak Masuk Pesan & Inquiry
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Pantau dan tindak lanjuti pesan masuk, pertanyaan pembaca, penawaran naskah, dan kerja sama penerbitan.
        </p>
      </div>

      {/* 2. Kartu Ringkasan Metrik Pesan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pesan */}
        <div className="rounded-xl border bg-card p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Total Pesan</span>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.totalCount}
            </div>
          </div>
          <div className="rounded-full bg-primary/10 p-2.5 text-primary">
            <Inbox className="h-5 w-5" />
          </div>
        </div>

        {/* Belum Dibaca */}
        <div className="rounded-xl border bg-card p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Belum Dibaca</span>
            <div className="text-2xl font-bold tracking-tight text-destructive">
              {metrics.unreadCount}
            </div>
          </div>
          <div className="rounded-full bg-destructive/10 p-2.5 text-destructive">
            <MailX className="h-5 w-5" />
          </div>
        </div>

        {/* Telah Dibalas */}
        <div className="rounded-xl border bg-card p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Telah Dibalas</span>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics.repliedCount}
            </div>
          </div>
          <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
            <MailCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Diarsipkan */}
        <div className="rounded-xl border bg-card p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Diarsipkan</span>
            <div className="text-2xl font-bold tracking-tight text-muted-foreground">
              {metrics.archivedCount}
            </div>
          </div>
          <div className="rounded-full bg-muted p-2.5 text-muted-foreground">
            <Archive className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Tabel Interaktif Inbox */}
      <InboxTable
        initialData={inquiriesData}
        currentStatus={queryParams.status}
        currentQ={queryParams.q}
      />
    </div>
  );
}

export default function AdminInboxPage({ searchParams }: AdminInboxPageProps) {
  return (
    <Suspense fallback={<AdminInboxLoading />}>
      <InboxContent searchParams={searchParams} />
    </Suspense>
  );
}
