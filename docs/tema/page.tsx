import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { OFFICIAL_IDENTITY } from '@/constants';
import { getSiteContent } from '@/lib/site-content/data-access';
import {
  BookOpen,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Award,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const [hero, about, contact, social] = await Promise.all([
    getSiteContent('hero'),
    getSiteContent('about'),
    getSiteContent('contact'),
    getSiteContent('social'),
  ]);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* 1. Header Minimal / Nav */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-30">
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
              className="text-sm font-semibold text-primary transition-colors px-2 py-1 border-b-2 border-primary"
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
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
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

      {/* 2. Hero Section (CMS Dynamic) */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/30 to-background py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {hero.badge_text && (
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{hero.badge_text}</span>
                </div>
              )}

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl font-serif leading-tight">
                {hero.headline}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {hero.subheadline}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                {hero.cta_primary_text && hero.cta_primary_link && (
                  <Button asChild size="lg" className="rounded-xl shadow-xs font-medium">
                    <Link href={hero.cta_primary_link}>
                      <span>{hero.cta_primary_text}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}

                {hero.cta_secondary_text && hero.cta_secondary_link && (
                  <Button asChild variant="outline" size="lg" className="rounded-xl">
                    <Link href={hero.cta_secondary_link}>
                      {hero.cta_secondary_text}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              {hero.image_url ? (
                <div className="relative aspect-4/3 w-full max-w-md overflow-hidden rounded-2xl border bg-muted shadow-lg">
                  <Image
                    src={hero.image_url}
                    alt={hero.headline}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 450px"
                    priority
                  />
                </div>
              ) : (
                <div className="flex aspect-4/3 w-full max-w-md flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40 p-8 text-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    Frasa Klausa Media
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    {about.tagline}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tentang Kami Section (CMS Dynamic) */}
      <section id="tentang-kami" className="py-16 md:py-20 border-b">
        <div className="mx-auto max-w-6xl px-6 space-y-12">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Tentang Penerbit
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif">
              {about.title}
            </h2>
            <p className="text-base italic text-muted-foreground">
              &quot;{about.tagline}&quot;
            </p>
            {/* Sanitized Rich Text Story */}
            <div
              className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground text-sm sm:text-base leading-relaxed pt-2"
              dangerouslySetInnerHTML={{ __html: about.story }}
            />
          </div>

          {/* Visi & Misi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="rounded-2xl border bg-card p-6 shadow-xs">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Visi Kami
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {about.vision}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-xs">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
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

          {/* Stats Bar */}
          {about.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
              <div className="p-4 rounded-xl bg-muted/40 text-center">
                <p className="text-2xl font-extrabold text-foreground font-serif">
                  {about.stats.books_published}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Judul Diterbitkan</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 text-center">
                <p className="text-2xl font-extrabold text-foreground font-serif">
                  {about.stats.active_authors}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Penulis Bergabung</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 text-center">
                <p className="text-2xl font-extrabold text-foreground font-serif">
                  {about.stats.readers_community}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Komunitas Pembaca</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 text-center">
                <p className="text-2xl font-extrabold text-foreground font-serif">
                  {about.stats.years_established}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Tahun Berdiri</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Kontak & Identitas Resmi (CMS Dynamic) */}
      <section id="kontak" className="py-16 md:py-20 bg-muted/20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Hubungi Kami
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif mt-1">
                  Kontak & Informasi Resmi
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Punya pertanyaan seputar penerbitan, naskah, atau pemesanan buku? Silakan hubungi kami.
                </p>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">WhatsApp / Telepon</p>
                    <p>{contact.whatsapp || contact.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Email Resmi</p>
                    <p>{contact.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Jam Operasional</p>
                    <p>{contact.operational_hours}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Alamat Kantor</p>
                    <p>{contact.address}</p>
                  </div>
                </div>
              </div>

              {/* Media Sosial Links */}
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                {social.instagram && (
                  <Link
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                  >
                    Instagram
                  </Link>
                )}
                {social.tiktok && (
                  <Link
                    href={social.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                  >
                    TikTok
                  </Link>
                )}
                {social.twitter && (
                  <Link
                    href={social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                  >
                    Twitter / X
                  </Link>
                )}
                {social.shopee && (
                  <Link
                    href={social.shopee}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                  >
                    Shopee
                  </Link>
                )}
                {social.tokopedia && (
                  <Link
                    href={social.tokopedia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border bg-card px-3 py-1.5 font-medium hover:text-primary transition-colors"
                  >
                    Tokopedia
                  </Link>
                )}
              </div>
            </div>

            {/* Google Maps Embed / Preview */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xs min-h-[300px] flex items-center justify-center">
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
