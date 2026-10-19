import Link from 'next/link';
import { BookOpen, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OFFICIAL_IDENTITY } from '@/constants';

export default function RootNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/60 text-primary mb-6 border shadow-xs">
        <BookOpen className="h-10 w-10 stroke-[1.5]" />
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
        Galat 404
      </span>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground mb-4">
        Halaman Tidak Ditemukan
      </h1>

      <p className="max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
        Maaf, halaman atau lembaran yang Anda cari telah dipindahkan, berganti judul, atau belum diterbitkan oleh {OFFICIAL_IDENTITY.COMPANY_NAME}.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="default" className="gap-2 text-xs sm:text-sm">
          <Link href="/">
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </Button>

        <Button asChild variant="outline" size="default" className="gap-2 text-xs sm:text-sm">
          <Link href="/katalog">
            <ArrowLeft className="h-4 w-4" />
            Jelajahi Katalog Buku
          </Link>
        </Button>
      </div>
    </div>
  );
}
