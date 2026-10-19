import Link from 'next/link';
import { Newspaper, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BlogPostNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Newspaper className="h-8 w-8 opacity-60" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-foreground">
          Artikel Tidak Ditemukan
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Artikel yang Anda tuju mungkin belum dipublikasikan, telah dihapus, atau tautan yang Anda masukkan salah.
        </p>
      </div>

      <div className="pt-2">
        <Button asChild variant="default" className="gap-2">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Blog
          </Link>
        </Button>
      </div>
    </div>
  );
}
