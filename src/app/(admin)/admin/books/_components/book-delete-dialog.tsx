'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteBookAction } from '@/actions/book';
import type { BookListItem } from '@/lib/books/types';

interface BookDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: BookListItem | null;
  onSuccess?: () => void;
}

export function BookDeleteDialog({
  open,
  onOpenChange,
  book,
  onSuccess,
}: BookDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!book) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteBookAction(book.id);

      if (!res.ok) {
        toast.error(res.error.message || 'Gagal menghapus buku.');
        return;
      }

      toast.success(`Buku "${book.title}" berhasil dihapus.`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('[BookDeleteDialog] Delete error:', error);
      toast.error('Terjadi kendala saat menghapus data buku.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2.5 text-destructive shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold">
                Hapus Buku
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
                Tindakan ini permanen dan tidak dapat dibatalkan.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="py-2 text-sm text-foreground space-y-2">
          <p>
            Apakah Anda yakin ingin menghapus buku{' '}
            <strong className="font-semibold text-foreground">
              &quot;{book.title}&quot;
            </strong>{' '}
            karya <span className="italic">{book.author}</span>?
          </p>
          <p className="text-xs text-muted-foreground">
            Seluruh data galeri foto dan gambar sampul buku terkait di media storage juga akan dibersihkan secara otomatis.
          </p>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isDeleting}>
            Batal
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <span>Hapus Sekarang</span>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
