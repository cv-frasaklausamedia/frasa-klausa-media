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
import { POST_PAGE_SIZE_OPTIONS } from '@/validations/post';
import type { BlogCategoryOption } from '@/lib/posts/types';

interface PostTableToolbarProps {
  searchQuery: string;
  categoryId: string;
  status: string;
  sort: string;
  pageSize: number;
  categories: BlogCategoryOption[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onPageSizeChange: (size: number) => void;
  isPending: boolean;
}

export function PostTableToolbar({
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
}: PostTableToolbarProps) {
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Pola React 19: Sinkronisasi state saat prop search berubah langsung pada proses render
  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  // Debounce 300ms untuk memicu pembaruan URL query pencarian
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
            placeholder="Cari judul, ringkasan, penulis..."
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

        {/* Filter Kategori Blog */}
        <Select
          value={categoryId}
          onValueChange={onCategoryChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
            <SelectValue placeholder="Kategori" />
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
          <SelectTrigger className="w-full sm:w-36 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="draft">Draf</SelectItem>
            <SelectItem value="published">Terbit</SelectItem>
            <SelectItem value="scheduled">Terjadwal</SelectItem>
          </SelectContent>
        </Select>

        {/* Pengurutan */}
        <Select
          value={sort}
          onValueChange={onSortChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_desc">Terbaru Dibuat</SelectItem>
            <SelectItem value="created_at_asc">Terlama Dibuat</SelectItem>
            <SelectItem value="published_at_desc">Terbaru Terbit</SelectItem>
            <SelectItem value="published_at_asc">Terlama Terbit</SelectItem>
            <SelectItem value="title_asc">Judul (A-Z)</SelectItem>
            <SelectItem value="title_desc">Judul (Z-A)</SelectItem>
          </SelectContent>
        </Select>

        {/* Pemilih Ukuran Halaman */}
        <Select
          value={String(pageSize)}
          onValueChange={(val) => onPageSizeChange(Number(val))}
          disabled={isPending}
        >
          <SelectTrigger className="w-24 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POST_PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} baris
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tombol Tulis Artikel Baru */}
      <div className="shrink-0">
        <Button asChild size="sm" className="gap-2 w-full sm:w-auto h-9">
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4" />
            <span>Tulis Artikel</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
