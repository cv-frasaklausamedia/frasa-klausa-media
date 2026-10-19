'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BOOK_PAGE_SIZE_OPTIONS } from '@/validations/book';
import type { BookCategoryOption } from '@/lib/books/types';

interface BookTableToolbarProps {
  searchQuery: string;
  categoryId: string;
  status: string;
  sort: string;
  pageSize: number;
  categories: BookCategoryOption[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onPageSizeChange: (size: number) => void;
  isPending: boolean;
}

export function BookTableToolbar({
  searchQuery,
  categoryId,
  status,
  sort,
  pageSize,
  categories,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onSortChange,
  onPageSizeChange,
  isPending,
}: BookTableToolbarProps) {
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Pola React 19: Sinkronisasi state saat prop search berubah langsung pada proses render
  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  // Debounce 300ms untuk memicu perubahan URL query pencarian & bersihkan saat unmount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 py-2">
      {/* Bagian Filter & Pencarian */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search Input dengan Debounce 300ms */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari judul, penulis, ISBN..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-8 h-9 text-sm"
            disabled={isPending}
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Kategori */}
        <Select
          value={categoryId}
          onValueChange={onCategoryChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Status */}
        <Select
          value={status}
          onValueChange={onStatusChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="published">Terbit (Publik)</SelectItem>
            <SelectItem value="draft">Draf (Disimpan)</SelectItem>
          </SelectContent>
        </Select>

        {/* Urutan (Sorting Allowlist) */}
        <Select
          value={sort}
          onValueChange={onSortChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Urutan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_desc">Terbaru Dibuat</SelectItem>
            <SelectItem value="created_at_asc">Terlama Dibuat</SelectItem>
            <SelectItem value="title_asc">Judul (A - Z)</SelectItem>
            <SelectItem value="title_desc">Judul (Z - A)</SelectItem>
            <SelectItem value="price_asc">Harga Termurah</SelectItem>
            <SelectItem value="price_desc">Harga Termahal</SelectItem>
            <SelectItem value="year_desc">Tahun (Terbaru)</SelectItem>
            <SelectItem value="year_asc">Tahun (Terlama)</SelectItem>
          </SelectContent>
        </Select>

        {/* Page Size Selector */}
        <Select
          value={String(pageSize)}
          onValueChange={(val) => onPageSizeChange(Number(val))}
          disabled={isPending}
        >
          <SelectTrigger className="w-[90px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BOOK_PAGE_SIZE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt} / hal
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tombol Tambah Buku Baru */}
      <Button asChild size="sm" className="h-9 gap-1.5 shrink-0">
        <Link href="/admin/books/new">
          <Plus className="h-4 w-4" />
          <span>Tambah Buku</span>
        </Link>
      </Button>
    </div>
  );
}
