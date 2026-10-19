'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { FileText, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

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
  PostListItem,
  PostListResponse,
  BlogCategoryOption,
} from '@/lib/posts/types';
import { togglePostStatusAction } from '@/actions/post';
import { getPostColumns } from './post-table-columns';
import { PostTableToolbar } from './post-table-toolbar';
import { PostDeleteDialog } from './post-delete-dialog';

interface PostTableProps {
  initialData: PostListResponse;
  categories: BlogCategoryOption[];
}

export function PostTable({ initialData, categories }: PostTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<PostListItem | null>(null);

  // Data dari server
  const { items, totalCount, page, pageSize, pageCount } = initialData;

  const currentQ = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category_id') || 'all';
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
      updateUrlParams({ category_id: catId, page: 1 });
    },
    [updateUrlParams]
  );

  const handleStatusChange = useCallback(
    (status: string) => {
      updateUrlParams({ status, page: 1 });
    },
    [updateUrlParams]
  );

  const handleSortChange = useCallback(
    (sort: string) => {
      updateUrlParams({ sort, page: 1 });
    },
    [updateUrlParams]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      updateUrlParams({ pageSize: size, page: 1 });
    },
    [updateUrlParams]
  );

  // Handler Aksi Baris
  const handleDeleteClick = useCallback((post: PostListItem) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  }, []);

  const handleToggleStatusClick = useCallback(
    (post: PostListItem) => {
      const nextStatus = post.status === 'published' ? 'draft' : 'published';
      const label = nextStatus === 'published' ? 'diterbitkan' : 'dijadikan draf';

      startTransition(async () => {
        try {
          const response = await togglePostStatusAction(post.id, nextStatus);
          if (response.ok) {
            toast.success(`Artikel "${post.title}" berhasil ${label}.`);
            router.refresh();
          } else {
            toast.error(response.error.message || `Gagal mengubah status artikel.`);
          }
        } catch (err) {
          console.error('[PostTable] Toggle status error:', err);
          toast.error('Terjadi kesalahan saat mengubah status.');
        }
      });
    },
    [router]
  );

  // Definisi Kolom TanStack Table
  const columns = useMemo(
    () =>
      getPostColumns({
        onDeleteClick: handleDeleteClick,
        onToggleStatusClick: handleToggleStatusClick,
        isPending,
      }),
    [handleDeleteClick, handleToggleStatusClick, isPending]
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
      <PostTableToolbar
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

      {/* Tabel Utama */}
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold">
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
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium">Tidak ada artikel yang ditemukan.</p>
                    <p className="text-xs">
                      {currentQ || currentCategory !== 'all' || currentStatus !== 'all'
                        ? 'Coba sesuaikan kata kunci pencarian atau filter yang dipilih.'
                        : 'Mulai dengan menulis artikel literasi pertama Anda.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Footer Paginasi */}
        <div className="border-t bg-muted/10 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            Menampilkan{' '}
            <span className="font-medium text-foreground">
              {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}
            </span>{' '}
            hingga{' '}
            <span className="font-medium text-foreground">
              {Math.min(page * pageSize, totalCount)}
            </span>{' '}
            dari <span className="font-medium text-foreground">{totalCount}</span> artikel
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs">
              Halaman {page} dari {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => updateUrlParams({ page: page - 1 })}
                disabled={page <= 1 || isPending}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => updateUrlParams({ page: page + 1 })}
                disabled={page >= pageCount || isPending}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Konfirmasi Hapus */}
      <PostDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        post={postToDelete}
      />
    </div>
  );
}
