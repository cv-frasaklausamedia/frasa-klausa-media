'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { KeyRound, Loader2, Info } from 'lucide-react';

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
import { resetUserPasswordAction } from '@/actions/account';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: AdminAccountItem | null;
  onSuccess?: () => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  targetUser,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!targetUser) return null;

  const handleConfirm = () => {
    startTransition(async () => {
      const response = await resetUserPasswordAction({
        userId: targetUser.id,
      });

      if (!response.ok) {
        toast.error(response.error.message || 'Gagal mengirimkan tautan reset kata sandi.');
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
          <div className="flex items-center gap-2 text-primary">
            <KeyRound className="h-5 w-5" />
            <AlertDialogTitle>Reset Kata Sandi Akun</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 text-foreground/80">
            Tautan pemulihan kata sandi baru akan dikirimkan secara aman ke alamat email terdaftar:
            <br />
            <strong className="text-foreground">{targetUser.email}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <span>
            Demi menjaga kerahasiaan dan privasi kredensial, tautan token atau kata sandi tidak pernah ditampilkan pada antarmuka ini maupun pada log server.
          </span>
        </div>

        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              'Kirim Email Reset'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
