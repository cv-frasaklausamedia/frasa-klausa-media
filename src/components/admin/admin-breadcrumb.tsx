'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeLabels: Record<string, string> = {
  admin: 'Dashboard',
  books: 'Buku',
  'book-categories': 'Kategori Buku',
  blog: 'Blog',
  'blog-categories': 'Kategori Blog',
  banners: 'Banner Promo',
  'site-content': 'Konten Halaman',
  inbox: 'Inbox Pesan',
  profile: 'Profil',
  users: 'Manajemen Akun',
  settings: 'Pengaturan Sistem',
};

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Jika di root admin ("/admin")
  if (segments.length <= 1) {
    return (
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Jika berada di sub-halaman admin
  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin">Admin</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.slice(1).map((segment, index) => {
          const isLast = index === segments.length - 2;
          const href = `/${segments.slice(0, index + 2).join('/')}`;
          const label = routeLabels[segment] || decodeURIComponent(segment);

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
