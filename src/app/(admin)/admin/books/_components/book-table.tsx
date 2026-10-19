'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { BookOpen, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

import type {
  BookListItem,
  BookListResponse,
  BookCategoryOption,
} from '@/lib/books/types';
import { getBookColumns } from './book-table-columns';
import { BookTableToolbar } from './book-table-toolbar';
import { BookDeleteDialog } from './book-delete-dialog';

interface BookTableProps {
  initialData: BookListResponse;
  categories: BookCategoryOption[];
}

export function BookTable({ initialData, categories }: BookTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<BookListItem | null>(null);

  // Data dari server
  const { items, totalCount, page, pageSize, pageCount } = initialData;

  const currentQ = searchParams.get('q') || '';
  const currentCategory =
    searchParams.get('category_id') || searchParams.get('categoryId') || 'all';
  const currentStatus = searchParams.get('status') || 'all';
  const currentSort = searchParams.get('sort') || 'created_at_desc';

  // Helper untuk memperbarui URL query string via useTransition
  const updateUrlParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'all' || (key === 'page' && value === 1)) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  // Handler Event Toolbar
  const handleSearchChange = useCallback(
    (q: string) => {
      updateUrlParams({ q: q || null, page: 1 });
    },
    [updateUrlParams]
  );

  const handleCategoryChange = useCallback(
    (catId: string) => {
      // Hapus juga legacy categoryId jika ada di URL lama
      const params = new URLSearchParams(searchParams.toString());
      params.delete('categoryId');
      if (catId === 'all' || !catId) {
        params.delete('category_id');
      } else {
        params.set('category_id', catId);
      }
      params.set('page', '1');

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const handleStatusChange = useCallback(
    (statusVal: string) => {
      updateUrlParams({ status: statusVal, page: 1 });
    },
    [updateUrlParams]
  );

  const handleSortChange = useCallback(
    (sortVal: string) => {
      updateUrlParams({ sort: sortVal, page: 1 });
    },
    [updateUrlParams]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      updateUrlParams({ pageSize: size, page: 1 });
    },
    [updateUrlParams]
  );

  // Sorting header click toggle
  const handleHeaderSort = useCallback(
    (columnKey: string) => {
      let nextSort = 'created_at_desc';

      if (columnKey === 'title') {
        nextSort = currentSort === 'title_asc' ? 'title_desc' : 'title_asc';
      } else if (columnKey === 'price') {
        nextSort = currentSort === 'price_asc' ? 'price_desc' : 'price_asc';
      }

      updateUrlParams({ sort: nextSort, page: 1 });
    },
    [currentSort, updateUrlParams]
  );

  // Buka dialog konfirmasi hapus
  const handleDeleteBook = useCallback((book: BookListItem) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      getBookColumns({
        currentSort,
        onSort: handleHeaderSort,
        onDelete: handleDeleteBook,
      }),
    [currentSort, handleHeaderSort, handleDeleteBook]
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
      {/* Toolbar Filter & Pencarian */}
      <BookTableToolbar
        searchQuery={currentQ}
        categoryId={currentCategory}
        status={currentStatus}
        sort={currentSort}
        pageSize={pageSize}
        categories={categories}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
        onSortChange={handleSortChange}
        onPageSizeChange={handlePageSizeChange}
        isPending={isPending}
      />

      {/* Tabel Data Buku */}
      <div className="rounded-md border bg-card overflow-hidden relative">
        {isPending && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center transition-all duration-200">
            <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-md border text-sm font-medium">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Memperbarui data...</span>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-2.5 px-3 text-xs font-semibold">
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
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 px-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    {currentQ || currentCategory !== 'all' || currentStatus !== 'all' ? (
                      <>
                        <Inbox className="h-8 w-8 stroke-[1.5]" />
                        <p className="text-sm font-medium">
                          Tidak ditemukan buku dengan filter yang dipilih
                        </p>
                        <p className="text-xs">
                          Coba ubah kata kunci pencarian atau sesuaikan opsi filter Anda.
                        </p>
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-8 w-8 stroke-[1.5]" />
                        <p className="text-sm font-medium">Belum ada buku terdaftar</p>
                        <p className="text-xs">
                          Mulai tambahkan produk buku baru untuk ditampilkan di katalog publik.
                        </p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Paginasi Terintegrasi URL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">
        <p className="text-xs text-muted-foreground">
          Menampilkan{' '}
          <span className="font-medium text-foreground">
            {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{' '}
          sampai{' '}
          <span className="font-medium text-foreground">
            {Math.min(page * pageSize, totalCount)}
          </span>{' '}
          dari <span className="font-medium text-foreground">{totalCount}</span> buku
        </p>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateUrlParams({ page: page - 1 })}
            disabled={page <= 1 || isPending}
            className="h-8 gap-1 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Sebelumnya</span>
          </Button>

          <span className="text-xs font-medium text-muted-foreground px-2">
            Halaman {page} dari {pageCount}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => updateUrlParams({ page: page + 1 })}
            disabled={page >= pageCount || isPending}
            className="h-8 gap-1 text-xs"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Hapus Buku */}
      <BookDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        book={bookToDelete}
        onSuccess={() => {
          setBookToDelete(null);
          router.refresh();
        }}
      />
    </div>
  );
}
