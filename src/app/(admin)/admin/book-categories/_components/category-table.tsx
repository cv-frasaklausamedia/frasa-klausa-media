'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Tags, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

import type { BookCategoryItem, CategoryListResponse } from '@/lib/categories/types';
import { getCategoryColumns } from './category-table-columns';
import { CategoryTableToolbar } from './category-table-toolbar';
import { CategoryDialog } from './category-dialog';
import { CategoryDeleteDialog } from './category-delete-dialog';

interface CategoryTableProps {
  initialData: CategoryListResponse;
}

export function CategoryTable({ initialData }: CategoryTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<BookCategoryItem | null>(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BookCategoryItem | null>(null);

  // State parameter saat ini dari initialData
  const { items, totalCount, page, pageSize, pageCount } = initialData;

  const currentQ = searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || 'created_at_desc';

  // Helper untuk memperbarui query string di URL
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

  const handleSortChange = useCallback(
    (field: string) => {
      let nextSort = `${field}_desc`;
      if (currentSort === `${field}_desc`) {
        nextSort = `${field}_asc`;
      } else if (currentSort === `${field}_asc`) {
        nextSort = `${field}_desc`;
      }
      updateUrlParams({ sort: nextSort, page: 1 });
    },
    [currentSort, updateUrlParams]
  );

  const handleOpenAdd = useCallback(() => {
    setCategoryToEdit(null);
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((category: BookCategoryItem) => {
    setCategoryToEdit(category);
    setDialogOpen(true);
  }, []);

  const handleOpenDelete = useCallback((category: BookCategoryItem) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      getCategoryColumns({
        onEdit: handleOpenEdit,
        onDelete: handleOpenDelete,
        onSort: handleSortChange,
        currentSort,
      }),
    [handleOpenEdit, handleOpenDelete, handleSortChange, currentSort]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount: totalCount,
    pageCount,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
  });

  const fromIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const toIndex = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* Toolbar Pencarian, Page Size, dan Tambah */}
      <CategoryTableToolbar
        searchQuery={currentQ}
        pageSize={pageSize}
        onSearchChange={handleSearchChange}
        onPageSizeChange={handlePageSizeChange}
        onAddNew={handleOpenAdd}
        isPending={isPending}
      />

      {/* Tabel Data Responsif */}
      <div
        className={`relative rounded-md border bg-card transition-opacity ${
          isPending ? 'opacity-60' : 'opacity-100'
        }`}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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
                      <Inbox className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-sm font-medium">
                        {currentQ
                          ? `Tidak ada kategori yang cocok dengan "${currentQ}"`
                          : 'Belum ada data kategori buku.'}
                      </p>
                      {currentQ ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSearchChange('')}
                          className="text-xs"
                        >
                          Bersihkan pencarian
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOpenAdd}
                          className="text-xs mt-1"
                        >
                          <Tags className="mr-1.5 h-3.5 w-3.5" /> Tambah Kategori Pertama
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">
        <div className="text-xs text-muted-foreground order-2 sm:order-1">
          Menampilkan <span className="font-medium text-foreground">{fromIndex}</span> -{' '}
          <span className="font-medium text-foreground">{toIndex}</span> dari{' '}
          <span className="font-medium text-foreground">{totalCount}</span> kategori
        </div>

        <div className="flex items-center space-x-1.5 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isPending}
            className="h-8 px-2.5 text-xs"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sebelumnya
          </Button>

          <span className="text-xs font-medium px-2">
            Halaman {page} dari {pageCount}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pageCount || isPending}
            className="h-8 px-2.5 text-xs"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Dialog Form Tambah / Edit */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categoryToEdit={categoryToEdit}
      />

      {/* Dialog Konfirmasi Hapus */}
      <CategoryDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        category={categoryToDelete}
      />
    </div>
  );
}
