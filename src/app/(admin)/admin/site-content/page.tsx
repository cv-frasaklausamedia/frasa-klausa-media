import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PanelsTopLeft, Compass, PhoneCall, Share2, AlertCircle, RotateCcw } from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { getSiteContentRecord } from '@/lib/site-content/data-access';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeroForm } from './_components/hero-form';
import { AboutForm } from './_components/about-form';
import { ContactForm } from './_components/contact-form';
import { SocialForm } from './_components/social-form';

export const metadata: Metadata = {
  title: 'Konten Halaman — Admin Frasa Klausa Media',
  description: 'Kelola konten teks, narasi profil, informasi kontak, dan media pada halaman publik tanpa koding.',
};

async function SiteContentContent() {
  await connection();
  let hasError = false;
  let heroData = null;
  let aboutData = null;
  let contactData = null;
  let socialData = null;

  try {
    await requireAdmin();
    // Ambil seluruh konten publik dari tabel site_content secara paralel (dengan fallback otomatis jika kosong)
    [heroData, aboutData, contactData, socialData] = await Promise.all([
      getSiteContentRecord('hero'),
      getSiteContentRecord('about'),
      getSiteContentRecord('contact'),
      getSiteContentRecord('social'),
    ]);
  } catch (error) {
    console.error('[AdminSiteContentPage] Error loading site content:', error);
    hasError = true;
  }

  if (hasError || !heroData || !aboutData || !contactData || !socialData) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Gagal Memuat Konten Halaman
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Terjadi kendala saat menghubungi basis data atau sesi Anda telah berakhir.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/admin/site-content">
              <RotateCcw className="mr-2 h-4 w-4" /> Coba Lagi
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
          Manajemen Konten Halaman Publik
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perbarui teks Hero beranda, profil narasi &ldquo;Tentang Kami&rdquo;, informasi kontak resmi, dan tautan media sosial tanpa menyentuh kode program.
        </p>
      </div>

      {/* Tabs Konten Halaman */}
      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/60">
          <TabsTrigger value="hero" className="gap-2 py-2 text-xs sm:text-sm">
            <PanelsTopLeft className="h-4 w-4" />
            <span>Hero Beranda</span>
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2 py-2 text-xs sm:text-sm">
            <Compass className="h-4 w-4" />
            <span>Tentang Kami</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2 py-2 text-xs sm:text-sm">
            <PhoneCall className="h-4 w-4" />
            <span>Kontak & Lokasi</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2 py-2 text-xs sm:text-sm">
            <Share2 className="h-4 w-4" />
            <span>Media Sosial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="focus-visible:outline-hidden">
          <HeroForm initialData={heroData} />
        </TabsContent>

        <TabsContent value="about" className="focus-visible:outline-hidden">
          <AboutForm initialData={aboutData} />
        </TabsContent>

        <TabsContent value="contact" className="focus-visible:outline-hidden">
          <ContactForm initialData={contactData} />
        </TabsContent>

        <TabsContent value="social" className="focus-visible:outline-hidden">
          <SocialForm initialData={socialData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminSiteContentPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <SiteContentContent />
    </Suspense>
  );
}
