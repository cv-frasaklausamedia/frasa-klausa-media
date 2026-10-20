'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filter, RotateCcw, Search, Tag, Banknote, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BookCategoryOption } from '@/lib/books/types';
import { formatRupiah } from '@/validations/book';

interface KatalogFilterBarProps {
  categories: BookCategoryOption[];
  currentCategory?: string;
  currentMinPrice?: number;
  currentMaxPrice?: number;
  currentQ?: string;
}

export function KatalogFilterBar({
  categories,
  currentCategory = 'all',
  currentMinPrice,
  currentMaxPrice,
  currentQ = '',
}: KatalogFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper resolusi slug kategori secara defensif (menerima slug, id, atau nama)
  const resolveCategoryValue = React.useCallback(
    (val?: string) => {
      if (!val || val === 'all') return 'all';
      const clean = val.trim().toLowerCase();
      const matched = categories.find(
        (c) =>
          c.slug.toLowerCase() === clean ||
          c.name.toLowerCase() === clean ||
          c.id.toLowerCase() === clean
      );
      return matched ? matched.slug : val;
    },
    [categories]
  );

  const [selectedCategory, setSelectedCategory] = React.useState<string>(() =>
    resolveCategoryValue(currentCategory)
  );
  const [minPriceInput, setMinPriceInput] = React.useState<string>(
    currentMinPrice ? String(currentMinPrice) : ''
  );
  const [maxPriceInput, setMaxPriceInput] = React.useState<string>(
    currentMaxPrice ? String(currentMaxPrice) : ''
  );
  const [qInput, setQInput] = React.useState<string>(currentQ || '');

  // Sinkronisasi state lokal saat props dari URL luar berganti
  const [prevProps, setPrevProps] = React.useState({
    currentCategory,
    currentMinPrice,
    currentMaxPrice,
    currentQ,
  });

  if (
    prevProps.currentCategory !== currentCategory ||
    prevProps.currentMinPrice !== currentMinPrice ||
    prevProps.currentMaxPrice !== currentMaxPrice ||
    prevProps.currentQ !== currentQ
  ) {
    setPrevProps({ currentCategory, currentMinPrice, currentMaxPrice, currentQ });
    setSelectedCategory(resolveCategoryValue(currentCategory));
    setMinPriceInput(currentMinPrice ? String(currentMinPrice) : '');
    setMaxPriceInput(currentMaxPrice ? String(currentMaxPrice) : '');
    setQInput(currentQ || '');
  }

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    // Reset ke halaman 1 ketika kriteria filter baru diterapkan
    params.set('page', '1');

    if (qInput.trim()) {
      params.set('q', qInput.trim());
    } else {
      params.delete('q');
    }

    if (selectedCategory && selectedCategory !== 'all') {
      params.set('kategori', selectedCategory);
    } else {
      params.delete('kategori');
    }

    const minNum = parseInt(minPriceInput.replace(/\D/g, ''), 10);
    if (Number.isFinite(minNum) && minNum > 0) {
      params.set('minPrice', String(minNum));
    } else {
      params.delete('minPrice');
    }

    const maxNum = parseInt(maxPriceInput.replace(/\D/g, ''), 10);
    if (Number.isFinite(maxNum) && maxNum > 0) {
      params.set('maxPrice', String(maxNum));
    } else {
      params.delete('maxPrice');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetFilter = () => {
    setSelectedCategory('all');
    setMinPriceInput('');
    setMaxPriceInput('');
    setQInput('');
    router.push(pathname);
  };

  // Helper untuk menghapus satu filter tertentu secara langsung via badge
  const removeFilterParam = (key: 'q' | 'kategori' | 'price') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (key === 'price') {
      params.delete('minPrice');
      params.delete('maxPrice');
      setMinPriceInput('');
      setMaxPriceInput('');
    } else if (key === 'kategori') {
      params.delete('kategori');
      setSelectedCategory('all');
    } else if (key === 'q') {
      params.delete('q');
      setQInput('');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Menemukan label nama kategori terpilih untuk chip filter
  const activeCategoryObj = categories.find(
    (c) =>
      c.slug.toLowerCase() === (currentCategory || '').trim().toLowerCase() ||
      c.name.toLowerCase() === (currentCategory || '').trim().toLowerCase() ||
      c.id.toLowerCase() === (currentCategory || '').trim().toLowerCase()
  );

  const isCategoryActive = Boolean(currentCategory && currentCategory !== 'all');
  const isSearchActive = Boolean(currentQ && currentQ.trim().length > 0);
  const isPriceActive = Boolean((currentMinPrice && currentMinPrice > 0) || (currentMaxPrice && currentMaxPrice > 0));
  const hasActiveFilters = isCategoryActive || isSearchActive || isPriceActive;

  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur-xs p-4 sm:p-5 shadow-xs transition-all space-y-4">
      {/* Header Kecil Filter Bar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>Filter & Pencarian Koleksi</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilter}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Semua</span>
          </button>
        )}
      </div>

      <form onSubmit={handleApplyFilter}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-end">
          {/* 1. Pencarian Kata Kunci */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-q" className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Cari Buku</span>
            </Label>
            <div className="relative">
              <Input
                id="filter-q"
                type="text"
                placeholder="Judul, penulis, ISBN..."
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                className="h-9 text-xs pl-3 pr-8 bg-background/50 focus:bg-background transition-colors"
              />
              {qInput && (
                <button
                  type="button"
                  onClick={() => setQInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Pilihan Kategori */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-category" className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Kategori Buku</span>
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(val) => setSelectedCategory(val)}
            >
              <SelectTrigger id="filter-category" aria-label="Pilih kategori buku" className="h-9 text-xs bg-background/50 focus:bg-background">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Kategori
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Rentang Harga Min & Max */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Rentang Harga (IDR)</span>
            </Label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Input
                  type="number"
                  placeholder="Min"
                  aria-label="Harga minimum (IDR)"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="h-9 text-xs bg-background/50 focus:bg-background"
                  min="0"
                  step="5000"
                />
              </div>
              <span className="text-muted-foreground text-xs font-medium select-none">—</span>
              <div className="relative flex-1">
                <Input
                  type="number"
                  placeholder="Maks"
                  aria-label="Harga maksimum (IDR)"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="h-9 text-xs bg-background/50 focus:bg-background"
                  min="0"
                  step="5000"
                />
              </div>
            </div>
          </div>

          {/* 4. Tombol Aksi Terapkan */}
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <Button type="submit" size="sm" className="w-full h-9 gap-1.5 text-xs font-medium shadow-xs">
              <Filter className="h-3.5 w-3.5" />
              Terapkan Filter
            </Button>
          </div>
        </div>
      </form>

      {/* 5. Active Filter Chips / Badges untuk Feedback Interaktif */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-muted-foreground font-medium">Filter aktif:</span>

          {isCategoryActive && (
            <Badge
              variant="secondary"
              className="h-6 gap-1.5 pl-2.5 pr-1.5 text-[11px] font-normal border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
            >
              <Tag className="h-3 w-3" />
              <span>Kategori: {activeCategoryObj?.name || currentCategory}</span>
              <button
                type="button"
                onClick={() => removeFilterParam('kategori')}
                className="rounded-full hover:bg-primary/20 p-0.5 ml-0.5 transition-colors"
                aria-label="Hapus filter kategori"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {isSearchActive && (
            <Badge
              variant="secondary"
              className="h-6 gap-1.5 pl-2.5 pr-1.5 text-[11px] font-normal border border-muted-foreground/20 bg-muted text-foreground"
            >
              <Search className="h-3 w-3" />
              <span className="max-w-[120px] truncate">&ldquo;{currentQ}&rdquo;</span>
              <button
                type="button"
                onClick={() => removeFilterParam('q')}
                className="rounded-full hover:bg-muted-foreground/20 p-0.5 ml-0.5 transition-colors"
                aria-label="Hapus kata kunci pencarian"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {isPriceActive && (
            <Badge
              variant="secondary"
              className="h-6 gap-1.5 pl-2.5 pr-1.5 text-[11px] font-normal border border-muted-foreground/20 bg-muted text-foreground"
            >
              <Banknote className="h-3 w-3" />
              <span>
                {currentMinPrice && currentMaxPrice
                  ? `${formatRupiah(currentMinPrice)} - ${formatRupiah(currentMaxPrice)}`
                  : currentMinPrice
                  ? `Min. ${formatRupiah(currentMinPrice)}`
                  : `Maks. ${formatRupiah(currentMaxPrice!)}`}
              </span>
              <button
                type="button"
                onClick={() => removeFilterParam('price')}
                className="rounded-full hover:bg-muted-foreground/20 p-0.5 ml-0.5 transition-colors"
                aria-label="Hapus filter rentang harga"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
