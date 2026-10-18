import * as React from 'react';
import { getActiveBanner } from '@/lib/banners/data-access';
import { AnnouncementBanner } from '@/components/common/announcement-banner';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const activeBanner = await getActiveBanner();

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Sticky Banner Promo Berjadwal di atas navbar publik (PRD §6.2.B & §6.3.1) */}
      <AnnouncementBanner banner={activeBanner} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
