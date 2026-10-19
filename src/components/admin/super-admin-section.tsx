import { getCurrentUser } from '@/lib/auth';
import { SuperAdminNavClient } from './super-admin-nav-client';

export async function SuperAdminSection() {
  const user = await getCurrentUser();

  if (user?.role !== 'super_admin') {
    return null;
  }

  return <SuperAdminNavClient />;
}
