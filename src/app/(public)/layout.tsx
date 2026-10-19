import * as React from 'react';
import { Suspense } from 'react';
import { getActiveBanner } from '@/lib/banners/data-access';
import { getSiteContent } from '@/lib/site-content/data-access';
import { StickyBanner } from '@/components/public/sticky-banner';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { GlobalSearchDialog } from '@/components/public/global-search-dialog';
import { NavbarSkeleton, StickyBannerSkeleton } from '@/components/public/public-layout-skeleton';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ambil data banner promo dan informasi identitas/kontak/sosmed dari CMS secara paralel
  const [banner, contact, social] = await Promise.all([
    getActiveBanner().catch((err) => {
      console.error('[PublicLayout] Gagal memuat banner aktif:', err);
      return null;
    }),
    getSiteContent('contact').catch((err) => {
      console.error('[PublicLayout] Gagal memuat konten kontak:', err);
      return null;
    }),
    getSiteContent('social').catch((err) => {
      console.error('[PublicLayout] Gagal memuat konten sosial:', err);
      return null;
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Skip to Main Content Link (WCAG 2.2 AA Criterion 2.4.1 Bypass Blocks) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-hidden focus:ring-2 focus:ring-ring"
      >
        Lewati ke konten utama
      </a>

      {/* Banner Promosi Berjadwal (render null bila tidak ada jadwal aktif) */}
      <Suspense fallback={<StickyBannerSkeleton />}>
        <StickyBanner banner={banner} />
      </Suspense>

      {/* Navbar Navigasi Utama Persisten */}
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar />
      </Suspense>

      {/* Konten Halaman Spesifik (Hanya segmen ini yang re-render saat navigasi) */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-hidden">
        {children}
      </main>

      {/* Footer Publik Resmi & Dynamic Copyright */}
      <Footer contact={contact} social={social} />

      {/* Command Dialog Pencarian Global (Ctrl + K) */}
      <GlobalSearchDialog />
    </div>
  );
}
