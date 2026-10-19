'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, CheckCircle2, Archive, RotateCcw, ExternalLink } from 'lucide-react';
import type { InquiryItem } from '@/lib/inquiries/types';
import type { InquiryStatus } from '@/types/database';
import { formatDateIndo } from '@/lib/utils';

interface InboxDetailDialogProps {
  inquiry: InquiryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: InquiryStatus) => Promise<void>;
  isUpdating?: boolean;
}

export function InboxDetailDialog({
  inquiry,
  open,
  onOpenChange,
  onStatusChange,
  isUpdating = false,
}: InboxDetailDialogProps) {
  if (!inquiry) return null;

  const cleanPhone = inquiry.phone ? inquiry.phone.replace(/[^0-9]/g, '') : null;
  const waNumber = cleanPhone
    ? cleanPhone.startsWith('0')
      ? `62${cleanPhone.slice(1)}`
      : cleanPhone
    : null;

  const mailtoUrl = `mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`;
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo ${inquiry.name}, menanggapi pesan Anda perihal "${inquiry.subject}":`)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 border-b pb-4">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-xl font-serif font-bold text-foreground">
              {inquiry.subject}
            </DialogTitle>
            <Badge
              variant={
                inquiry.status === 'unread'
                  ? 'destructive'
                  : inquiry.status === 'replied'
                    ? 'default'
                    : 'secondary'
              }
              className="text-xs uppercase shrink-0"
            >
              {inquiry.status === 'unread'
                ? 'Belum Dibaca'
                : inquiry.status === 'replied'
                  ? 'Telah Dibalas'
                  : 'Diarsipkan'}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Dikirim pada {formatDateIndo(inquiry.created_at)}
          </DialogDescription>
        </DialogHeader>

        {/* Info Pengirim */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b text-xs sm:text-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">
              Nama Pengirim
            </span>
            <p className="font-medium text-foreground">{inquiry.name}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">
              Alamat Email
            </span>
            <p className="font-medium text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={mailtoUrl} className="hover:text-primary hover:underline">
                {inquiry.email}
              </a>
            </p>
          </div>

          {inquiry.phone && (
            <div className="space-y-1 sm:col-span-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Nomor Telepon / WhatsApp
              </span>
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{inquiry.phone}</span>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 ml-2"
                  >
                    Chat WA <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Isi Pesan */}
        <div className="py-4 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Isi Pesan
          </span>
          <div className="rounded-xl border bg-muted/30 p-4 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {inquiry.message}
          </div>
        </div>

        {/* Tindakan Cepat */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between border-t pt-4">
          {/* Tindakan Eksternal */}
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
              <a href={mailtoUrl}>
                <Mail className="h-3.5 w-3.5" /> Balas Email
              </a>
            </Button>
            {waUrl && (
              <Button asChild size="sm" variant="outline" className="text-xs gap-1.5 text-emerald-600">
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <Phone className="h-3.5 w-3.5" /> Chat WhatsApp
                </a>
              </Button>
            )}
          </div>

          {/* Tombol Perubahan Status */}
          <div className="flex gap-2 flex-wrap">
            {inquiry.status !== 'replied' && (
              <Button
                size="sm"
                variant="default"
                disabled={isUpdating}
                onClick={() => onStatusChange(inquiry.id, 'replied')}
                className="text-xs gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Tandai Dibalas
              </Button>
            )}

            {inquiry.status !== 'archived' && (
              <Button
                size="sm"
                variant="secondary"
                disabled={isUpdating}
                onClick={() => onStatusChange(inquiry.id, 'archived')}
                className="text-xs gap-1.5"
              >
                <Archive className="h-3.5 w-3.5" /> Arsipkan
              </Button>
            )}

            {inquiry.status !== 'unread' && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isUpdating}
                onClick={() => onStatusChange(inquiry.id, 'unread')}
                className="text-xs gap-1.5 text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Tandai Belum Dibaca
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
