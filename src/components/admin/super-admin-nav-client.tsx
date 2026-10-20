'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Settings } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const superAdminNavItems = [
  {
    title: 'Manajemen Akun',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Pengaturan Sistem',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function SuperAdminNavClient() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
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
                    <span className="group-data-[collapsible=icon]:hidden">
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
