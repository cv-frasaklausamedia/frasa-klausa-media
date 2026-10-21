import { Suspense } from 'react';
import { connection } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardData, getSuperAdminDashboardData } from '@/lib/dashboard';
import { AdminDashboardView } from '@/components/admin/dashboard/admin-dashboard-view';
import { SuperAdminDashboardView } from '@/components/admin/dashboard/super-admin-dashboard-view';
import AdminDashboardLoading from './loading';

export const metadata = {
  title: 'Dashboard — Pengelola Frasa Klausa Media',
};

async function DashboardContent() {
  await connection();
  const user = await requireAdmin();

  // Render komponen dashboard yang berbeda sesuai hak akses peran pengguna
  if (user.role === 'super_admin') {
    const superAdminData = await getSuperAdminDashboardData();
    return <SuperAdminDashboardView user={user} data={superAdminData} />;
  }

  const adminData = await getAdminDashboardData();
  return <AdminDashboardView user={user} data={adminData} />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
