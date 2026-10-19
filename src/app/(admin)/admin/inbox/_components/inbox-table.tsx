'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  Mail,
  Trash2,
  Eye,
  CheckCircle2,
  Archive,
  RotateCcw,
  MoreVertical,
  Inbox as InboxIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import type { InquiryItem, InquiryListResponse } from '@/lib/inquiries/types';
import type { InquiryStatus } from '@/types/database';
import { formatDateIndo } from '@/lib/utils';
import { updateInquiryStatusAction, deleteInquiryAction } from '@/actions/inquiry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { InboxDetailDialog } from './inbox-detail-dialog';

interface InboxTableProps {
  initialData: InquiryListResponse;
  currentStatus: string;
  currentQ: string;
}

export function InboxTable({
  initialData,
  currentStatus,
  currentQ,
}: InboxTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedInquiry, setSelectedInquiry] = React.useState<InquiryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [inquiryToDelete, setInquiryToDelete] = React.useState<InquiryItem | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const [searchTerm, setSearchTerm] = React.useState(currentQ);

  const updateFilters = (params: { status?: string; q?: string; page?: number }) => {
    const current = new URLSearchParams(searchParams.toString());

    if (params.status !== undefined) {
      if (params.status === 'all') current.delete('status');
      else current.set('status', params.status);
      current.set('page', '1');
    }

    if (params.q !== undefined) {
      if (!params.q.trim()) current.delete('q');
      else current.set('q', params.q.trim());
      current.set('page', '1');
    }

    if (params.page !== undefined) {
      if (params.page <= 1) current.delete('page');
      else current.set('page', String(params.page));
    }

    const qs = current.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchTerm });
  };

  const handleStatusChange = async (id: string, status: InquiryStatus) => {
    setIsUpdating(true);
    try {
      const res = await updateInquiryStatusAction({ id, status });
      if (!res.ok) {
        toast.error(res.error.message || 'Gagal mengubah status pesan.');
        return;
      }

      toast.success(res.data.message);
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry({ ...selectedInquiry, status });
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kendala.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!inquiryToDelete) return;
    setIsUpdating(true);
    try {
      const res = await deleteInquiryAction(inquiryToDelete.id);
      if (!res.ok) {
        toast.error(res.error.message || 'Gagal menghapus pesan.');
        return;
      }

      toast.success(res.data.message);
      setInquiryToDelete(null);
      if (selectedInquiry?.id === inquiryToDelete.id) {
        setIsDetailOpen(false);
        setSelectedInquiry(null);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kendala saat menghapus.');
    } finally {
      setIsUpdating(false);
    }
  };

  const { items: inquiries, totalCount, page, pageCount } = initialData;

  const STATUS_TABS = [
    { label: 'Semua', value: 'all' },
    { label: 'Belum Dibaca', value: 'unread' },
    { label: 'Telah Dibalas', value: 'replied' },
    { label: 'Diarsipkan', value: 'archived' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Baris Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_TABS.map((tab) => {
            const isActive = currentStatus === tab.value;
            return (
              <Button
                key={tab.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ status: tab.value })}
                className="text-xs h-8 px-3 shrink-0"
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Pencarian Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, email, subjek..."
              className="pl-8 text-xs h-9"
              aria-label="Cari pesan"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-9 px-3 text-xs">
            Cari
          </Button>
        </form>
      </div>

      {/* 2. Tabel Pesan Masuk */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 sm:px-6">Pengirim</th>
                <th className="px-4 py-3 sm:px-6">Subjek & Cuplikan</th>
                <th className="px-4 py-3 sm:px-6">Status</th>
                <th className="px-4 py-3 sm:px-6">Tanggal Kirim</th>
                <th className="px-4 py-3 sm:px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                      <InboxIcon className="h-6 w-6 opacity-40" />
                    </div>
                    <p className="font-medium text-sm text-foreground">Tidak Ada Pesan Masuk</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentStatus !== 'all' || currentQ
                        ? 'Tidak ada pesan yang sesuai dengan filter saat ini.'
                        : 'Belum ada pesan pertanyaan atau penawaran naskah dari pembaca.'}
                    </p>
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => {
                  const isUnread = inquiry.status === 'unread';

                  return (
                    <tr
                      key={inquiry.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isUnread ? 'bg-primary/5 font-medium' : ''
                      }`}
                    >
                      {/* Kolom Pengirim */}
                      <td className="px-4 py-3 sm:px-6">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            {isUnread && (
                              <span
                                className="h-2 w-2 rounded-full bg-primary shrink-0"
                                title="Pesan Baru"
                              />
                            )}
                            {inquiry.name}
                          </span>
                          <span className="text-xs text-muted-foreground block">
                            {inquiry.email}
                          </span>
                          {inquiry.phone && (
                            <span className="text-[11px] text-muted-foreground block">
                              Tel/WA: {inquiry.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kolom Subjek & Pesan */}
                      <td className="px-4 py-3 sm:px-6 max-w-xs sm:max-w-md">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInquiry(inquiry);
                            setIsDetailOpen(true);
                          }}
                          className="text-left group block w-full focus-visible:outline-hidden"
                        >
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                            {inquiry.subject}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {inquiry.message}
                          </span>
                        </button>
                      </td>

                      {/* Kolom Status */}
                      <td className="px-4 py-3 sm:px-6 whitespace-nowrap">
                        <Badge
                          variant={
                            inquiry.status === 'unread'
                              ? 'destructive'
                              : inquiry.status === 'replied'
                                ? 'default'
                                : 'secondary'
                          }
                          className="text-[11px] font-medium uppercase"
                        >
                          {inquiry.status === 'unread'
                            ? 'Belum Dibaca'
                            : inquiry.status === 'replied'
                              ? 'Telah Dibalas'
                              : 'Diarsipkan'}
                        </Badge>
                      </td>

                      {/* Kolom Tanggal */}
                      <td className="px-4 py-3 sm:px-6 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateIndo(inquiry.created_at)}
                      </td>

                      {/* Kolom Aksi */}
                      <td className="px-4 py-3 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Buka Pesan"
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Buka Detail Pesan</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Menu Opsi</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              {inquiry.status !== 'replied' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(inquiry.id, 'replied')}
                                >
                                  <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                  Tandai Telah Dibalas
                                </DropdownMenuItem>
                              )}
                              {inquiry.status !== 'archived' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(inquiry.id, 'archived')}
                                >
                                  <Archive className="mr-2 h-3.5 w-3.5" />
                                  Arsipkan Pesan
                                </DropdownMenuItem>
                              )}
                              {inquiry.status !== 'unread' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(inquiry.id, 'unread')}
                                >
                                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                  Tandai Belum Dibaca
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setInquiryToDelete(inquiry)}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Hapus Pesan
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Paginasi Tabel */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6 text-xs text-muted-foreground">
            <div>
              Halaman {page} dari {pageCount} ({totalCount} total pesan)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: page - 1 })}
                className="h-8 text-xs px-2.5"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => updateFilters({ page: page + 1 })}
                className="h-8 text-xs px-2.5"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog Detail Pesan */}
      <InboxDetailDialog
        inquiry={selectedInquiry}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
      />

      {/* Alert Dialog Konfirmasi Hapus */}
      <AlertDialog
        open={Boolean(inquiryToDelete)}
        onOpenChange={(open) => !open && setInquiryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pesan Masuk?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Apakah Anda yakin ingin menghapus pesan dari &ldquo;{inquiryToDelete?.name}&rdquo; perihal &ldquo;{inquiryToDelete?.subject}&rdquo;? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating} className="text-xs">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isUpdating}
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs"
            >
              Ya, Hapus Pesan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
