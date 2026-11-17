'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { RotateCcw, Search, Tag, Banknote, X, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { BookCategoryOption } from '@/lib/books/types';
import { formatRupiah } from '@/validations/book';
import { cn } from '@/lib/utils';

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

  const activeCategorySlug = resolveCategoryValue(currentCategory);

  // State lokal input pencarian
  const [qInput, setQInput] = React.useState<string>(currentQ || '');

  // State lokal popover harga
  const [pricePopoverOpen, setPricePopoverOpen] = React.useState(false);
  const [popoverMin, setPopoverMin] = React.useState<string>(
    currentMinPrice ? String(currentMinPrice) : ''
  );
  const [popoverMax, setPopoverMax] = React.useState<string>(
    currentMaxPrice ? String(currentMaxPrice) : ''
  );

  // Sinkronisasi state lokal saat props dari URL luar berganti (adjusting state during render)
  const [prevQ, setPrevQ] = React.useState(currentQ);
  if (currentQ !== prevQ) {
    setPrevQ(currentQ);
    setQInput(currentQ || '');
  }

  const [prevPrices, setPrevPrices] = React.useState({ min: currentMinPrice, max: currentMaxPrice });
  if (currentMinPrice !== prevPrices.min || currentMaxPrice !== prevPrices.max) {
    setPrevPrices({ min: currentMinPrice, max: currentMaxPrice });
    setPopoverMin(currentMinPrice ? String(currentMinPrice) : '');
    setPopoverMax(currentMaxPrice ? String(currentMaxPrice) : '');
  }

  // Handler Ganti Kategori via Quick Pills
  const handleSelectCategory = (catSlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (catSlug && catSlug !== 'all') {
      params.set('kategori', catSlug);
    } else {
      params.delete('kategori');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handler Submit Pencarian
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (qInput.trim()) {
      params.set('q', qInput.trim());
    } else {
      params.delete('q');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handler Clear Input Pencarian
  const handleClearSearch = () => {
    setQInput('');
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    params.delete('q');
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handler Terapkan Filter Harga dari Popover
  const handleApplyPrice = (customMin?: number, customMax?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    const minNum =
      customMin !== undefined
        ? customMin
        : parseInt(popoverMin.replace(/\D/g, ''), 10);
    const maxNum =
      customMax !== undefined
        ? customMax
        : parseInt(popoverMax.replace(/\D/g, ''), 10);

    if (Number.isFinite(minNum) && minNum > 0) {
      params.set('minPrice', String(minNum));
    } else {
      params.delete('minPrice');
    }

    if (Number.isFinite(maxNum) && maxNum > 0) {
      params.set('maxPrice', String(maxNum));
    } else {
      params.delete('maxPrice');
    }

    setPricePopoverOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handler Reset Harga Saja
  const handleResetPrice = () => {
    setPopoverMin('');
    setPopoverMax('');
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    params.delete('minPrice');
    params.delete('maxPrice');
    setPricePopoverOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handler Reset Seluruh Filter
  const handleResetAll = () => {
    setQInput('');
    setPopoverMin('');
    setPopoverMax('');
    router.push(pathname);
  };

  // Helper untuk menghapus satu filter tertentu via chip
  const removeFilterParam = (key: 'q' | 'kategori' | 'price') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (key === 'price') {
      params.delete('minPrice');
      params.delete('maxPrice');
      setPopoverMin('');
      setPopoverMax('');
    } else if (key === 'kategori') {
      params.delete('kategori');
    } else if (key === 'q') {
      params.delete('q');
      setQInput('');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const activeCategoryObj = categories.find(
    (c) =>
      c.slug.toLowerCase() === (currentCategory || '').trim().toLowerCase() ||
      c.name.toLowerCase() === (currentCategory || '').trim().toLowerCase() ||
      c.id.toLowerCase() === (currentCategory || '').trim().toLowerCase()
  );

  const isCategoryActive = Boolean(currentCategory && currentCategory !== 'all');
  const isSearchActive = Boolean(currentQ && currentQ.trim().length > 0);
  const isPriceActive = Boolean(
    (currentMinPrice && currentMinPrice > 0) || (currentMaxPrice && currentMaxPrice > 0)
  );
  const hasActiveFilters = isCategoryActive || isSearchActive || isPriceActive;

  return (
    <div className="space-y-4">
      {/* 1. Quick Category Pills (Scrollable Horizontal) */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
          {/* Tombol Semua Buku */}
          <button
            type="button"
            onClick={() => handleSelectCategory('all')}
            className={cn(
              'shrink-0 inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-medium transition-all select-none',
              !isCategoryActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs ring-2 ring-primary/20'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
            )}
          >
            Semua Buku
          </button>

          {/* Deretan Kategori dari Database */}
          {categories.map((c) => {
            const isSelected = activeCategorySlug.toLowerCase() === c.slug.toLowerCase();
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCategory(c.slug)}
                className={cn(
                  'shrink-0 inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-medium transition-all select-none',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs ring-2 ring-primary/20'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
                )}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Unified Search & Secondary Controls */}
      <div className="rounded-2xl border bg-card/70 backdrop-blur-xs p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Form Pencarian Cepat */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 flex items-center"
          >
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none select-none" />
            <Input
              type="text"
              placeholder="Cari judul, penulis, atau ISBN..."
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              className="h-10 pl-9 pr-9 text-xs sm:text-sm bg-background/60 focus:bg-background rounded-xl transition-all"
            />
            {qInput ? (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Bersihkan kata kunci pencarian"
                className="absolute right-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </form>

          {/* Kontrol Sekunder: Popover Harga & Tombol Reset */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Popover Rentang Harga */}
            <Popover open={pricePopoverOpen} onOpenChange={setPricePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant={isPriceActive ? 'secondary' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-10 px-3.5 text-xs font-medium rounded-xl gap-2 transition-all',
                    isPriceActive
                      ? 'border-primary/30 bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Banknote className="h-4 w-4" />
                  <span>
                    {isPriceActive
                      ? currentMinPrice && currentMaxPrice
                        ? `${formatRupiah(currentMinPrice)} - ${formatRupiah(currentMaxPrice)}`
                        : currentMinPrice
                        ? `Min. ${formatRupiah(currentMinPrice)}`
                        : `Maks. ${formatRupiah(currentMaxPrice!)}`
                      : 'Rentang Harga'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 p-4 space-y-4 rounded-xl shadow-lg border bg-popover"
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground">
                    Filter Rentang Harga (IDR)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Tentukan batas harga buku yang ingin ditampilkan.
                  </p>
                </div>

                {/* Preset Harga Cepat */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Pilihan Cepat:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPrice(0, 50000)}
                      className="px-2 py-1 text-[11px] font-medium border rounded-md hover:bg-muted text-center transition-colors truncate"
                    >
                      &lt; 50 rb
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPrice(50000, 100000)}
                      className="px-2 py-1 text-[11px] font-medium border rounded-md hover:bg-muted text-center transition-colors truncate"
                    >
                      50 - 100 rb
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPrice(100000, 0)}
                      className="px-2 py-1 text-[11px] font-medium border rounded-md hover:bg-muted text-center transition-colors truncate"
                    >
                      &gt; 100 rb
                    </button>
                  </div>
                </div>

                {/* Input Manual Min & Max */}
                <div className="grid grid-cols-2 gap-2.5 items-center">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-medium">Minimum</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-medium select-none">
                        Rp
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        aria-label="Harga minimum (IDR)"
                        value={popoverMin}
                        onChange={(e) => setPopoverMin(e.target.value.replace(/\D/g, ''))}
                        className="h-8 pl-8 text-xs rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-medium">Maksimum</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-medium select-none">
                        Rp
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Maks"
                        aria-label="Harga maksimum (IDR)"
                        value={popoverMax}
                        onChange={(e) => setPopoverMax(e.target.value.replace(/\D/g, ''))}
                        className="h-8 pl-8 text-xs rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Popover */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetPrice}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Reset Harga
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApplyPrice()}
                    className="h-8 px-3.5 text-xs font-medium gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Terapkan
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Tombol Reset Seluruh Filter (jika ada yang aktif) */}
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetAll}
                className="h-10 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors gap-1.5"
                title="Reset seluruh kriteria filter"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* 3. Active Filter Chips / Badges Interaktif */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 mt-3 border-t border-border/50 text-xs">
            <span className="text-[11px] text-muted-foreground font-medium mr-1">Filter aktif:</span>

            {isCategoryActive && (
              <Badge
                variant="secondary"
                className="h-6 gap-1.5 pl-2.5 pr-1 text-[11px] font-normal border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 transition-colors rounded-full"
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
                className="h-6 gap-1.5 pl-2.5 pr-1 text-[11px] font-normal border border-muted-foreground/20 bg-muted text-foreground rounded-full"
              >
                <Search className="h-3 w-3" />
                <span className="max-w-[140px] truncate">&ldquo;{currentQ}&rdquo;</span>
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
                className="h-6 gap-1.5 pl-2.5 pr-1 text-[11px] font-normal border border-muted-foreground/20 bg-muted text-foreground rounded-full"
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

            <button
              type="button"
              onClick={handleResetAll}
              className="text-[11px] text-muted-foreground hover:text-destructive underline underline-offset-2 ml-1 transition-colors"
            >
              Hapus semua
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
