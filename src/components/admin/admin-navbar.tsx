'use client';

import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { AdminBreadcrumb } from './admin-breadcrumb';
import { AdminUserNav } from './admin-user-nav';
import type { AuthenticatedUser } from '@/lib/auth';

interface AdminNavbarProps {
  user: AuthenticatedUser;
}

export function AdminNavbar({ user }: AdminNavbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <AdminBreadcrumb />
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <AdminUserNav user={user} />
      </div>
    </header>
  );
}
