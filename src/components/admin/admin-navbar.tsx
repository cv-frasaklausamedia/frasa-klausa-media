import * as React from 'react';
import { Suspense } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { AdminBreadcrumb } from './admin-breadcrumb';
import { AdminUserNavServer } from './admin-user-nav-server';

export function AdminNavbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Suspense fallback={<div className="h-5 w-32 rounded bg-muted/30" />}>
          <AdminBreadcrumb />
        </Suspense>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Suspense fallback={<div className="h-9 w-9 rounded-full bg-muted/60 animate-pulse" />}>
          <AdminUserNavServer />
        </Suspense>
      </div>
    </header>
  );
}
