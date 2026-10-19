'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PublicCatalogSortOption } from '@/validations/book';

interface KatalogSortSelectProps {
  currentSort?: PublicCatalogSortOption;
}

const SORT_LABELS: Record<PublicCatalogSortOption, string> = {
  created_at_desc: 'Terbaru',
  created_at_asc: 'Terlama',
  price_asc: 'Harga: Termurah',
  price_desc: 'Harga: Tertinggi',
  title_asc: 'Judul: A - Z',
  title_desc: 'Judul: Z - A',
  year_desc: 'Tahun: Terbaru',
  year_asc: 'Tahun: Terlama',
};

export function KatalogSortSelect({ currentSort = 'created_at_desc' }: KatalogSortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    // Pertahankan halaman saat ini atau reset jika diinginkan
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline-block">
        Urutkan:
      </span>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="h-9 w-[170px] text-xs">
          <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 opacity-60" />
          <SelectValue placeholder="Urutkan" />
        </SelectTrigger>
        <SelectContent align="end">
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
