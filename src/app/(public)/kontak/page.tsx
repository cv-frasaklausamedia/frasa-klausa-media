import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

import { getSiteContent } from '@/lib/site-content/data-access';
import { OFFICIAL_IDENTITY } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactInquiryForm } from '@/components/public/contact-inquiry-form';
import ContactLoadingFallback from './loading';

export const metadata: Metadata = {
  title: `Hubungi Kami | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
  description:
    'Hubungi tim redaksi dan penerbitan Frasa Klausa Media melalui telepon, WhatsApp 0813-8060-4256, email frasaklausamedia@gmail.com, atau formulir inquiry naskah resmi.',
  alternates: {
    canonical: '/kontak',
  },
  openGraph: {
    type: 'website',
    url: '/kontak',
    title: `Hubungi Kami | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    description:
      'Hubungi tim redaksi dan penerbitan Frasa Klausa Media melalui telepon, WhatsApp 0813-8060-4256, email frasaklausamedia@gmail.com, atau formulir inquiry naskah resmi.',
    images: [{ url: '/logo/logo-landscape.jpg', width: 1200, height: 630, alt: 'Kontak Frasa Klausa Media' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Hubungi Kami | ${OFFICIAL_IDENTITY.COMPANY_NAME}`,
    description:
      'Hubungi tim redaksi dan penerbitan Frasa Klausa Media melalui telepon, WhatsApp 0813-8060-4256, email frasaklausamedia@gmail.com, atau formulir inquiry naskah resmi.',
    images: ['/logo/logo-landscape.jpg'],
  },
};

async function ContactContent() {
  await connection();
  const contact = await getSiteContent('contact');

  const phoneDisplay = contact.phone || contact.whatsapp || '0813-8060-4256';
  const cleanPhone = phoneDisplay.replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
  const emailDisplay = contact.email || 'frasaklausamedia@gmail.com';

  const defaultMapsUrl =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126920.28639849206!2d106.758849!3d-6.229746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e49fe3ddb3%3A0x72a5a51c4a034638!2sJakarta!5e0!3m2!1sid!2sid!4v1700000000000';
  const mapsEmbedUrl = contact.maps_embed_url || defaultMapsUrl;

  return (
    <div className="flex flex-col gap-10 sm:gap-12 pb-16">
      {/* 1. Header Section - Full-Bleed Gradient Strip */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/40 via-background to-background py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">
              Beranda
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold text-foreground">Kontak Kami</span>
          </nav>

          <div className="space-y-2 max-w-3xl">
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 text-xs border-primary/30 text-primary shadow-2xs inline-flex mb-1"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Layanan & Bantuan
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground">
              Hubungi Redaksi
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Punya pertanyaan mengenai pengajuan naskah, kerja sama penerbitan, atau katalog buku? Kami siap membantu Anda.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Grid Dua Kolom: Info Kontak Resmi + Peta & Formulir Inquiry */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Kolom Kiri: Detail Kontak, Sosmed, dan Google Maps Embed */}
          <div className="lg:col-span-5 space-y-6">
            {/* Kartu Informasi Resmi */}
            <div className="rounded-2xl border bg-card text-card-foreground shadow-xs p-6 sm:p-8 space-y-5">
              <h2 className="font-serif font-bold text-lg text-foreground border-b pb-3">
                Informasi Resmi Penerbit
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                {/* WhatsApp / Telepon */}
                <div className="flex items-start gap-3.5">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Telepon / WhatsApp
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {phoneDisplay}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email Resmi */}
                <div className="flex items-start gap-3.5">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Email Resmi
                    </span>
                    <div>
                      <a
                        href={`mailto:${emailDisplay}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {emailDisplay}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Alamat Kantor */}
                <div className="flex items-start gap-3.5">
                  <div className="rounded-lg bg-muted p-2 text-muted-foreground shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Alamat Kantor
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {contact.address || 'Jakarta, Indonesia'}
                    </p>
                  </div>
                </div>

                {/* Jam Operasional */}
                <div className="flex items-start gap-3.5">
                  <div className="rounded-lg bg-muted p-2 text-muted-foreground shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Jam Operasional
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {contact.operating_hours || 'Senin – Jumat: 09.00 – 17.00 WIB'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Cepat WhatsApp */}
              <div className="pt-2 border-t">
                <Button asChild className="w-full gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                  <a
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Halo Frasa Klausa Media, saya ingin berkonsultasi seputar penerbitan buku.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Hubungi via WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            {/* Peta Lokasi Kantor: Responsive Google Maps Embed */}
            <div className="rounded-2xl border bg-card text-card-foreground shadow-xs overflow-hidden space-y-2 p-4 sm:p-5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Peta Lokasi Kantor
                </span>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  Buka di Google Maps <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>

              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border bg-muted">
                <iframe
                  src={mapsEmbedUrl}
                  title="Peta Lokasi Kantor Frasa Klausa Media"
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Form Kontak Interaktif */}
          <div className="lg:col-span-7">
            <ContactInquiryForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KontakPage() {
  return (
    <Suspense fallback={<ContactLoadingFallback />}>
      <ContactContent />
    </Suspense>
  );
}
