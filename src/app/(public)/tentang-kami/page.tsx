import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Target,
  Compass,
  Award,
  CheckCircle2,
  ArrowRight,
  Mail,
  ChevronRight,
} from 'lucide-react';

import { getSiteContent } from '@/lib/site-content/data-access';
import { sanitizeSiteNarrativeHtml } from '@/lib/sanitizer';
import { OFFICIAL_IDENTITY } from '@/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AboutLoadingFallback from './loading';

export const metadata: Metadata = {
  title: `Tentang Kami | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
  description:
    'Mengenal visi, misi, sejarah, dan nilai-nilai penerbitan buku Frasa Klausa Media — Mewujudkan naskah bermutu menjadi karya nyata bagi kemajuan literasi bangsa.',
  alternates: {
    canonical: '/tentang-kami',
  },
  openGraph: {
    type: 'website',
    url: '/tentang-kami',
    title: `Tentang Kami | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    description:
      'Mengenal visi, misi, sejarah, dan nilai-nilai penerbitan buku Frasa Klausa Media — Mewujudkan naskah bermutu menjadi karya nyata bagi kemajuan literasi bangsa.',
    images: [{ url: '/logo/logo-landscape.jpg', width: 1200, height: 630, alt: 'Tentang Frasa Klausa Media' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Tentang Kami | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    description:
      'Mengenal visi, misi, sejarah, dan nilai-nilai penerbitan buku Frasa Klausa Media — Mewujudkan naskah bermutu menjadi karya nyata bagi kemajuan literasi bangsa.',
    images: ['/logo/logo-landscape.jpg'],
  },
};

async function AboutContent() {
  await connection();
  const about = await getSiteContent('about');

  const sanitizedHistory = sanitizeSiteNarrativeHtml(about.history);

  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-16">
      {/* 1. Hero Header Section - Edge-to-Edge Gradient Strip */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/40 via-background to-background py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb Navigasi */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">
              Beranda
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold text-foreground">Tentang Kami</span>
          </nav>

          {/* Teks Hero */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 text-xs border-primary/30 text-primary shadow-2xs inline-flex"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Mengenal Penerbit
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-foreground leading-[1.15]">
              {about.title || 'Tentang Frasa Klausa Media'}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
              &ldquo;{about.subtitle || 'Mewujudkan Naskah Menjadi Buku'}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Konten Utama max-w-7xl */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-20 w-full">
        {/* 2. Sejarah Penerbit */}
        <section className="rounded-2xl border bg-card text-card-foreground p-6 sm:p-10 lg:p-12 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 text-primary text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            Sejarah & Komitmen Kami
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            Perjalanan Menghidupkan Gagasan
          </h2>

          {sanitizedHistory ? (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-base sm:text-lg"
              dangerouslySetInnerHTML={{ __html: sanitizedHistory }}
            />
          ) : (
            <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
              Frasa Klausa Media didirikan dengan dedikasi untuk memperkaya khazanah literasi di Indonesia. Berawal dari komunitas pecinta sastra dan editor independen, kami percaya bahwa setiap gagasan yang ditulis dengan ketulusan berhak menemukan pembaca setianya melalui proses penerbitan yang profesional, apik, dan berintegritas.
            </p>
          )}
        </section>

        {/* 3. Visi & Misi */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Kartu Visi */}
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-muted/20 p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                <Compass className="h-4 w-4" />
                Visi Kami
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Arah & Cita-Cita
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                {about.vision ||
                  'Menjadi penerbit independen rujukan di Indonesia yang melahirkan karya-karya bermutu, menginspirasi akal budi, dan memajukan peradaban literasi bangsa.'}
              </p>
            </div>

            <div className="pt-4 border-t flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-serif italic">
              <span>&ldquo;Narasi terbaik untuk masa depan bangsa.&rdquo;</span>
            </div>
          </div>

          {/* Kartu Misi */}
          <div className="rounded-2xl border bg-card p-6 sm:p-8 lg:p-10 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
                <Target className="h-4 w-4" />
                Misi Penerbit
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Langkah Nyata Kami
              </h2>

              <div className="space-y-3.5">
                {about.mission && about.mission.length > 0 ? (
                  about.mission.map((misi, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm sm:text-base text-foreground/90">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{misi}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Mendampingi penulis dari kurasi naskah hingga distribusi karya dengan standar kualitas terbaik.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Nilai-Nilai Utama (Values) */}
        {about.values && about.values.length > 0 && (
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-wider">
                <Award className="h-3.5 w-3.5" />
                Nilai Budaya
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Prinsip yang Kami Junjung
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                Landasan integritas dalam setiap buku yang kami kurasi, terbitkan, dan antarkan ke tangan pembaca.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {about.values.map((val, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border bg-card p-6 sm:p-8 shadow-2xs space-y-3 hover:border-primary/40 hover:shadow-xs transition-all"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    0{idx + 1}
                  </div>
                  <h3 className="font-serif font-bold text-lg text-foreground">
                    {val.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {val.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Identitas Resmi & Ajakan Aksi (CTA) */}
        <section className="rounded-3xl border bg-gradient-to-r from-primary/10 via-background to-primary/5 p-8 sm:p-12 lg:p-16 text-center space-y-6">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground">
              Tertarik Menerbitkan Naskah Bersama Kami?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Pintu redaksi Frasa Klausa Media selalu terbuka untuk karya sastra, novel, esai, dan puisi terbaik Anda. Hubungi tim kami atau jelajahi karya yang telah terbit.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button asChild size="lg" className="gap-2 text-sm font-medium px-6 shadow-sm">
              <Link href="/katalog">
                Jelajahi Katalog Buku <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="gap-2 text-sm font-medium px-6">
              <Link href="/kontak">
                <Mail className="h-4 w-4" /> Hubungi Redaksi
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function TentangKamiPage() {
  return (
    <Suspense fallback={<AboutLoadingFallback />}>
      <AboutContent />
    </Suspense>
  );
}
