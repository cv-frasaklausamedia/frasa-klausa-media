'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePasswordSchema, type UpdatePasswordInput } from '@/validations/profile';
import { updatePasswordAction } from '@/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

export function PasswordForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: UpdatePasswordInput) => {
    setIsSubmitting(true);
    try {
      const response = await updatePasswordAction(values);
      if (response.ok) {
        toast.success(response.data.message || 'Kata sandi berhasil diperbarui.');
        form.reset();
      } else {
        toast.error(response.error.message || 'Gagal memperbarui kata sandi.');
        if (response.error.fieldErrors) {
          for (const [field, messages] of Object.entries(response.error.fieldErrors)) {
            form.setError(field as keyof UpdatePasswordInput, {
              message: messages[0],
            });
          }
        }
      }
    } catch {
      toast.error('Terjadi kesalahan saat memperbarui kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Kata Sandi Saat Ini */}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kata Sandi Saat Ini</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi saat ini"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showCurrentPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Kata Sandi Baru */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kata Sandi Baru</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter (huruf besar, kecil, angka & simbol)"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <FormDescription>
                Wajib minimal 8 karakter, kombinasi huruf besar (A-Z), huruf kecil (a-z), angka (0-9), dan simbol.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Konfirmasi Kata Sandi Baru */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ulangi Kata Sandi Baru</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ketik ulang kata sandi baru"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memperbarui...
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" /> Perbarui Kata Sandi
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
