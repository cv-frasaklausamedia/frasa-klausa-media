'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileInput } from '@/validations/profile';
import { updateProfileNameAction } from '@/actions/profile';
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
import { Loader2, Check } from 'lucide-react';

interface ProfileNameFormProps {
  initialFullName: string;
  email: string;
}

export function ProfileNameForm({ initialFullName, email }: ProfileNameFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: initialFullName,
    },
  });

  const onSubmit = async (values: UpdateProfileInput) => {
    setIsSubmitting(true);
    try {
      const response = await updateProfileNameAction(values);
      if (response.ok) {
        toast.success('Nama profil berhasil diperbarui.');
        router.refresh();
      } else {
        toast.error(response.error.message || 'Gagal memperbarui profil.');
        if (response.error.fieldErrors?.fullName) {
          form.setError('fullName', {
            message: response.error.fieldErrors.fullName[0],
          });
        }
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Read-only */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="profile-email-readonly">
            Alamat Email Akun
          </label>
          <Input
            id="profile-email-readonly"
            value={email}
            disabled
            className="bg-muted text-muted-foreground cursor-not-allowed font-mono text-xs"
          />
          <p className="text-[12px] text-muted-foreground">
            Alamat email terdaftar dan dikelola oleh Super Admin.
          </p>
        </div>

        {/* Input Nama Lengkap */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Masukkan nama lengkap Anda"
                  disabled={isSubmitting}
                  autoComplete="name"
                />
              </FormControl>
              <FormDescription>
                Nama ini akan ditampilkan pada panel atas dan riwayat aktivitas Anda.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
