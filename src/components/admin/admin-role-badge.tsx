import { getCurrentUser } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';

export async function AdminRoleBadge() {
  const user = await getCurrentUser();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <>
      {/* Full Badge: visible on mobile drawer and expanded desktop */}
      <div className="items-center gap-2 overflow-hidden max-md:flex hidden xl:flex xl:sidebar-collapsed:hidden">
        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
          {isSuperAdmin ? 'Super Admin' : 'Admin'}
        </Badge>
      </div>

      {/* Mini Badge: visible on tablet dock (72px) and collapsed desktop (72px) */}
      <div className="items-center justify-center hidden md:flex xl:hidden xl:sidebar-collapsed:flex">
        <Badge variant="outline" className="text-[9px] uppercase font-mono px-1.5 py-0.5">
          {isSuperAdmin ? 'SA' : 'A'}
        </Badge>
      </div>
    </>
  );
}
