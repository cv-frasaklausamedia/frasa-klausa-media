'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { AdminAccountItem, AccountListResponse } from '@/types/accounts';
import { getAccountColumns } from './account-table-columns';
import { AccountTableToolbar } from './account-table-toolbar';
import { CreateAdminDialog } from './create-admin-dialog';
import { ToggleStatusDialog } from './toggle-status-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';

interface AccountTableProps {
  initialData: AccountListResponse;
  currentUserId?: string;
}

export function AccountTable({ initialData, currentUserId }: AccountTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminAccountItem | null>(null);

  const { items, totalCount, page, pageSize, pageCount, activeSuperAdminCount } = initialData;

  const currentQ = searchParams.get('q') || '';
  const currentStatus = searchParams.get('status') || 'all';
  const currentRole = searchParams.get('role') || 'all';

  // Helper sinkronisasi query string di URL
  const updateUrlParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || (key === 'page' && value === 1)) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  const handleSearchChange = useCallback(
    (newQ: string) => {
      updateUrlParams({ q: newQ, page: 1 });
    },
    [updateUrlParams]
  );

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      updateUrlParams({ status: newStatus === 'all' ? null : newStatus, page: 1 });
    },
    [updateUrlParams]
  );

  const handleRoleChange = useCallback(
    (newRole: string) => {
      updateUrlParams({ role: newRole === 'all' ? null : newRole, page: 1 });
    },
    [updateUrlParams]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      updateUrlParams({ pageSize: newSize, page: 1 });
    },
    [updateUrlParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > pageCount) return;
      updateUrlParams({ page: newPage });
    },
    [pageCount, updateUrlParams]
  );

  const handleOpenToggleStatus = useCallback((user: AdminAccountItem) => {
    setSelectedUser(user);
    setToggleDialogOpen(true);
  }, []);

  const handleOpenResetPassword = useCallback((user: AdminAccountItem) => {
    setSelectedUser(user);
    setResetDialogOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      getAccountColumns({
        currentUserId,
        onToggleStatus: handleOpenToggleStatus,
        onResetPassword: handleOpenResetPassword,
      }),
    [currentUserId, handleOpenToggleStatus, handleOpenResetPassword]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar Pencarian & Filter */}
      <AccountTableToolbar
        searchQuery={currentQ}
        statusFilter={currentStatus}
        roleFilter={currentRole}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onRoleChange={handleRoleChange}
        onOpenCreateDialog={() => setCreateDialogOpen(true)}
        isPending={isPending}
      />

      {/* Kontainer Tabel */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={isPending ? 'opacity-60 transition-opacity' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8 stroke-[1.5]" />
                    <p className="text-sm">Tidak ada akun admin yang sesuai kriteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginasi Server-Side */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>Menampilkan</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => handlePageSizeChange(Number(val))}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 w-[70px] text-xs">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>dari {totalCount} total akun</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>
            Halaman {page} dari {pageCount}
          </span>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Halaman sebelumnya</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pageCount || isPending}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Halaman selanjutnya</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      <CreateAdminDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <ToggleStatusDialog
        open={toggleDialogOpen}
        onOpenChange={setToggleDialogOpen}
        targetUser={selectedUser}
        currentUserId={currentUserId}
        activeSuperAdminCount={activeSuperAdminCount}
      />

      <ResetPasswordDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        targetUser={selectedUser}
      />
    </div>
  );
}
