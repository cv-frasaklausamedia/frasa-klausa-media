'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BookCategoryOption } from '@/lib/books/types';

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

  const [selectedCategory, setSelectedCategory] = React.useState<string>(currentCategory || 'all');
  const [minPriceInput, setMinPriceInput] = React.useState<string>(
    currentMinPrice ? String(currentMinPrice) : ''
  );
  const [maxPriceInput, setMaxPriceInput] = React.useState<string>(
    currentMaxPrice ? String(currentMaxPrice) : ''
  );
  const [qInput, setQInput] = React.useState<string>(currentQ || '');

  // Sinkronkan state lokal bila prop berubah (misal dari URL luar)
  React.useEffect(() => {
    setSelectedCategory(currentCategory || 'all');
    setMinPriceInput(currentMinPrice ? String(currentMinPrice) : '');
    setMaxPriceInput(currentMaxPrice ? String(currentMaxPrice) : '');
    setQInput(currentQ || '');
  }, [currentCategory, currentMinPrice, currentMaxPrice, currentQ]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    // Reset pagination ke halaman 1 saat filter baru diterapkan
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

  const hasActiveFilters = Boolean(
    (selectedCategory && selectedCategory !== 'all') ||
      minPriceInput ||
      maxPriceInput ||
      qInput
  );

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs transition-colors">
      <form onSubmit={handleApplyFilter} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          {/* 1. Pencarian Kata Kunci */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-q" className="text-xs font-semibold text-muted-foreground">
              Cari Buku / Penulis
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="filter-q"
                type="text"
                placeholder="Judul, penulis, ISBN..."
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* 2. Pilihan Kategori */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-category" className="text-xs font-semibold text-muted-foreground">
              Kategori Buku
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(val) => setSelectedCategory(val)}
            >
              <SelectTrigger id="filter-category" className="h-9 text-xs">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Kategori
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Rentang Harga Min & Max */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Rentang Harga (IDR)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="h-9 text-xs"
                min="0"
                step="5000"
              />
              <span className="text-muted-foreground text-xs">—</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="h-9 text-xs"
                min="0"
                step="5000"
              />
            </div>
          </div>

          {/* 4. Tombol Aksi Filter */}
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <Button type="submit" size="sm" className="flex-1 h-9 gap-1.5 text-xs font-medium">
              <Filter className="h-3.5 w-3.5" />
              Terapkan
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilter}
                className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
