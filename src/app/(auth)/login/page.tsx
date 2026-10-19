import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { OFFICIAL_IDENTITY } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './_components/login-form';

export const metadata: Metadata = {
  title: 'Masuk CMS Admin | Frasa Klausa Media',
  description: 'Portal autentikasi khusus Administrator dan Super Admin Frasa Klausa Media',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-lg border-border/60">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-serif tracking-tight">
              {OFFICIAL_IDENTITY.COMPANY_NAME}
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
              Portal CMS Administrator
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Suspense fallback={<div className="h-56 animate-pulse rounded-md bg-muted/50" />}>
            <LoginForm />
          </Suspense>

          <div className="border-t pt-4 text-center text-xs text-muted-foreground">
            <Link
              href="/"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              &larr; Kembali ke Beranda Publik
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
