import { getCurrentUser } from '@/lib/auth';
import { AdminUserNav } from './admin-user-nav';

export async function AdminUserNavServer() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return <AdminUserNav user={user} />;
}
