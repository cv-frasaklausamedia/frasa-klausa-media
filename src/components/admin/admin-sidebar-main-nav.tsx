'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Tags,
  FileText,
  Bookmark,
  Sparkles,
  PanelsTopLeft,
  Inbox,
  UserCheck,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Buku',
    href: '/admin/books',
    icon: BookOpen,
  },
  {
    title: 'Kategori Buku',
    href: '/admin/book-categories',
    icon: Tags,
  },
  {
    title: 'Blog',
    href: '/admin/blog',
    icon: FileText,
  },
  {
    title: 'Kategori Blog',
    href: '/admin/blog-categories',
    icon: Bookmark,
  },
  {
    title: 'Banner Promo',
    href: '/admin/banners',
    icon: Sparkles,
  },
  {
    title: 'Konten Halaman',
    href: '/admin/site-content',
    icon: PanelsTopLeft,
  },
  {
    title: 'Inbox Pesan',
    href: '/admin/inbox',
    icon: Inbox,
  },
  {
    title: 'Profil',
    href: '/admin/profile',
    icon: UserCheck,
  },
];

export function AdminSidebarMainNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const isItemActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="max-md:block hidden xl:block xl:sidebar-collapsed:hidden">
        Menu Utama
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className={active ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground' : ''}
                >
                  <Link href={item.href} onClick={handleLinkClick}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="max-md:inline hidden xl:inline xl:sidebar-collapsed:hidden">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
