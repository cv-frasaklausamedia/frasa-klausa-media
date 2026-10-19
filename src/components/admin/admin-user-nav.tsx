'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { signOutAction } from '@/actions/auth';
import type { AuthenticatedUser } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Shield, Globe, Loader2 } from 'lucide-react';

interface AdminUserNavProps {
  user: AuthenticatedUser;
}

export function AdminUserNav({ user }: AdminUserNavProps) {
  const [isLoggingOut, startTransition] = React.useTransition();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AD';
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-0 cursor-pointer"
          aria-label={`Menu akun pengguna untuk ${user.fullName}`}
        >
          <Avatar className="h-9 w-9 border border-border shadow-xs">
            <AvatarImage
              src={user.avatarUrl ?? undefined}
              alt={user.fullName}
              className="aspect-square h-full w-full object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs select-none">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border shrink-0 shadow-xs">
              <AvatarImage
                src={user.avatarUrl ?? undefined}
                alt={user.fullName}
                className="aspect-square h-full w-full object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs select-none">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none text-foreground truncate">{user.fullName}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
              <div className="pt-1">
                <Badge variant="secondary" className="text-[10px] font-mono gap-1 py-0 px-1.5">
                  <Shield className="h-3 w-3" />
                  {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </Badge>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/admin/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profil Saya</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <Globe className="mr-2 h-4 w-4" />
              <span>Kunjungi Situs Publik</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={(e) => {
            e.preventDefault();
            handleSignOut();
          }}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Mengeluarkan...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar (Logout)</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
