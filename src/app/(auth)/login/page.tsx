import Link from 'next/link';
import { BookOpen, Lock } from 'lucide-react';
import { OFFICIAL_IDENTITY } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-serif">{OFFICIAL_IDENTITY.COMPANY_NAME}</CardTitle>
          <CardDescription>
            Masuk ke Dashboard CMS Admin (Tahap 2 Auth Placeholder)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Admin</Label>
              <Input id="email" type="email" placeholder="super.admin@frasaklausamedia.com" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input id="password" type="password" placeholder="••••••••" disabled />
            </div>
            <Button type="button" className="w-full gap-2" disabled>
              <Lock className="h-4 w-4" /> Masuk ke CMS (Aktif di Tahap 2)
            </Button>
            <div className="pt-2 text-center text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">
                &larr; Kembali ke Beranda
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
