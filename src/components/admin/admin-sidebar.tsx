import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { OFFICIAL_IDENTITY } from '@/constants';
import { AdminSidebarMainNav } from './admin-sidebar-main-nav';
import { SuperAdminSection } from './super-admin-section';
import { AdminRoleBadge } from './admin-role-badge';

export function AdminSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 shrink-0 flex items-center border-b border-border px-3.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
        <Link
          href="/admin"
          className="flex items-center gap-3 min-w-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-lg transition-opacity hover:opacity-95 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:gap-0"
        >
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-white p-0.5 shadow-xs ring-1 ring-black/5 transition-transform duration-200 hover:scale-[1.03] dark:border-white/15 dark:ring-white/10 dark:bg-white">
            <Image
              src="/logo/logo.jpg"
              alt={OFFICIAL_IDENTITY.COMPANY_NAME}
              fill
              sizes="36px"
              className="object-contain p-0.5"
              priority
            />
          </div>
          <div className="flex-col overflow-hidden max-md:flex hidden xl:flex group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground leading-tight">
              {OFFICIAL_IDENTITY.COMPANY_NAME}
            </span>
            <span className="truncate text-xs text-muted-foreground leading-tight">
              Panel Pengelola CMS
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Menu Utama (Statis dalam PPR Shell) */}
        <Suspense fallback={<div className="h-64 w-full" aria-hidden="true" />}>
          <AdminSidebarMainNav />
        </Suspense>

        {/* Menu Khusus Super Admin (Streamed Non-Blocking dengan Fixed Height Fallback) */}
        <Suspense fallback={<div className="h-[96px] w-full" aria-hidden="true" />}>
          <SuperAdminSection />
        </Suspense>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center w-full">
          <Suspense fallback={<div className="h-5 w-14 rounded bg-muted/30 animate-pulse" />}>
            <AdminRoleBadge />
          </Suspense>
          <span className="text-[11px] text-muted-foreground max-md:inline hidden xl:inline group-data-[collapsible=icon]:hidden">
            v1.0
          </span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
