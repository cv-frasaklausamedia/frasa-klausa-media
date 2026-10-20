'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  Sparkles,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { BannerListResponse, BannerWithComputedStatus } from '@/lib/banners/types';
import { formatWibDateTime } from '@/validations/banner';
import { toggleBannerActiveAction, deleteBannerAction } from '@/actions/banner';
import { BannerFormDialog } from './banner-form-dialog';

interface BannerTableProps {
  initialData: BannerListResponse;
}

export function BannerTable({ initialData }: BannerTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || 'all';

  const [searchInput, setSearchInput] = React.useState(currentSearch);
  const [editingBanner, setEditingBanner] = React.useState<BannerWithComputedStatus | null>(null);
  const [deletingBanner, setDeletingBanner] = React.useState<BannerWithComputedStatus | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  // Sinkronisasi filter pencarian ke URL dengan debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== currentSearch) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput.trim()) {
          params.set('search', searchInput.trim());
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, currentSearch, pathname, router, searchParams]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    router.push(pathname);
  };

  // Toggle status aktif dari baris tabel
  const handleToggleActive = async (banner: BannerWithComputedStatus) => {
    const newActive = !banner.is_active;
    setTogglingId(banner.id);
    try {
      const res = await toggleBannerActiveAction(banner.id, newActive);
      if (res.ok) {
        toast.success(
          newActive ? 'Banner promosi diaktifkan' : 'Banner promosi dinonaktifkan'
        );
        router.refresh();
      } else {
        toast.error(res.error.message || 'Gagal mengubah status banner');
      }
    } catch {
      toast.error('Terjadi kesalahan saat mengubah status');
    } finally {
      setTogglingId(null);
    }
  };

  // Konfirmasi hapus banner
  const handleDeleteConfirm = async () => {
    if (!deletingBanner) return;
    setIsDeleting(true);
    try {
      const res = await deleteBannerAction(deletingBanner.id);
      if (res.ok) {
        toast.success('Banner promosi berhasil dihapus');
        setDeletingBanner(null);
        router.refresh();
      } else {
        toast.error(res.error.message || 'Gagal menghapus banner');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus banner');
    } finally {
      setIsDeleting(false);
    }
  };

  const { data: banners, meta } = initialData;

  const renderStatusBadge = (status: BannerWithComputedStatus['scheduleStatus'], isActive: boolean) => {
    if (!isActive) {
      return (
        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
          Nonaktif
        </Badge>
      );
    }
    switch (status) {
      case 'active_now':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif Sekarang
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20">
            Akan Datang
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            Kedaluwarsa
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Bar Filter & Aksi Tambah */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Input Pencarian */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari pesan banner..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 text-xs sm:text-sm h-9"
            />
          </div>

          {/* Filter Status */}
          <Select
            value={currentStatus}
            onValueChange={(val) => updateParam('status', val)}
          >
            <SelectTrigger className="w-[160px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status ({meta.counts.all})</SelectItem>
              <SelectItem value="active_now">
                Aktif Sekarang ({meta.counts.active_now})
              </SelectItem>
              <SelectItem value="upcoming">
                Akan Datang ({meta.counts.upcoming})
              </SelectItem>
              <SelectItem value="expired">
                Kedaluwarsa ({meta.counts.expired})
              </SelectItem>
              <SelectItem value="inactive">
                Nonaktif ({meta.counts.inactive})
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {(currentSearch || currentStatus !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Tombol Tambah Banner */}
        <BannerFormDialog onSuccess={() => router.refresh()} />
      </div>

      {/* Tabel Data Banner */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[35%] min-w-[260px]">Pesan Banner</TableHead>
                <TableHead className="w-[20%] min-w-[150px]">Tautan Tujuan</TableHead>
                <TableHead className="w-[25%] min-w-[200px]">Jadwal Tayang (WIB)</TableHead>
                <TableHead className="w-[10%] min-w-[110px] text-center">Status</TableHead>
                <TableHead className="w-[10%] min-w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-foreground">
                          Belum Ada Banner Promosi
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {currentSearch || currentStatus !== 'all'
                            ? 'Tidak ada banner yang cocok dengan kriteria pencarian dan filter.'
                            : 'Buat banner promosi pertama Anda untuk menampilkan pengumuman diskon dan buku unggulan di publik.'}
                        </p>
                      </div>
                      <BannerFormDialog onSuccess={() => router.refresh()} />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                banners.map((banner) => {
                  const isToggling = togglingId === banner.id;
                  const isExternal = banner.link_url?.startsWith('http');

                  return (
                    <TableRow key={banner.id} className="hover:bg-muted/20">
                      {/* Kolom Pesan */}
                      <TableCell className="align-middle">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground text-sm line-clamp-2">
                            {banner.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Dibuat: {new Date(banner.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </TableCell>

                      {/* Kolom Tautan */}
                      <TableCell className="align-middle text-xs">
                        {banner.link_url ? (
                          <a
                            href={banner.link_url}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px] max-w-[200px] truncate"
                          >
                            <span>{banner.link_url}</span>
                            {isExternal && <ExternalLink className="h-3 w-3 shrink-0" />}
                          </a>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            Tanpa tautan
                          </span>
                        )}
                      </TableCell>

                      {/* Kolom Jadwal (WIB) */}
                      <TableCell className="align-middle text-xs">
                        <div className="space-y-0.5 text-muted-foreground">
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>{formatWibDateTime(banner.starts_at)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="h-3.5 w-3.5 shrink-0 opacity-60" />
                            <span>s.d. {formatWibDateTime(banner.ends_at)}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Kolom Status & Toggle */}
                      <TableCell className="align-middle text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {renderStatusBadge(banner.scheduleStatus, banner.is_active)}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <Switch
                              id={`switch-${banner.id}`}
                              checked={banner.is_active}
                              disabled={isToggling}
                              onCheckedChange={() => handleToggleActive(banner)}
                              className="scale-75"
                            />
                            <label
                              htmlFor={`switch-${banner.id}`}
                              className="text-[10px] text-muted-foreground cursor-pointer"
                            >
                              {banner.is_active ? 'On' : 'Off'}
                            </label>
                          </div>
                        </div>
                      </TableCell>

                      {/* Kolom Aksi */}
                      <TableCell className="align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingBanner(banner)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Edit Banner"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingBanner(banner)}
                            className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            title="Hapus Banner"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginasi Shadcn */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Menampilkan{' '}
              <span className="font-semibold text-foreground">
                {(meta.page - 1) * meta.pageSize + 1}
              </span>{' '}
              –{' '}
              <span className="font-semibold text-foreground">
                {Math.min(meta.page * meta.pageSize, meta.total)}
              </span>{' '}
              dari <span className="font-semibold text-foreground">{meta.total}</span> banner
            </p>

            <Pagination className="justify-end w-auto mx-0">
              <PaginationContent>
                {meta.page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(meta.page - 1);
                      }}
                      className="cursor-pointer h-8 text-xs"
                    />
                  </PaginationItem>
                )}

                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => {
                  if (
                    p === 1 ||
                    p === meta.totalPages ||
                    (p >= meta.page - 1 && p <= meta.page + 1)
                  ) {
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === meta.page}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(p);
                          }}
                          className="cursor-pointer h-8 w-8 text-xs"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (p === meta.page - 2 || p === meta.page + 2) {
                    return (
                      <PaginationItem key={p}>
                        <PaginationEllipsis className="h-8 w-8" />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                {meta.page < meta.totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(meta.page + 1);
                      }}
                      className="cursor-pointer h-8 text-xs"
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Dialog Edit Banner */}
      {editingBanner && (
        <BannerFormDialog
          banner={editingBanner}
          open={Boolean(editingBanner)}
          onOpenChange={(open) => {
            if (!open) setEditingBanner(null);
          }}
          onSuccess={() => {
            setEditingBanner(null);
            router.refresh();
          }}
        />
      )}

      {/* AlertDialog Hapus Banner */}
      <AlertDialog
        open={Boolean(deletingBanner)}
        onOpenChange={(open) => {
          if (!open) setDeletingBanner(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Hapus Banner Promosi?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Apakah Anda yakin ingin menghapus banner ini? Tindakan ini tidak dapat dibatalkan.
              {deletingBanner && (
                <div className="mt-2 rounded-md bg-muted p-2.5 font-mono text-xs text-foreground line-clamp-2">
                  &ldquo;{deletingBanner.message}&rdquo;
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Hapus Permanen</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
