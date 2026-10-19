'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Bookmark, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

import type { BlogCategoryItem, BlogCategoryListResponse } from '@/lib/blog-categories/types';
import { getBlogCategoryColumns } from './blog-category-table-columns';
import { BlogCategoryTableToolbar } from './blog-category-table-toolbar';
import { BlogCategoryDialog } from './blog-category-dialog';
import { BlogCategoryDeleteDialog } from './blog-category-delete-dialog';

interface BlogCategoryTableProps {
  initialData: BlogCategoryListResponse;
}

export function BlogCategoryTable({ initialData }: BlogCategoryTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<BlogCategoryItem | null>(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BlogCategoryItem | null>(null);

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

  const handleOpenEdit = useCallback((category: BlogCategoryItem) => {
    setCategoryToEdit(category);
    setDialogOpen(true);
  }, []);

  const handleOpenDelete = useCallback((category: BlogCategoryItem) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      getBlogCategoryColumns({
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
      {/* Toolbar Pencarian, Limit Baris, dan Tombol Tambah */}
      <BlogCategoryTableToolbar
        searchQuery={currentQ}
        pageSize={pageSize}
        onSearchChange={handleSearchChange}
        onPageSizeChange={handlePageSizeChange}
        onAddNew={handleOpenAdd}
        isPending={isPending}
      />

      {/* Tabel Data TanStack */}
      <div className="rounded-md border bg-card overflow-hidden relative shadow-xs">
        {isPending && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center transition-opacity" />
        )}

        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 text-xs">
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
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 text-xs">
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
                  <div className="flex flex-col items-center justify-center gap-2">
                    {currentQ ? (
                      <>
                        <Inbox className="h-8 w-8 text-muted-foreground/60" />
                        <p className="text-sm font-medium text-foreground">
                          Tidak ada kategori yang cocok
                        </p>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          Pencarian &quot;{currentQ}&quot; tidak menemukan hasil. Coba kata kunci lain atau bersihkan pencarian.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1 h-8 text-xs"
                          onClick={() => handleSearchChange('')}
                        >
                          Bersihkan Pencarian
                        </Button>
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-8 w-8 text-muted-foreground/60" />
                        <p className="text-sm font-medium text-foreground">
                          Belum ada kategori blog
                        </p>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          Mulai dengan menambahkan kategori blog baru untuk mengelompokkan artikel dan topik literasi.
                        </p>
                        <Button
                          size="sm"
                          className="mt-1 h-8 text-xs"
                          onClick={handleOpenAdd}
                        >
                          Tambah Kategori Pertama
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Kontrol Navigasi Paginasi */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">
        <div className="text-xs text-muted-foreground">
          {totalCount > 0 ? (
            <span>
              Menampilkan <strong>{fromIndex}</strong> – <strong>{toIndex}</strong> dari{' '}
              <strong>{totalCount}</strong> kategori
            </span>
          ) : (
            <span>0 kategori ditemukan</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isPending}
            className="h-8 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Sebelumnya
          </Button>

          <span className="text-xs text-muted-foreground px-1">
            Halaman {page} dari {pageCount}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pageCount || isPending}
            className="h-8 text-xs"
          >
            Selanjutnya
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Dialog Form Tambah / Edit */}
      <BlogCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categoryToEdit={categoryToEdit}
      />

      {/* Dialog Konfirmasi Hapus */}
      <BlogCategoryDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        category={categoryToDelete}
      />
    </div>
  );
}
