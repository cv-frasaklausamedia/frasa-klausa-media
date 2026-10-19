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
  Users,
  Settings,
  BookMarked,
} from 'lucide-react';
import type { AuthenticatedUser } from '@/lib/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { OFFICIAL_IDENTITY } from '@/constants';

interface AdminSidebarProps {
  user: AuthenticatedUser;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  superAdminOnly?: boolean;
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

const superAdminNavItems: NavItem[] = [
  {
    title: 'Manajemen Akun',
    href: '/admin/users',
    icon: Users,
    superAdminOnly: true,
  },
  {
    title: 'Pengaturan Sistem',
    href: '/admin/settings',
    icon: Settings,
    superAdminOnly: true,
  },
];

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isItemActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BookMarked className="h-5 w-5" />
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              {OFFICIAL_IDENTITY.COMPANY_NAME}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Panel Pengelola CMS
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Menu Utama (Admin & Super Admin) */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
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
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Khusus Super Admin */}
        {user.role === 'super_admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Super Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminNavItems.map((item) => {
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
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:hidden">
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
              {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
            v1.0
          </span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
