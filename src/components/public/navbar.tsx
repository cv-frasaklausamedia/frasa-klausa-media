'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { MobileNav } from '@/components/public/mobile-nav';
import { useUIStore } from '@/stores/use-ui-store';
import { OFFICIAL_IDENTITY } from '@/constants';
import { cn } from '@/lib/utils';

const MAIN_NAV_ITEMS = [
  { label: 'Beranda', href: '/' },
  { label: 'Katalog', href: '/katalog' },
  { label: 'Blog', href: '/blog' },
  { label: 'Tentang Kami', href: '/tentang-kami' },
  { label: 'Kontak', href: '/kontak' },
];

export function Navbar() {
  const pathname = usePathname();
  const { setSearchOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Nav Drawer Trigger + Brand Logo */}
        <div className="flex items-center gap-3">
          <MobileNav />

          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border bg-background">
              <Image
                src="/logo/logo.png"
                alt={OFFICIAL_IDENTITY.COMPANY_NAME}
                fill
                sizes="36px"
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-foreground leading-tight">
                {OFFICIAL_IDENTITY.COMPANY_NAME}
              </span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline-block leading-none">
                {OFFICIAL_IDENTITY.TAGLINE}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium"
          aria-label="Navigasi Utama"
        >
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors py-1 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs',
                  isActive
                    ? 'text-primary font-semibold border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Global Search Trigger + Theme Toggle + Fast Login Link */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Buka pencarian global (Ctrl + K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="inline-block">Cari buku, artikel...</span>
            <kbd className="pointer-events-none rounded border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Ctrl K
            </kbd>
          </button>

          {/* Mobile Search Icon Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="sm:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Cari buku atau artikel"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Desktop Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* CMS Redaksi Link */}
          <Button asChild size="sm" variant="outline" className="hidden lg:inline-flex gap-1.5 text-xs">
            <Link href="/login">
              <LogIn className="h-3.5 w-3.5" />
              <span>CMS Redaksi</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
