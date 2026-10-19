import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, BookOpen, Layers, Newspaper, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookCard } from '@/components/public/book-card';
import { getSiteContentRecord } from '@/lib/site-content/data-access';
import { getFeaturedBooks, getLatestBooks } from '@/lib/books/data-access';
import { getPopularBookCategories } from '@/lib/categories/data-access';
import { getPublicLatestPosts } from '@/lib/posts/data-access';
import { OFFICIAL_IDENTITY } from '@/constants';
import { formatDateIndo } from '@/lib/utils';

import { Suspense } from 'react';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: `${OFFICIAL_IDENTITY.COMPANY_NAME} — Penerbit Buku & Media Literasi`,
  description:
    'Platform penerbitan literasi modern dan toko buku resmi Frasa Klausa Media. Menghadirkan karya sastra, novel, puisi, dan tulisan inspiratif berkualitas tinggi.',
  openGraph: {
    title: `${OFFICIAL_IDENTITY.COMPANY_NAME} — Penerbit Buku & Media Literasi`,
    description:
      'Platform penerbitan literasi modern dan toko buku resmi Frasa Klausa Media. Menghadirkan karya sastra, novel, puisi, dan tulisan inspiratif.',
    images: [{ url: '/logo/logo.png', width: 800, height: 800, alt: OFFICIAL_IDENTITY.COMPANY_NAME }],
  },
};

async function HomePageContent() {
  await connection();
  // Ambil seluruh data beranda secara paralel di server lewat Data-Access Layer
  const [hero, about, featuredBooks, latestBooks, popularCategories, latestPosts] =
    await Promise.all([
      getSiteContentRecord('hero').catch(() => null),
      getSiteContentRecord('about').catch(() => null),
      getFeaturedBooks(4).catch((err) => {
        console.error('[HomePage] Gagal memuat buku unggulan:', err);
        return [];
      }),
      getLatestBooks(8).catch((err) => {
        console.error('[HomePage] Gagal memuat rilis terbaru:', err);
        return [];
      }),
      getPopularBookCategories(6).catch((err) => {
        console.error('[HomePage] Gagal memuat kategori populer:', err);
        return [];
      }),
      getPublicLatestPosts(3).catch((err) => {
        console.error('[HomePage] Gagal memuat artikel terbaru:', err);
        return [];
      }),
    ]);

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-20">
      {/* 1. HERO SECTION DINAMIS DARI CMS */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/40 via-background to-background py-16 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Teks & CTA Hero */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1 text-xs border-primary/30 text-primary shadow-2xs inline-flex"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Penerbitan Buku & Media Literasi
              </Badge>

              <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.15]">
                {hero?.headline || 'Mewujudkan Naskah Menjadi Mahakarya Literasi'}
              </h1>

              <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {hero?.subheadline ||
                  'Ruang perjumpaan antara penulis berbakat dan pembaca setia. Terbitkan dan temukan karya sastra bermutu tinggi bersama Frasa Klausa Media.'}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Button asChild size="lg" className="gap-2 text-base font-medium px-6 shadow-sm">
                  <Link href={hero?.primary_cta_url || '/katalog'}>
                    {hero?.primary_cta_label || 'Jelajahi Katalog'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                {hero?.secondary_cta_label && (
                  <Button asChild variant="outline" size="lg" className="text-base font-medium px-6">
                    <Link href={hero?.secondary_cta_url || '/tentang-kami'}>
                      {hero?.secondary_cta_label}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Ilustrasi Hero */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden border bg-muted/30 shadow-md">
                {hero?.cover_image_url ? (
                  <Image
                    src={hero.cover_image_url}
                    alt={hero.headline || 'Frasa Klausa Media'}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <BookOpen className="h-16 w-16 mb-4 stroke-1 text-primary/60" />
                    <p className="font-serif italic text-base text-foreground/80">
                      &ldquo;Setiap kata memiliki jiwa, setiap buku memiliki takdirnya.&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BUKU UNGGULAN (FEATURED BOOKS) */}
      {featuredBooks.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                Pilihan Kurator
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
                Buku Unggulan
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 self-start sm:self-auto text-primary">
              <Link href="/katalog?sort=created_at_desc">
                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredBooks.map((book, idx) => (
              <BookCard key={book.id} book={book} priority={idx < 2} />
            ))}
          </div>
        </section>
      )}

      {/* 3. KATEGORI POPULER */}
      {popularCategories.length > 0 && (
        <section className="border-y bg-muted/20 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="flex items-center justify-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                <Layers className="h-3.5 w-3.5" />
                Klasifikasi Karya
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
                Kategori Paling Populer
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Temukan buku berdasarkan genre favorit Anda mulai dari fiksi sastra, antologi puisi, hingga buku referensi ilmiah.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {popularCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/kategori/${cat.slug}`}
                  className="group flex flex-col items-center justify-center rounded-xl border bg-card p-4 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="font-serif font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {cat.book_count} Judul
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. RILIS TERBARU (NEW RELEASES) */}
      {latestBooks.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                <BookOpen className="h-3.5 w-3.5" />
                Terbitan Mutakhir
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
                Rilis Terbaru
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 self-start sm:self-auto text-primary">
              <Link href="/katalog">
                Jelajahi Semua Buku <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {latestBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* 5. ARTIKEL BLOG TERBARU */}
      {latestPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                <Newspaper className="h-3.5 w-3.5" />
                Kabar & Opini
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
                Artikel Literasi Terbaru
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 self-start sm:self-auto text-primary">
              <Link href="/blog">
                Baca Seluruh Artikel <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestPosts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative aspect-[16/9] w-full overflow-hidden bg-muted"
                  tabIndex={-1}
                >
                  {post.cover_url ? (
                    <Image
                      src={post.cover_url}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Newspaper className="h-10 w-10 opacity-40" />
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    {post.published_at && <span>{formatDateIndo(post.published_at)}</span>}
                    <span>•</span>
                    <span>{post.reading_time_minutes} mnt baca</span>
                  </div>

                  <h3 className="font-serif font-bold text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    <Link href={`/blog/${post.slug}`} className="focus-visible:outline-hidden focus-visible:underline">
                      {post.title}
                    </Link>
                  </h3>

                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 6. SEKILAS TENTANG KAMI DARI PAGE CMS */}
      {about && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-muted/20 p-8 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  Mengenal Kami
                </div>
                <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground sm:text-4xl">
                  {about.title || 'Tentang Frasa Klausa Media'}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {about.history || about.vision ||
                    'Frasa Klausa Media hadir sebagai wadah penerbitan yang berpihak pada kekayaan literasi dan integritas karya. Kami percaya bahwa setiap narasi berharga untuk didokumentasikan dan disebarluaskan.'}
                </p>

                {about.mission && about.mission.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                    {about.mission.slice(0, 4).map((misi: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{misi}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4">
                  <Button asChild variant="outline" size="default" className="gap-2">
                    <Link href="/tentang-kami">
                      Baca Profil Lengkap <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden border bg-background shadow-xs">
                  <div className="flex h-full w-full flex-col items-center justify-center bg-muted/40 p-6 text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 opacity-60 text-primary mb-3" />
                    <p className="font-serif italic text-sm text-foreground/90 max-w-xs">
                      &ldquo;Mendedikasikan diri untuk karya sastra yang abadi dan mencerahkan.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-background/50" />}>
      <HomePageContent />
    </Suspense>
  );
}

