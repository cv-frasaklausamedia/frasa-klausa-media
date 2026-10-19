'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, KeyRound, Ban, CheckCircle2, User } from 'lucide-react';

import type { AdminAccountItem } from '@/types/accounts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GetAccountColumnsOptions {
  currentUserId?: string;
  onToggleStatus: (user: AdminAccountItem) => void;
  onResetPassword: (user: AdminAccountItem) => void;
}

export function getAccountColumns({
  currentUserId,
  onToggleStatus,
  onResetPassword,
}: GetAccountColumnsOptions): ColumnDef<AdminAccountItem>[] {
  return [
    {
      accessorKey: 'fullName',
      header: 'Nama Pengguna',
      cell: ({ row }) => {
        const item = row.original;
        const initials = item.fullName
          ? item.fullName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
          : 'AD';

        const isSelf = currentUserId === item.id;

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border/50">
              {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.fullName} />}
              <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                {initials || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-medium text-foreground text-sm">
                <span>{item.fullName}</span>
                {isSelf && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal">
                    Anda
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground md:hidden">
                {item.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Alamat Email',
      cell: ({ row }) => {
        return (
          <span className="font-mono text-xs text-foreground/90">
            {row.original.email || '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Peran',
      cell: ({ row }) => {
        const isSuperAdmin = row.original.role === 'super_admin';
        return isSuperAdmin ? (
          <Badge
            variant="outline"
            className="border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400 font-mono text-[11px] uppercase tracking-wider"
          >
            Super Admin
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-mono text-[11px] uppercase tracking-wider"
          >
            Admin
          </Badge>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return isActive ? (
          <Badge
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-xs gap-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Aktif
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium text-xs gap-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Nonaktif
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Dibuat Pada',
      cell: ({ row }) => {
        try {
          const date = new Date(row.original.createdAt);
          return (
            <span className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(date)}
            </span>
          );
        } catch {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => {
        const item = row.original;
        const isSelf = currentUserId === item.id;

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <span className="sr-only">Buka menu aksi</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Aksi Pengguna</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onResetPassword(item)}
                  className="cursor-pointer text-xs gap-2"
                >
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  Reset Kata Sandi
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onToggleStatus(item)}
                  disabled={isSelf && item.isActive}
                  className={`cursor-pointer text-xs gap-2 ${
                    item.isActive
                      ? 'text-destructive focus:text-destructive'
                      : 'text-emerald-600 focus:text-emerald-600'
                  }`}
                >
                  {item.isActive ? (
                    <>
                      <Ban className="h-3.5 w-3.5" />
                      Nonaktifkan Akun
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aktifkan Akun
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
