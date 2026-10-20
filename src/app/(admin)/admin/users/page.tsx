import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, ShieldCheck, UserCheck, AlertCircle, RotateCcw } from 'lucide-react';

import { requireSuperAdmin } from '@/lib/auth';
import { accountQuerySchema } from '@/validations/account';
import { getAccountList } from '@/lib/accounts/data-access';
import type { AccountListResponse } from '@/types/accounts';
import { Button } from '@/components/ui/button';
import { AccountTable } from './_components/account-table';
import AdminUsersLoading from './loading';

export const metadata: Metadata = {
  title: 'Manajemen Akun — Super Admin Frasa Klausa Media',
  description: 'Daftar pengelola CMS, pengaturan hak akses, dan status keaktifan akun admin Frasa Klausa Media.',
};

interface UsersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function UsersContent({ searchParams }: UsersPageProps) {
  // Opt-in ke dynamic request-time rendering
  await connection();

  let currentUser: Awaited<ReturnType<typeof requireSuperAdmin>> | null = null;
  let accountData: AccountListResponse | null = null;
  let hasError = false;

  try {
    currentUser = await requireSuperAdmin();
    const rawParams = await searchParams;
    const queryParams = accountQuerySchema.parse(rawParams);
    accountData = await getAccountList(queryParams);
  } catch (error) {
    console.error('[AdminUsersPage] Error loading account list:', error);
    hasError = true;
  }

  if (hasError || !accountData || !currentUser) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Gagal Memuat Data Akun Pengguna
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Terjadi kendala saat menghubungi basis data. Silakan periksa koneksi atau muat ulang halaman.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/admin/users">
              <RotateCcw className="mr-2 h-4 w-4" /> Coba Lagi
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kartu Ringkasan Metrik Akun */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Total Pengelola</span>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {accountData.totalCount}
            </div>
          </div>
          <div className="rounded-full bg-primary/10 p-2.5 text-primary">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Akun Aktif</span>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {accountData.activeCount}
            </div>
          </div>
          <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Super Admin</span>
            <div className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
              {accountData.superAdminCount}
            </div>
          </div>
          <div className="rounded-full bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabel Akun TanStack */}
      <AccountTable
        initialData={accountData}
        currentUserId={currentUser.id}
      />
    </div>
  );
}

export default function AdminUsersPage({ searchParams }: UsersPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Manajemen Akun Pengguna
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola kredensial pengelola CMS, daftarkan admin baru, dan kendalikan status keaktifan akun.
        </p>
      </div>

      <Suspense fallback={<AdminUsersLoading />}>
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
