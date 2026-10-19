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
  ChevronRight,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface SingleNavItem {
  type: 'single';
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface GroupNavItem {
  type: 'group';
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

type NavItem = SingleNavItem | GroupNavItem;

const mainNavItems: NavItem[] = [
  {
    type: 'single',
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    type: 'group',
    title: 'Buku',
    icon: BookOpen,
    children: [
      {
        title: 'Semua Buku',
        href: '/admin/books',
        icon: BookOpen,
      },
      {
        title: 'Kategori Buku',
        href: '/admin/book-categories',
        icon: Tags,
      },
    ],
  },
  {
    type: 'group',
    title: 'Blog',
    icon: FileText,
    children: [
      {
        title: 'Semua Artikel',
        href: '/admin/blog',
        icon: FileText,
      },
      {
        title: 'Kategori Blog',
        href: '/admin/blog-categories',
        icon: Bookmark,
      },
    ],
  },
  {
    type: 'single',
    title: 'Banner Promo',
    href: '/admin/banners',
    icon: Sparkles,
  },
  {
    type: 'single',
    title: 'Konten Halaman',
    href: '/admin/site-content',
    icon: PanelsTopLeft,
  },
  {
    type: 'single',
    title: 'Inbox Pesan',
    href: '/admin/inbox',
    icon: Inbox,
  },
  {
    type: 'single',
    title: 'Profil',
    href: '/admin/profile',
    icon: UserCheck,
  },
];

interface CollapsibleNavGroupProps {
  item: GroupNavItem;
  pathname: string;
  onNavigate: () => void;
}

function CollapsibleNavGroup({ item, pathname, onNavigate }: CollapsibleNavGroupProps) {
  const isAnyChildActive = item.children.some((child) => pathname.startsWith(child.href));
  const [isOpen, setIsOpen] = React.useState(isAnyChildActive);

  // Otomatis buka accordion jika pengguna membuka salah satu rute anak
  React.useEffect(() => {
    if (isAnyChildActive) {
      setIsOpen(true);
    }
  }, [isAnyChildActive]);

  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      {/* 1. Mode Ciut / Icon Mode (Tablet & Desktop Collapsed 72px): Floating Dropdown Popover */}
      <div className="hidden md:block xl:hidden xl:sidebar-collapsed:block w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              isActive={isAnyChildActive}
              tooltip={item.title}
              className={cn(
                'cursor-pointer justify-center transition-colors',
                isAnyChildActive && 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="sr-only">{item.title}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={12}
            className="min-w-48 p-1.5 shadow-lg border border-border/80 bg-popover rounded-xl"
          >
            <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {item.title}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-border/60" />
            {item.children.map((child) => {
              const childActive = pathname.startsWith(child.href);
              const ChildIcon = child.icon;
              return (
                <DropdownMenuItem key={child.href} asChild>
                  <Link
                    href={child.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2.5 cursor-pointer text-xs py-2 px-2.5 rounded-lg transition-colors',
                      childActive
                        ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
                        : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {ChildIcon ? (
                      <ChildIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    )}
                    <span>{child.title}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Mode Lebar / Expanded (Desktop XL & Mobile Drawer): Accordion Collapsible */}
      <div className="max-md:block hidden xl:block xl:sidebar-collapsed:hidden w-full">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              isActive={isAnyChildActive}
              className={cn(
                'w-full justify-between cursor-pointer transition-colors',
                isAnyChildActive
                  ? 'font-semibold text-sidebar-accent-foreground bg-sidebar-accent/60'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-sidebar-foreground/80" />
                <span className="text-sm">{item.title}</span>
              </div>
              <ChevronRight
                className={cn(
                  'h-4 w-4 shrink-0 text-sidebar-foreground/50 transition-transform duration-200',
                  isOpen && 'rotate-90 text-sidebar-foreground'
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden transition-all duration-200">
            <SidebarMenuSub className="my-1 ml-3.5 border-l border-sidebar-border/70 pl-2 space-y-0.5">
              {item.children.map((child) => {
                const childActive = pathname.startsWith(child.href);
                const ChildIcon = child.icon;
                return (
                  <SidebarMenuSubItem key={child.href}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={childActive}
                      className={cn(
                        'h-8 text-xs py-1.5 px-2.5 rounded-md transition-colors',
                        childActive
                          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/40'
                      )}
                    >
                      <Link href={child.href} onClick={onNavigate} className="flex items-center gap-2">
                        {ChildIcon ? (
                          <ChildIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-sidebar-border" />
                        )}
                        <span>{child.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </SidebarMenuItem>
  );
}

export function AdminSidebarMainNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const isSingleItemActive = (href: string) => {
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
            if (item.type === 'group') {
              return (
                <CollapsibleNavGroup
                  key={item.title}
                  item={item}
                  pathname={pathname}
                  onNavigate={handleLinkClick}
                />
              );
            }

            const Icon = item.icon;
            const active = isSingleItemActive(item.href);

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
