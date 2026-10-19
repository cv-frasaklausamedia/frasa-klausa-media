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
      {/* Banner Promosi Berjadwal (render null bila tidak ada jadwal aktif) */}
      <Suspense fallback={<StickyBannerSkeleton />}>
        <StickyBanner banner={banner} />
      </Suspense>

      {/* Navbar Navigasi Utama Persisten */}
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar />
      </Suspense>

      {/* Konten Halaman Spesifik (Hanya segmen ini yang re-render saat navigasi) */}
      <main className="flex-1">{children}</main>

      {/* Footer Publik Resmi & Dynamic Copyright */}
      <Footer contact={contact} social={social} />

      {/* Command Dialog Pencarian Global (Ctrl + K) */}
      <GlobalSearchDialog />
    </div>
  );
}
