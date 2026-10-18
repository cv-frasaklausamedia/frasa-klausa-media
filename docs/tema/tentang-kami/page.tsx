import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { OFFICIAL_IDENTITY } from '@/constants';
import { getSiteContent } from '@/lib/site-content/data-access';
import {
  BookOpen,
  Award,
  Users,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Tentang Kami | Frasa Klausa Media',
  description:
    'Profil, visi, misi, dan komitmen CV Frasa Klausa Media dalam memajukan literasi dan menerbitkan karya berkualitas di Indonesia.',
  openGraph: {
    title: 'Tentang Kami | Frasa Klausa Media',
    description:
      'Profil, visi, misi, dan komitmen CV Frasa Klausa Media dalam memajukan literasi dan menerbitkan karya berkualitas di Indonesia.',
  },
};

export default async function PublicAboutPage() {
  const [about, contact, social] = await Promise.all([
    getSiteContent('about'),
    getSiteContent('contact'),
    getSiteContent('social'),
  ]);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* 1. Header Publik Konsisten */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">
                {OFFICIAL_IDENTITY.COMPANY_NAME}
              </span>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Penerbit Buku & Media Literasi
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Beranda
            </Link>
            <Link
              href="/katalog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Katalog
            </Link>
            <Link
              href="/tentang-kami"
              className="text-sm font-semibold text-primary transition-colors px-2 py-1 border-b-2 border-primary"
            >
              Tentang Kami
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Blog
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* 2. Hero Section Tentang Kami */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/30 to-background py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-4">
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            Mengenal Lebih Dekat
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight font-serif">
            {about.title}
          </h1>
          <p className="text-base sm:text-lg italic text-muted-foreground max-w-2xl mx-auto">
            &quot;{about.tagline}&quot;
          </p>
        </div>
      </section>

      {/* 3. Kisah & Sejarah Penerbit */}
      <section className="py-16 md:py-20 border-b">
        <div className="mx-auto max-w-4xl px-6 space-y-12">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Kisah & Gagasan
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif">
              Dedikasi untuk Dunia Literasi
            </h2>
            <div
              className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground text-sm sm:text-base leading-relaxed pt-2"
              dangerouslySetInnerHTML={{ __html: about.story }}
            />
          </div>

          {/* Visi & Misi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Visi Kami
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {about.vision}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Misi Kami
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                {about.mission.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Statistik Bar */}
          {about.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
              <div className="p-4 rounded-xl bg-muted/40 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
                  {about.stats.books_published}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Judul Diterbitkan</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
                  {about.stats.active_authors}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Penulis Bergabung</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
                  {about.stats.readers_community}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Komunitas Pembaca</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
                  {about.stats.years_established}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Tahun Berdiri</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Kontak & Lokasi Resmi */}
      <section className="py-16 md:py-20 bg-muted/20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Alamat & Kantor
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif mt-1">
                  Kontak Resmi Penerbit
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Kami membuka ruang diskusi, kolaborasi penerbitan naskah, dan pengadaan buku literasi.
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Alamat Kantor:</p>
                    <p className="text-muted-foreground leading-relaxed">{contact.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">Telepon / Hotline: </span>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">Email Redaksi: </span>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">Jam Kerja: </span>
                    <span className="text-muted-foreground">{contact.operational_hours}</span>
                  </div>
                </div>
              </div>

              {/* Media Sosial & Marketplace */}
              {(social.instagram || social.tiktok || social.facebook || social.twitter || social.shopee || social.tokopedia) && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ikuti Kami di Media Sosial:
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {social.instagram && (
                      <a
                        href={social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                      >
                        Instagram
                      </a>
                    )}
                    {social.tiktok && (
                      <a
                        href={social.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                      >
                        TikTok
                      </a>
                    )}
                    {social.facebook && (
                      <a
                        href={social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                      >
                        Facebook
                      </a>
                    )}
                    {social.twitter && (
                      <a
                        href={social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                      >
                        Twitter / X
                      </a>
                    )}
                    {social.shopee && (
                      <a
                        href={social.shopee}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                      >
                        Shopee
                      </a>
                    )}
                    {social.tokopedia && (
                      <a
                        href={social.tokopedia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                      >
                        Tokopedia
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-3">
                <Button asChild className="gap-2">
                  <Link
                    href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      'Halo Admin CV Frasa Klausa Media, saya ingin bertanya seputar penerbitan.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Konsultasi Naskah via WhatsApp
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/katalog">Jelajahi Katalog Buku</Link>
                </Button>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xs min-h-[320px] flex items-center justify-center">
              {contact.map_embed_url ? (
                <iframe
                  src={contact.map_embed_url}
                  width="100%"
                  height="100%"
                  className="min-h-[320px] w-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokasi Kantor Frasa Klausa Media"
                />
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  <MapPin className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-semibold">Lokasi Kantor</p>
                  <p className="text-xs max-w-xs mx-auto mt-1">{contact.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer Publik */}
      <footer className="border-t py-8 text-xs text-muted-foreground text-center">
        <p>
          {OFFICIAL_IDENTITY.COMPANY_NAME} &copy; {new Date().getFullYear()} &mdash; All Rights Reserved.
        </p>
      </footer>
    </main>
  );
}
