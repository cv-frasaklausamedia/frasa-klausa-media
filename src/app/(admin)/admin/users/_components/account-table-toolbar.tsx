'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AccountTableToolbarProps {
  searchQuery: string;
  statusFilter: string;
  roleFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onOpenCreateDialog: () => void;
  isPending?: boolean;
}

export function AccountTableToolbar({
  searchQuery,
  statusFilter,
  roleFilter,
  onSearchChange,
  onStatusChange,
  onRoleChange,
  onOpenCreateDialog,
  isPending,
}: AccountTableToolbarProps) {
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Pola React 19: Sinkronisasi state saat prop berubah langsung pada proses render
  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || roleFilter !== 'all';

  const handleResetFilters = () => {
    setLocalSearch('');
    onSearchChange('');
    onStatusChange('all');
    onRoleChange('all');
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Input Pencarian */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau email..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
            disabled={isPending}
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Hapus pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Status */}
        <Select
          value={statusFilter}
          onValueChange={onStatusChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Peran */}
        <Select
          value={roleFilter}
          onValueChange={onRoleChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder="Peran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Peran</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            disabled={isPending}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Tombol Buat Admin Baru */}
      <Button
        onClick={onOpenCreateDialog}
        size="sm"
        className="h-9 gap-1.5 shadow-sm"
      >
        <UserPlus className="h-4 w-4" />
        Tambah Admin Baru
      </Button>
    </div>
  );
}
