import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowUpRight,
  ShoppingBag,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { DynamicCopyright } from '@/components/common/dynamic-copyright';
import { OFFICIAL_IDENTITY } from '@/constants';
import type { ContactContentPayload, SocialContentPayload } from '@/types';

interface FooterProps {
  contact?: ContactContentPayload | null;
  social?: SocialContentPayload | null;
}

export function Footer({ contact, social }: FooterProps) {
  const companyName = contact?.company_name || OFFICIAL_IDENTITY.COMPANY_NAME;
  const tagline = contact?.tagline || OFFICIAL_IDENTITY.TAGLINE;
  const email = contact?.email || OFFICIAL_IDENTITY.EMAIL;
  const whatsapp = contact?.whatsapp || OFFICIAL_IDENTITY.WHATSAPP;
  const address = contact?.address || OFFICIAL_IDENTITY.ADDRESS;
  const operatingHours = contact?.operating_hours || 'Senin – Jumat: 09.00 – 17.00 WIB';

  // Sanitasi nomor whatsapp untuk link wa.me
  const cleanWaNumber = whatsapp.replace(/[^0-9]/g, '');
  const formattedWaUrl = cleanWaNumber.startsWith('0')
    ? `https://wa.me/62${cleanWaNumber.slice(1)}`
    : `https://wa.me/${cleanWaNumber}`;

  // Daftar media sosial & marketplace dengan aturan fallback: sembunyikan jika URL kosong
  const socialLinks = [
    { name: 'Instagram', url: social?.instagram || OFFICIAL_IDENTITY.SOCIAL_LINKS.INSTAGRAM },
    { name: 'TikTok', url: social?.tiktok || OFFICIAL_IDENTITY.SOCIAL_LINKS.TIKTOK },
    { name: 'Facebook', url: social?.facebook || OFFICIAL_IDENTITY.SOCIAL_LINKS.FACEBOOK },
    { name: 'Twitter / X', url: social?.twitter },
    { name: 'YouTube', url: social?.youtube },
  ].filter((item) => Boolean(item.url && item.url.trim() !== ''));

  const marketplaceLinks = [
    { name: 'Shopee Official', url: social?.shopee || OFFICIAL_IDENTITY.SOCIAL_LINKS.SHOPEE },
    { name: 'Tokopedia Official', url: social?.tokopedia || OFFICIAL_IDENTITY.SOCIAL_LINKS.TOKOPEDIA },
  ].filter((item) => Boolean(item.url && item.url.trim() !== ''));

  return (
    <footer className="w-full border-t bg-muted/30 text-foreground transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Kolom 1: Identitas & Visi Penerbit */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-background">
                <Image
                  src="/logo/logo.png"
                  alt={companyName}
                  fill
                  sizes="40px"
                  className="object-contain p-0.5"
                />
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-foreground block">
                  {companyName}
                </span>
                <span className="text-xs text-muted-foreground block">
                  {tagline}
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Penerbit buku independen dan media literasi. Kami mengkurasi, menyunting,
              dan menerbitkan karya bermutu untuk memperkaya peradaban literasi bangsa.
            </p>
          </div>

          {/* Kolom 2: Navigasi Cepat Deskriptif */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Navigasi Literasi
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Beranda Utama
                </Link>
              </li>
              <li>
                <Link href="/katalog" className="hover:text-primary transition-colors">
                  Katalog Buku Pilihan
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Artikel & Kabar Literasi
                </Link>
              </li>
              <li>
                <Link href="/tentang-kami" className="hover:text-primary transition-colors">
                  Tentang Penerbit Kami
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="hover:text-primary transition-colors">
                  Hubungi Redaksi & Layanan Naskah
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors inline-flex items-center gap-1">
                  <span>Portal Redaksi CMS</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Kontak Resmi */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Kontak Redaksi
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span className="leading-snug">{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={formattedWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline transition-colors"
                >
                  WhatsApp: {whatsapp}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>{operatingHours}</span>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Media Sosial & Marketplace */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Toko Resmi & Media Sosial
            </h3>

            {/* Marketplace Official Store */}
            {marketplaceLinks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Pemesanan Online:</p>
                <div className="flex flex-col gap-1.5">
                  {marketplaceLinks.map((store) => (
                    <a
                      key={store.name}
                      href={store.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-primary transition-colors"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                      <span>{store.name}</span>
                      <ArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Social Media Links */}
            {socialLinks.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-foreground">Ikuti Kami:</p>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((soc) => (
                    <a
                      key={soc.name}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      {soc.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Dynamic Copyright Section (Format Baku: [Company Name] © {tahun}) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            <DynamicCopyright companyName={companyName} />
          </p>
          <p className="text-center sm:text-right">
            Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </div>
    </footer>
  );
}
