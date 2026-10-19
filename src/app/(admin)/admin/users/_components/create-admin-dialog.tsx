'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UserPlus, Loader2, ShieldAlert } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
  createAdminUserSchema,
  type CreateAdminUserInput,
} from '@/validations/account';
import { createAdminUserAction } from '@/actions/account';

interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateAdminDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAdminDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateAdminUserInput>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: {
      email: '',
      fullName: '',
      temporaryPassword: '',
    },
  });

  const onSubmit = (values: CreateAdminUserInput) => {
    startTransition(async () => {
      const response = await createAdminUserAction(values);

      if (!response.ok) {
        if (response.error.fieldErrors) {
          Object.entries(response.error.fieldErrors).forEach(([field, messages]) => {
            if (field in values) {
              form.setError(field as keyof CreateAdminUserInput, {
                type: 'server',
                message: messages[0],
              });
            }
          });
        }
        toast.error(response.error.message || 'Gagal membuat akun admin baru.');
        return;
      }

      toast.success(response.data.message);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <UserPlus className="h-5 w-5" />
            <DialogTitle>Buat Akun Admin Baru</DialogTitle>
          </div>
          <DialogDescription>
            Daftarkan pengelola CMS baru. Akun langsung berstatus aktif dan siap digunakan login tanpa dependensi email SMTP di awal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Budi Santoso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@frasaklausa.id"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Email digunakan sebagai identitas login CMS utama.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temporaryPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Sandi Sementara</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Minimal 8 karakter kombinasi huruf & angka"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Berikan kata sandi ini kepada admin terkait. Admin dapat mengubahnya di profil.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Peran otomatis yang diberikan adalah <strong>Admin</strong>. Peran Super Admin tidak dapat diberikan melalui antarmuka ini demi alasan keamanan sistem.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Buat Akun Admin'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
