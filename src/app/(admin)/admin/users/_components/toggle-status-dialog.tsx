'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2, Ban } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import type { AdminAccountItem } from '@/types/accounts';
import { toggleUserStatusAction } from '@/actions/account';

interface ToggleStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: AdminAccountItem | null;
  currentUserId?: string;
  activeSuperAdminCount?: number;
  onSuccess?: () => void;
}

export function ToggleStatusDialog({
  open,
  onOpenChange,
  targetUser,
  currentUserId,
  activeSuperAdminCount = 1,
  onSuccess,
}: ToggleStatusDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!targetUser) return null;

  const willActivate = !targetUser.isActive;
  const isSelf = currentUserId === targetUser.id;
  const isTargetSuperAdmin = targetUser.role === 'super_admin';
  const isLastSuperAdmin = isTargetSuperAdmin && activeSuperAdminCount <= 1;

  // Larangan penonaktifan:
  const isBlocked =
    !willActivate && (isSelf || isLastSuperAdmin);

  const handleConfirm = () => {
    if (isBlocked) return;

    startTransition(async () => {
      const response = await toggleUserStatusAction({
        userId: targetUser.id,
        isActive: willActivate,
      });

      if (!response.ok) {
        toast.error(response.error.message || 'Gagal mengubah status akun.');
        return;
      }

      toast.success(response.data.message);
      onOpenChange(false);
      onSuccess?.();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[440px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {willActivate ? (
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : (
              <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                <Ban className="h-5 w-5" />
              </div>
            )}
            <AlertDialogTitle>
              {willActivate ? 'Aktifkan Akun Admin' : 'Nonaktifkan Akun Admin'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 text-foreground/80">
            {willActivate ? (
              <>
                Apakah Anda yakin ingin mengaktifkan kembali akun{' '}
                <strong>{targetUser.fullName}</strong> ({targetUser.email})? Pengguna akan dapat login kembali ke CMS.
              </>
            ) : (
              <>
                Apakah Anda yakin ingin menonaktifkan akun{' '}
                <strong>{targetUser.fullName}</strong> ({targetUser.email})? Sesi login aktif akan segera dibatalkan dan akses ke seluruh fitur CMS akan ditolak seketika.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isBlocked && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {isSelf
                ? 'Anda tidak dapat menonaktifkan akun Anda sendiri demi mencegah penguncian sistem (lockout).'
                : 'Tidak dapat menonaktifkan Super Admin terakhir dalam sistem. Promosikan admin lain terlebih dahulu jika diperlukan.'}
            </span>
          </div>
        )}

        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <Button
            variant={willActivate ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={isPending || isBlocked}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : willActivate ? (
              'Aktifkan Akun'
            ) : (
              'Nonaktifkan Akun'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
