import Link from 'next/link';
import { Layers, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CategoryNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Layers className="h-8 w-8 stroke-[1.5]" />
      </div>

      <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground sm:text-4xl">
        Kategori Tidak Ditemukan
      </h1>

      <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
        Kategori yang Anda tuju tidak terdaftar di basis data kami atau mungkin telah digabungkan ke kategori lain.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="default" className="gap-2">
          <Link href="/katalog">
            <ArrowLeft className="h-4 w-4" />
            Ke Katalog Buku
          </Link>
        </Button>
        <Button asChild variant="outline" size="default" className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </Button>
      </div>
    </div>
  );
}
