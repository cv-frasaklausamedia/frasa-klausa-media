'use client';

import { useState, useEffect } from 'react';
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
import { BLOG_CATEGORY_PAGE_SIZE_OPTIONS } from '@/validations/blog-category';

interface BlogCategoryTableToolbarProps {
  searchQuery: string;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onPageSizeChange: (size: number) => void;
  onAddNew: () => void;
  isPending: boolean;
}

export function BlogCategoryTableToolbar({
  searchQuery,
  pageSize,
  onSearchChange,
  onPageSizeChange,
  onAddNew,
  isPending,
}: BlogCategoryTableToolbarProps) {
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sinkronisasi state saat prop berubah pada proses render (React 19 pattern)
  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  // Debounce 300ms untuk memicu perubahan URL query pencarian
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kategori blog..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-8 pr-8 h-9 text-sm"
            disabled={isPending}
          />
          {localSearch ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Bersihkan pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-muted-foreground hidden md:inline">Baris:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
            disabled={isPending}
          >
            <SelectTrigger className="h-9 w-[70px] text-xs">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent align="end">
              {BLOG_CATEGORY_PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button
          onClick={onAddNew}
          size="sm"
          className="h-9 w-full sm:w-auto flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kategori</span>
        </Button>
      </div>
    </div>
  );
}
