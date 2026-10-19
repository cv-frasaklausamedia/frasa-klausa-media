import { Suspense } from 'react';
import { AdminShellAsync } from '@/components/admin/admin-shell-async';
import { AdminShellSkeleton } from '@/components/admin/admin-shell-skeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminShellAsync>{children}</AdminShellAsync>
    </Suspense>
  );
}
