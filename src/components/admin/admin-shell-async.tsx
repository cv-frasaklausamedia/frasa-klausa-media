import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminNavbar } from '@/components/admin/admin-navbar';

export async function AdminShellAsync({
  children,
}: {
  children: React.ReactNode;
}) {
  // Tandai eksekusi pada request-time secara eksplisit untuk Next.js Cache Components / PPR
  await connection();

  // 1. Verifikasi otorisasi di server
  const user = await requireAdmin();

  // 2. Baca cookie preferensi UI sidebar di server (PRD §16.6)
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get('sidebar_state');
  
  // Default terbuka (true) jika cookie belum ada
  const defaultOpen = sidebarCookie ? sidebarCookie.value === 'true' : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar user={user} />
      <SidebarInset className="min-w-0">
        <AdminNavbar user={user} />
        <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
