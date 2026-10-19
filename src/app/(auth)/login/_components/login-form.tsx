'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/validations/auth';
import { signInAction } from '@/actions/auth';
import { getSafeRedirectUrl } from '@/lib/redirect-validator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rawRedirect = searchParams.get('redirectTo');
  const safeRedirect = getSafeRedirectUrl(rawRedirect, '/admin');

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      redirectTo: safeRedirect,
    },
  });

  const onSubmit = (values: LoginInput) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await signInAction(values);

      if (!result.ok) {
        const msg = result.error.message;
        setErrorMessage(msg);
        toast.error('Gagal Masuk', {
          description: msg,
        });

        // Terapkan field error jika ada (validasi form 422)
        if (result.error.fieldErrors) {
          for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
            if (field === 'email' || field === 'password') {
              form.setError(field, { message: messages[0] });
            }
          }
        }
        return;
      }

      toast.success('Berhasil Masuk', {
        description: 'Mengarahkan ke Dashboard CMS...',
      });

      router.push(result.data.redirectTo);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive font-medium animate-in fade-in duration-200">
            {errorMessage}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Admin</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="nama@frasaklausamedia.com"
                    className="pl-9"
                    disabled={isPending}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kata Sandi</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9"
                    disabled={isPending}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full gap-2 font-medium"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memverifikasi Kredensial...
            </>
          ) : (
            <>
              Masuk ke CMS Admin
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
