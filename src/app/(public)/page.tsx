import Link from 'next/link';
import { Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-24 text-center">
        <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1 text-sm border-primary/30 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Tahap 9 — Layout Publik Aktif
        </Badge>

        <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Mewujudkan Naskah Menjadi Buku
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Platform penerbitan literasi modern Frasa Klausa Media. Fondasi Next.js 16,
          Tailwind CSS v4, shadcn/ui, dan Supabase SSR telah aktif dan terkonfigurasi.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/admin">
              Akses Dashboard Admin <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/api/health" target="_blank" rel="noreferrer">
              Periksa API Health
            </a>
          </Button>
        </div>
      </section>

      {/* Status Fondasi Cards */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Tech Stack Inti
              </CardTitle>
              <CardDescription>Komponen dasar platform</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Next.js 16.4 (App Router), React 19, TypeScript strict, Tailwind CSS v4, & shadcn/ui.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Keamanan & Env
              </CardTitle>
              <CardDescription>Validasi Zod & Server-Only</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Kredensial publik dipisah dari service role key dengan penanda perlindungan server-only.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Desain & Tipografi
              </CardTitle>
              <CardDescription>Penerbitan literasi</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Harmoni tipografi Plus Jakarta Sans dan Newsreader dengan palet tema Warm Terracotta.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
