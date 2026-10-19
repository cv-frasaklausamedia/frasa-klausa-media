'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogOut, User, Globe, Shield } from 'lucide-react';
import type { AuthenticatedUser } from '@/lib/auth';
import { signOutAction } from '@/actions/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
          className="relative h-9 w-9 rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Menu akun pengguna untuk ${user.fullName}`}
        >
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
            <div className="pt-1.5">
              <Badge variant="secondary" className="text-[10px] font-mono gap-1 py-0 px-1.5">
                <Shield className="h-3 w-3" />
                {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </Badge>
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
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? 'Sedang keluar...' : 'Keluar'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
