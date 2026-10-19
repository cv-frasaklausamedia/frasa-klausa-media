import * as React from 'react';
import { Suspense } from 'react';
import { BookMarked } from 'lucide-react';
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
      <SidebarHeader className="h-14 shrink-0 flex-row items-center justify-between border-b border-border px-3.5 py-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BookMarked className="h-5 w-5" />
          </div>
          <div className="flex-col overflow-hidden max-md:flex hidden xl:flex xl:sidebar-collapsed:hidden">
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground leading-tight">
              {OFFICIAL_IDENTITY.COMPANY_NAME}
            </span>
            <span className="truncate text-xs text-muted-foreground leading-tight">
              Panel Pengelola CMS
            </span>
          </div>
        </div>
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

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between">
          <Suspense fallback={<div className="h-5 w-14 rounded bg-muted/30 animate-pulse" />}>
            <AdminRoleBadge />
          </Suspense>
          <span className="text-[11px] text-muted-foreground max-md:inline hidden xl:inline xl:sidebar-collapsed:hidden">
            v1.0
          </span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
