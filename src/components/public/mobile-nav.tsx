'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Home,
  BookOpen,
  FileText,
  Info,
  Phone,
  Search,
  LogIn,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { useUIStore } from '@/stores/use-ui-store';
import { OFFICIAL_IDENTITY } from '@/constants';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Beranda', href: '/', icon: Home },
  { label: 'Katalog Buku', href: '/katalog', icon: BookOpen },
  { label: 'Blog Literasi', href: '/blog', icon: FileText },
  { label: 'Tentang Kami', href: '/tentang-kami', icon: Info },
  { label: 'Kontak', href: '/kontak', icon: Phone },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();
  const { setSearchOpen } = useUIStore();

  const handleOpenSearch = () => {
    setIsOpen(false);
    setSearchOpen(true);
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 text-foreground"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex flex-col w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-6 pb-4 border-b text-left">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-white p-0.5 shadow-xs ring-1 ring-black/5 dark:border-white/15 dark:ring-white/10 dark:bg-white">
              <Image
                src="/logo/logo.jpg"
                alt={OFFICIAL_IDENTITY.COMPANY_NAME}
                fill
                sizes="44px"
                className="object-contain p-0.5"
              />
            </div>
            <div>
              <SheetTitle className="text-base font-serif font-bold tracking-tight">
                {OFFICIAL_IDENTITY.COMPANY_NAME}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground line-clamp-1">
                {OFFICIAL_IDENTITY.TAGLINE}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Search trigger button in mobile drawer */}
        <div className="px-6 pt-4 pb-2">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-3.5 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Cari buku atau artikel...</span>
            </div>
            <kbd className="pointer-events-none rounded border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer in Drawer: ThemeToggle & CMS Login */}
        <div className="border-t p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Tema Tampilan</span>
            <ThemeToggle />
          </div>

          <Separator />

          <Button asChild variant="outline" className="w-full justify-center gap-2" size="sm">
            <Link href="/login" onClick={handleNavClick}>
              <LogIn className="h-4 w-4" />
              <span>Login Redaksi / CMS</span>
            </Link>
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            {OFFICIAL_IDENTITY.COMPANY_NAME}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
